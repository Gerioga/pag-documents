import { NextRequest, NextResponse } from "next/server";
import { initDb, getChunksForDocument, searchChunks } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDb();

    const params = request.nextUrl.searchParams;
    const documentId = params.get("document_id");
    const query = params.get("q");
    const docType = params.get("doc_type") || undefined;

    if (documentId) {
      const chunks = await getChunksForDocument(parseInt(documentId));
      return NextResponse.json({ total: chunks.length, data: chunks });
    }

    if (query) {
      const results = await searchChunks(query, { docType }, 20);
      return NextResponse.json({ total: results.length, data: results });
    }

    return NextResponse.json(
      { error: "Provide document_id or q parameter" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
