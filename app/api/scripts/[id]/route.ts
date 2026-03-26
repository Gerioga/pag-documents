import { NextRequest } from "next/server";
import { initDb } from "@/lib/db";
import { runScript } from "@/lib/rag";
import { SCRIPTS } from "@/scripts/definitions";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;

    const script = SCRIPTS.find((s) => s.id === id);
    if (!script) {
      return new Response(JSON.stringify({ error: "Script not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = await runScript(
      script.prompt,
      { docType: script.docTypes },
      script.topK
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Script error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Script failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
