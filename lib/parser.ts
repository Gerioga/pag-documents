import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as cheerio from "cheerio";

export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    // Strip null bytes that break Postgres UTF-8
    return data.text.replace(/\0/g, "");
  }

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    const $ = cheerio.load(buffer.toString("utf-8"));
    // Remove script and style tags
    $("script, style").remove();
    return $("body").text().replace(/\s+/g, " ").trim();
  }

  throw new Error(`Unsupported file type: ${filename}`);
}
