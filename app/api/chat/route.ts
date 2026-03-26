import { NextRequest } from "next/server";
import { initDb } from "@/lib/db";
import { ragQuery } from "@/lib/rag";

export async function POST(request: NextRequest) {
  try {
    await initDb();

    const body = await request.json();
    const { message, filters, history } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = await ragQuery(message, filters, history);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Chat failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
