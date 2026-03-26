import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";

// Inline parser logic (can't import from lib in standalone script easily)
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractTextFromHTML(buffer: Buffer): Promise<string> {
  const cheerio = await import("cheerio");
  const $ = cheerio.load(buffer.toString("utf-8"));
  $("script, style").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

// Inline chunker
function chunkText(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): { index: number; content: string; tokens: number }[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!clean) return [];

  const chunks: { index: number; content: string; tokens: number }[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = start + chunkSize;
    if (end < clean.length) {
      const pb = clean.lastIndexOf("\n\n", end);
      if (pb > start + chunkSize * 0.5) {
        end = pb;
      } else {
        const sb = clean.lastIndexOf(". ", end);
        if (sb > start + chunkSize * 0.5) end = sb + 1;
      }
    } else {
      end = clean.length;
    }

    const content = clean.slice(start, end).trim();
    if (content) {
      chunks.push({
        index: chunks.length,
        content,
        tokens: Math.ceil(content.length / 4),
      });
    }

    const step = end - start - chunkOverlap;
    start += Math.max(step, 1);
  }

  return chunks;
}

const SEED_PATH =
  process.env.SEED_PATH ||
  "/Users/rug/Dropbox/PAG/Serbia official documents";

const SEED_FILES = [
  // Laws
  { path: "Laws/Constitution_of_Serbia_2006_ENG.pdf", lang: "EN", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Constitution_of_Serbia_2006_SRB_CYR_translated_en.pdf", lang: "SR-CYR", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Company_Law_SRB_LAT_translated_en.pdf", lang: "SR-LAT", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Law_on_Ministries_SRB_LAT_translated_en.pdf", lang: "SR-LAT", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Law_on_Planning_and_Construction_SRB_CYR_translated_en.pdf", lang: "SR-CYR", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Law_on_Post_Flood_Rehabilitation_2014_SRB_LAT_translated_en.pdf", lang: "SR-LAT", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Law_on_Property_Restitution_SRB_CYR_translated_en.pdf", lang: "SR-CYR", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Law_on_Property_Tax_SRB_LAT_translated_en.pdf", lang: "SR-LAT", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Law_on_Public_Enterprises_SRB_CYR_translated_en.pdf", lang: "SR-CYR", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Law_on_Public_Property_SRB_LAT_translated_en.pdf", lang: "SR-LAT", type: "Law", size: 1500, overlap: 300 },
  { path: "Laws/Law_on_State_Audit_Institution_SRB_CYR_translated_en.pdf", lang: "SR-CYR", type: "Law", size: 1500, overlap: 300 },
  // Decrees
  { path: "Decrees and Regulations/Decree_Centralized_Public_Procurement_34_2019_SRB_LAT_translated_en.html", lang: "SR-LAT", type: "Decree", size: 1000, overlap: 200 },
  { path: "Decrees and Regulations/Decree_Meta_Registry_eGovernment_104_2018_SRB_CYR_translated_en.pdf", lang: "SR-CYR", type: "Decree", size: 1000, overlap: 200 },
  { path: "Decrees and Regulations/Decree_Record_Real_Estate_Public_Property_SRB_CYR_translated_en.pdf", lang: "SR-CYR", type: "Decree", size: 1000, overlap: 200 },
  { path: "Decrees and Regulations/Decree_State_Program_Renovation_Education_Floods_2023_SRB_CYR_translated_en.pdf", lang: "SR-CYR", type: "Decree", size: 1000, overlap: 200 },
  { path: "Decrees and Regulations/Rulebook_Real_Estate_Valuation_113_2014_SRB_CYR_translated_en.pdf", lang: "SR-CYR", type: "Rulebook", size: 800, overlap: 150 },
];

async function initDb() {
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

  try {
    await sql`ALTER TABLE chunks ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED`;
  } catch {
    // Already exists
  }
  await sql`CREATE INDEX IF NOT EXISTS idx_chunks_search ON chunks USING gin(search_vector)`;
}

async function main() {
  console.log("Initializing database...");
  await initDb();

  for (let i = 0; i < SEED_FILES.length; i++) {
    const entry = SEED_FILES[i];
    const fullPath = path.join(SEED_PATH, entry.path);
    const filename = path.basename(entry.path);

    console.log(`[${i + 1}/${SEED_FILES.length}] Processing: ${filename}`);

    // Check if already seeded
    const { rows: existing } = await sql`SELECT id FROM documents WHERE filename = ${filename}`;
    if (existing.length > 0) {
      console.log(`  Skipping (already exists)`);
      continue;
    }

    // Read file
    const buffer = fs.readFileSync(fullPath);

    // Upload to Blob
    const blob = await put(filename, buffer, { access: "public" });
    console.log(`  Uploaded to Blob: ${blob.url.slice(0, 60)}...`);

    // Extract text
    let text: string;
    if (filename.endsWith(".html")) {
      text = await extractTextFromHTML(buffer);
    } else {
      text = await extractTextFromPDF(buffer);
    }
    console.log(`  Extracted ${text.length.toLocaleString()} chars`);

    // Chunk
    const chunks = chunkText(text, entry.size, entry.overlap);
    console.log(`  Created ${chunks.length} chunks`);

    // Insert document
    const { rows } = await sql`
      INSERT INTO documents (filename, blob_url, original_language, content_language, doc_type, chunk_size, chunk_overlap)
      VALUES (${filename}, ${blob.url}, ${entry.lang}, ${"EN"}, ${entry.type}, ${entry.size}, ${entry.overlap})
      RETURNING id
    `;
    const docId = rows[0].id;

    // Insert chunks
    for (const chunk of chunks) {
      await sql`
        INSERT INTO chunks (document_id, chunk_index, content, tokens)
        VALUES (${docId}, ${chunk.index}, ${chunk.content}, ${chunk.tokens})
      `;
    }

    console.log(`  Done (doc ID: ${docId})`);
  }

  console.log("\nSeeding complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
