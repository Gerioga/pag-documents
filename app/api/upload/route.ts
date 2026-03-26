import { NextRequest, NextResponse } from "next/server";
import { uploadToBlob } from "@/lib/blob";
import { extractText } from "@/lib/parser";
import { chunkText, DEFAULT_CHUNK_PARAMS } from "@/lib/chunker";
import { initDb, insertDocument, insertChunks } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await initDb();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("doc_type") as string;
    const originalLanguage = formData.get("original_language") as string;
    const contentLanguage = (formData.get("content_language") as string) || "EN";
    const customChunkSize = formData.get("chunk_size")
      ? parseInt(formData.get("chunk_size") as string)
      : null;
    const customChunkOverlap = formData.get("chunk_overlap")
      ? parseInt(formData.get("chunk_overlap") as string)
      : null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!docType || !originalLanguage) {
      return NextResponse.json(
        { error: "doc_type and original_language are required" },
        { status: 400 }
      );
    }

    const validTypes = [".pdf", ".docx", ".html", ".htm"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validTypes.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${ext}. Accepted: PDF, DOCX, HTML` },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob
    const blobUrl = await uploadToBlob(file.name, buffer);

    // Extract text
    const text = await extractText(buffer, file.name);

    // Chunk
    const defaults = DEFAULT_CHUNK_PARAMS[docType] || {
      chunkSize: 1000,
      chunkOverlap: 200,
    };
    const chunkSize = customChunkSize || defaults.chunkSize;
    const chunkOverlap = customChunkOverlap || defaults.chunkOverlap;
    const chunks = chunkText(text, { chunkSize, chunkOverlap });

    // Insert document
    const doc = await insertDocument({
      filename: file.name,
      blob_url: blobUrl,
      original_language: originalLanguage,
      content_language: contentLanguage,
      doc_type: docType,
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
    });

    // Insert chunks
    await insertChunks(doc.id, chunks);

    return NextResponse.json({
      document: doc,
      chunks_created: chunks.length,
      text_length: text.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
