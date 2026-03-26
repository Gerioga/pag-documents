export interface ChunkConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export interface Chunk {
  index: number;
  content: string;
  tokens: number;
}

// Default chunk params by doc type
export const DEFAULT_CHUNK_PARAMS: Record<string, ChunkConfig> = {
  Law: { chunkSize: 1500, chunkOverlap: 300 },
  Decree: { chunkSize: 1000, chunkOverlap: 200 },
  Regulation: { chunkSize: 1000, chunkOverlap: 200 },
  Rulebook: { chunkSize: 800, chunkOverlap: 150 },
  Strategy: { chunkSize: 2000, chunkOverlap: 400 },
  "PFM Doc": { chunkSize: 2000, chunkOverlap: 400 },
};

export function chunkText(text: string, config: ChunkConfig): Chunk[] {
  // Normalize whitespace
  const clean = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();

  if (!clean) return [];

  const { chunkSize, chunkOverlap } = config;
  const chunks: Chunk[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = start + chunkSize;

    if (end < clean.length) {
      // Try to break at paragraph boundary
      const paragraphBreak = clean.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + chunkSize * 0.5) {
        end = paragraphBreak;
      } else {
        // Try sentence boundary
        const sentenceBreak = clean.lastIndexOf(". ", end);
        if (sentenceBreak > start + chunkSize * 0.5) {
          end = sentenceBreak + 1;
        }
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

    // Move forward by chunkSize - overlap
    const step = end - start - chunkOverlap;
    start += Math.max(step, 1);
  }

  return chunks;
}
