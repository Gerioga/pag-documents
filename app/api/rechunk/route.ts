import { NextRequest, NextResponse } from "next/server";
import {
  initDb,
  getDocument,
  updateDocument,
  deleteChunksForDocument,
  insertChunks,
} from "@/lib/db";
import { extractText } from "@/lib/parser";
import { chunkText } from "@/lib/chunker";

export async function POST(request: NextRequest) {
  try {
    await initDb();

    const body = await request.json();
    const { documentId, chunkSize, chunkOverlap } = body;

    if (!documentId || !chunkSize || !chunkOverlap) {
      return NextResponse.json(
        { error: "documentId, chunkSize, and chunkOverlap required" },
        { status: 400 }
      );
    }

    const doc = await getDocument(documentId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Re-download from blob and re-extract text
    const response = await fetch(doc.blob_url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = await extractText(buffer, doc.filename);

    // Re-chunk
    const chunks = chunkText(text, { chunkSize, chunkOverlap });

    // Replace chunks
    await deleteChunksForDocument(documentId);
    await insertChunks(documentId, chunks);

    // Update document params
    await updateDocument(documentId, { chunk_size: chunkSize, chunk_overlap: chunkOverlap });

    return NextResponse.json({
      documentId,
      chunkSize,
      chunkOverlap,
      chunks_created: chunks.length,
    });
  } catch (err) {
    console.error("Rechunk error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Rechunk failed" },
      { status: 500 }
    );
  }
}
