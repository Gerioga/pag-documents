import Anthropic from "@anthropic-ai/sdk";
import { searchChunks } from "./db";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert on Serbian public asset governance legislation and policy.
Answer questions based ONLY on the provided document excerpts below.
For each claim, cite the source document filename and chunk number in brackets, e.g. [Law_on_Public_Property, chunk 5].
If the answer is not in the provided documents, say so clearly.
Be precise and structured in your responses.`;

export async function ragQuery(
  message: string,
  filters?: { docType?: string; language?: string },
  history?: { role: "user" | "assistant"; content: string }[],
  topK: number = 10
): Promise<ReadableStream> {
  // Search for relevant chunks
  const results = await searchChunks(message, filters, topK);

  // Build context from chunks
  let context = "";
  if (results.length === 0) {
    context = "No relevant document excerpts found for this query.";
  } else {
    context = results
      .map(
        (r, i) =>
          `[${i + 1}] Source: ${r.filename} (${r.doc_type}) | Chunk ${r.chunk_index}\n${r.content}`
      )
      .join("\n\n---\n\n");
  }

  const systemMessage = `${SYSTEM_PROMPT}\n\n--- DOCUMENT EXCERPTS ---\n\n${context}`;

  // Build messages array
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  if (history) {
    messages.push(...history);
  }
  messages.push({ role: "user", content: message });

  // Stream response
  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemMessage,
    messages,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      // Send sources first
      const sourcesData = JSON.stringify({
        type: "sources",
        sources: results.map((r) => ({
          filename: r.filename,
          docType: r.doc_type,
          chunkIndex: r.chunk_index,
          score: r.score,
        })),
      });
      controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));

      stream.on("text", (text) => {
        const data = JSON.stringify({ type: "text", text });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      stream.on("end", () => {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      });

      stream.on("error", (err) => {
        const data = JSON.stringify({
          type: "error",
          error: err.message,
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      });
    },
  });
}

export async function runScript(
  scriptPrompt: string,
  filters?: { docType?: string[] },
  topK: number = 20
): Promise<ReadableStream> {
  // For scripts, search broadly with multiple queries from the prompt
  const keywords = scriptPrompt.split(/\s+/).slice(0, 5).join(" ");
  const allResults = await searchChunks(keywords, undefined, topK);

  // Filter by doc types if specified
  let filtered = allResults;
  if (filters?.docType?.length) {
    filtered = allResults.filter((r) =>
      filters.docType!.includes(r.doc_type)
    );
  }

  const context =
    filtered.length === 0
      ? "No relevant document excerpts found."
      : filtered
          .map(
            (r, i) =>
              `[${i + 1}] Source: ${r.filename} (${r.doc_type}) | Chunk ${r.chunk_index}\n${r.content}`
          )
          .join("\n\n---\n\n");

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: `You are an expert analyst of Serbian public governance legislation. Provide structured, detailed analysis. Cite sources using [filename, chunk N] format.`,
    messages: [
      {
        role: "user",
        content: `${scriptPrompt}\n\n--- DOCUMENT EXCERPTS ---\n\n${context}`,
      },
    ],
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      stream.on("text", (text) => {
        const data = JSON.stringify({ type: "text", text });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      stream.on("end", () => {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      });

      stream.on("error", (err) => {
        const data = JSON.stringify({ type: "error", error: err.message });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      });
    },
  });
}
