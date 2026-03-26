"use client";

import { useState, useEffect } from "react";

interface Script {
  id: string;
  name: string;
  description: string;
  docTypes: string[];
}

export default function ScriptRunner() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [output, setOutput] = useState("");

  useEffect(() => {
    fetch("/api/scripts")
      .then((r) => r.json())
      .then((d) => setScripts(d.data || []));
  }, []);

  async function runScript(scriptId: string) {
    setRunning(scriptId);
    setOutput("");

    try {
      const res = await fetch(`/api/scripts/${scriptId}`, { method: "POST" });
      if (!res.ok) throw new Error("Script execution failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              text += parsed.text;
              setOutput(text);
            }
          } catch {
            // Skip
          }
        }
      }
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Analysis Scripts</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 24 }}>
        {scripts.map((s) => (
          <div
            key={s.id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>{s.name}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>{s.description}</p>
            <div style={{ marginBottom: 8 }}>
              {s.docTypes.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-block",
                    fontSize: 11,
                    padding: "2px 6px",
                    marginRight: 4,
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    borderRadius: 8,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <button
              onClick={() => runScript(s.id)}
              disabled={running !== null}
              style={{
                padding: "6px 16px",
                fontSize: 13,
                background: running === s.id ? "var(--muted)" : "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius)",
              }}
            >
              {running === s.id ? "Running..." : "Run"}
            </button>
          </div>
        ))}
      </div>

      {output && (
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Output</h3>
          <div
            style={{
              background: "#f9f9f9",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 16,
              maxHeight: 500,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
