import { sql } from "@vercel/postgres";

export async function initDb() {
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      blob_url TEXT NOT NULL,
      original_language TEXT NOT NULL,
      content_language TEXT NOT NULL DEFAULT 'EN',
      doc_type TEXT NOT NULL,
      chunk_size INT DEFAULT 1000,
      chunk_overlap INT DEFAULT 200,
      uploaded_at TIMESTAMP DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chunks (
      id SERIAL PRIMARY KEY,
      document_id INT REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index INT NOT NULL,
      content TEXT NOT NULL,
      tokens INT,
      metadata JSONB DEFAULT '{}'
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_documents_language ON documents(original_language)`;

  // Full-text search
  try {
    await sql`ALTER TABLE chunks ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED`;
  } catch {
    // Column already exists
  }
  await sql`CREATE INDEX IF NOT EXISTS idx_chunks_search ON chunks USING gin(search_vector)`;
}

export async function listDocuments(filters?: {
  docType?: string;
  language?: string;
}) {
  if (filters?.docType && filters?.language) {
    const { rows } = await sql`
      SELECT d.*, COUNT(c.id)::int as chunk_count
      FROM documents d
      LEFT JOIN chunks c ON c.document_id = d.id
      WHERE d.doc_type = ${filters.docType} AND d.original_language = ${filters.language}
      GROUP BY d.id ORDER BY d.uploaded_at DESC
    `;
    return rows;
  }
  if (filters?.docType) {
    const { rows } = await sql`
      SELECT d.*, COUNT(c.id)::int as chunk_count
      FROM documents d
      LEFT JOIN chunks c ON c.document_id = d.id
      WHERE d.doc_type = ${filters.docType}
      GROUP BY d.id ORDER BY d.uploaded_at DESC
    `;
    return rows;
  }
  if (filters?.language) {
    const { rows } = await sql`
      SELECT d.*, COUNT(c.id)::int as chunk_count
      FROM documents d
      LEFT JOIN chunks c ON c.document_id = d.id
      WHERE d.original_language = ${filters.language}
      GROUP BY d.id ORDER BY d.uploaded_at DESC
    `;
    return rows;
  }
  const { rows } = await sql`
    SELECT d.*, COUNT(c.id)::int as chunk_count
    FROM documents d
    LEFT JOIN chunks c ON c.document_id = d.id
    GROUP BY d.id ORDER BY d.uploaded_at DESC
  `;
  return rows;
}

export async function getDocument(id: number) {
  const { rows } = await sql`
    SELECT d.*, COUNT(c.id)::int as chunk_count
    FROM documents d
    LEFT JOIN chunks c ON c.document_id = d.id
    WHERE d.id = ${id}
    GROUP BY d.id
  `;
  return rows[0] || null;
}

export async function insertDocument(doc: {
  filename: string;
  blob_url: string;
  original_language: string;
  content_language: string;
  doc_type: string;
  chunk_size: number;
  chunk_overlap: number;
}) {
  const { rows } = await sql`
    INSERT INTO documents (filename, blob_url, original_language, content_language, doc_type, chunk_size, chunk_overlap)
    VALUES (${doc.filename}, ${doc.blob_url}, ${doc.original_language}, ${doc.content_language}, ${doc.doc_type}, ${doc.chunk_size}, ${doc.chunk_overlap})
    RETURNING *
  `;
  return rows[0];
}

export async function updateDocument(
  id: number,
  fields: { chunk_size?: number; chunk_overlap?: number; doc_type?: string; original_language?: string }
) {
  if (fields.chunk_size !== undefined && fields.chunk_overlap !== undefined) {
    const { rows } = await sql`
      UPDATE documents SET chunk_size = ${fields.chunk_size}, chunk_overlap = ${fields.chunk_overlap} WHERE id = ${id} RETURNING *
    `;
    return rows[0];
  }
  if (fields.doc_type) {
    const { rows } = await sql`
      UPDATE documents SET doc_type = ${fields.doc_type} WHERE id = ${id} RETURNING *
    `;
    return rows[0];
  }
  return null;
}

export async function deleteDocument(id: number) {
  await sql`DELETE FROM documents WHERE id = ${id}`;
}

export async function insertChunks(
  documentId: number,
  chunks: { index: number; content: string; tokens: number }[]
) {
  for (const chunk of chunks) {
    await sql`
      INSERT INTO chunks (document_id, chunk_index, content, tokens)
      VALUES (${documentId}, ${chunk.index}, ${chunk.content}, ${chunk.tokens})
    `;
  }
}

export async function deleteChunksForDocument(documentId: number) {
  await sql`DELETE FROM chunks WHERE document_id = ${documentId}`;
}

export async function getChunksForDocument(documentId: number) {
  const { rows } = await sql`
    SELECT * FROM chunks WHERE document_id = ${documentId} ORDER BY chunk_index
  `;
  return rows;
}

export async function searchChunks(
  query: string,
  filters?: { docType?: string; language?: string },
  topK: number = 10
) {
  const tsQuery = query
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^\w]/g, ""))
    .filter(Boolean)
    .join(" | ");

  if (!tsQuery) return [];

  if (filters?.docType && filters?.language) {
    const { rows } = await sql`
      SELECT c.id, c.document_id, c.chunk_index, c.content, c.tokens,
             d.filename, d.doc_type, d.original_language,
             ts_rank_cd(c.search_vector, to_tsquery('english', ${tsQuery})) as score
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE c.search_vector @@ to_tsquery('english', ${tsQuery})
        AND d.doc_type = ${filters.docType}
        AND d.original_language = ${filters.language}
      ORDER BY score DESC
      LIMIT ${topK}
    `;
    return rows;
  }
  if (filters?.docType) {
    const { rows } = await sql`
      SELECT c.id, c.document_id, c.chunk_index, c.content, c.tokens,
             d.filename, d.doc_type, d.original_language,
             ts_rank_cd(c.search_vector, to_tsquery('english', ${tsQuery})) as score
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE c.search_vector @@ to_tsquery('english', ${tsQuery})
        AND d.doc_type = ${filters.docType}
      ORDER BY score DESC
      LIMIT ${topK}
    `;
    return rows;
  }
  if (filters?.language) {
    const { rows } = await sql`
      SELECT c.id, c.document_id, c.chunk_index, c.content, c.tokens,
             d.filename, d.doc_type, d.original_language,
             ts_rank_cd(c.search_vector, to_tsquery('english', ${tsQuery})) as score
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE c.search_vector @@ to_tsquery('english', ${tsQuery})
        AND d.original_language = ${filters.language}
      ORDER BY score DESC
      LIMIT ${topK}
    `;
    return rows;
  }

  const { rows } = await sql`
    SELECT c.id, c.document_id, c.chunk_index, c.content, c.tokens,
           d.filename, d.doc_type, d.original_language,
           ts_rank_cd(c.search_vector, to_tsquery('english', ${tsQuery})) as score
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE c.search_vector @@ to_tsquery('english', ${tsQuery})
    ORDER BY score DESC
    LIMIT ${topK}
  `;
  return rows;
}
