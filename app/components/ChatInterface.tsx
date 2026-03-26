"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { filename: string; docType: string; chunkIndex: number; score: number }[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const filters = filterType ? { docType: filterType } : undefined;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, filters, history }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let sources: Message["sources"] = [];

      // Add placeholder assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "", sources: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "sources") {
              sources = parsed.sources;
            } else if (parsed.type === "text") {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                  sources,
                };
                return updated;
              });
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1), // Remove placeholder if exists
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 18 }}>Chat</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: "4px 8px", fontSize: 12, border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
          >
            <option value="">All document types</option>
            {["Law", "Decree", "Regulation", "Rulebook"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => setMessages([])}
            style={{ padding: "4px 12px", fontSize: 12, border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "white" }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, marginBottom: 12 }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 60 }}>
            Ask a question about Serbian public asset governance laws and decrees.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 16,
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: 12,
                background: msg.role === "user" ? "var(--accent)" : "#f0f0f0",
                color: msg.role === "user" ? "#fff" : "var(--fg)",
                fontSize: 14,
                whiteSpace: "pre-wrap",
                textAlign: "left",
              }}
            >
              {msg.content || (loading && i === messages.length - 1 ? "Thinking..." : "")}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {msg.sources.map((s, j) => (
                  <span
                    key={j}
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      padding: "2px 6px",
                      margin: "0 2px",
                      background: "var(--accent-light)",
                      color: "var(--accent)",
                      borderRadius: 8,
                    }}
                  >
                    {s.filename.replace(/_translated_en|\.pdf|\.html/g, "")} #{s.chunkIndex}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask about Serbian laws and decrees..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: 14,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 20px",
            fontSize: 14,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius)",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
