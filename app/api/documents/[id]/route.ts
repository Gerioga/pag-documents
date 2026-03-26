import { NextRequest, NextResponse } from "next/server";
import {
  initDb,
  getDocument,
  updateDocument,
  deleteDocument,
  getChunksForDocument,
  deleteChunksForDocument,
  insertChunks,
} from "@/lib/db";
import { deleteFromBlob } from "@/lib/blob";
import { extractText } from "@/lib/parser";
import { chunkText } from "@/lib/chunker";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const doc = await getDocument(parseInt(id));
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const chunks = await getChunksForDocument(doc.id);
    return NextResponse.json({ ...doc, chunks });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const body = await request.json();
    const doc = await updateDocument(parseInt(id), body);
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const doc = await getDocument(parseInt(id));
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete blob file
    try {
      await deleteFromBlob(doc.blob_url);
    } catch {
      // Blob may already be deleted
    }

    await deleteDocument(parseInt(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
