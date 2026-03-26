import { NextRequest, NextResponse } from "next/server";
import { initDb, listDocuments } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDb();

    const params = request.nextUrl.searchParams;
    const docType = params.get("doc_type") || undefined;
    const language = params.get("language") || undefined;

    const docs = await listDocuments({ docType, language });

    return NextResponse.json({ total: docs.length, data: docs });
  } catch (err) {
    console.error("List documents error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list documents" },
      { status: 500 }
    );
  }
}
