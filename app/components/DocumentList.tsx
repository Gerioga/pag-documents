"use client";

import { useState, useEffect } from "react";

interface Document {
  id: number;
  filename: string;
  doc_type: string;
  original_language: string;
  chunk_size: number;
  chunk_overlap: number;
  chunk_count: number;
  uploaded_at: string;
}

interface Chunk {
  id: number;
  chunk_index: number;
  content: string;
  tokens: number;
}

export default function DocumentList({ refreshKey }: { refreshKey: number }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterLang, setFilterLang] = useState("");
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [expandedChunk, setExpandedChunk] = useState<number | null>(null);
  const [rechunkDoc, setRechunkDoc] = useState<number | null>(null);
  const [newChunkSize, setNewChunkSize] = useState(1000);
  const [newChunkOverlap, setNewChunkOverlap] = useState(200);
  const [rechunking, setRechunking] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, [refreshKey, filterType, filterLang]);

  async function fetchDocs() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("doc_type", filterType);
    if (filterLang) params.set("language", filterLang);
    const res = await fetch(`/api/documents?${params}`);
    const data = await res.json();
    setDocs(data.data || []);
    setLoading(false);
  }

  async function loadChunks(docId: number) {
    if (expandedDoc === docId) {
      setExpandedDoc(null);
      return;
    }
    const res = await fetch(`/api/chunks?document_id=${docId}`);
    const data = await res.json();
    setChunks(data.data || []);
    setExpandedDoc(docId);
    setExpandedChunk(null);
  }

  async function handleRechunk(docId: number) {
    setRechunking(true);
    try {
      const res = await fetch("/api/rechunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: docId,
          chunkSize: newChunkSize,
          chunkOverlap: newChunkOverlap,
        }),
      });
      if (res.ok) {
        setRechunkDoc(null);
        fetchDocs();
        if (expandedDoc === docId) loadChunks(docId);
      }
    } finally {
      setRechunking(false);
    }
  }

  async function handleDelete(docId: number) {
    if (!confirm("Delete this document and all its chunks?")) return;
    await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    fetchDocs();
    if (expandedDoc === docId) setExpandedDoc(null);
  }

  const cellStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderBottom: "1px solid var(--border)",
    fontSize: 13,
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Documents</h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13 }}
        >
          <option value="">All Types</option>
          {["Law", "Decree", "Regulation", "Rulebook", "Strategy", "PFM Doc"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13 }}
        >
          <option value="">All Languages</option>
          {["EN", "SR-CYR", "SR-LAT"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : docs.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No documents uploaded yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border)" }}>
              <th style={cellStyle}>Filename</th>
              <th style={cellStyle}>Type</th>
              <th style={cellStyle}>Lang</th>
              <th style={cellStyle}>Chunks</th>
              <th style={cellStyle}>Size/Overlap</th>
              <th style={cellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <>
                <tr
                  key={doc.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => loadChunks(doc.id)}
                >
                  <td style={cellStyle}>{doc.filename}</td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        background: "var(--accent-light)",
                        color: "var(--accent)",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    >
                      {doc.doc_type}
                    </span>
                  </td>
                  <td style={cellStyle}>{doc.original_language}</td>
                  <td style={cellStyle}>{doc.chunk_count}</td>
                  <td style={{ ...cellStyle, fontFamily: "var(--mono)", fontSize: 12 }}>
                    {doc.chunk_size}/{doc.chunk_overlap}
                  </td>
                  <td style={cellStyle}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRechunkDoc(rechunkDoc === doc.id ? null : doc.id);
                        setNewChunkSize(doc.chunk_size);
                        setNewChunkOverlap(doc.chunk_overlap);
                      }}
                      style={{
                        padding: "4px 8px",
                        fontSize: 12,
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        background: "white",
                        marginRight: 4,
                      }}
                    >
                      Re-chunk
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      style={{
                        padding: "4px 8px",
                        fontSize: 12,
                        border: "1px solid var(--danger)",
                        borderRadius: "var(--radius)",
                        background: "white",
                        color: "var(--danger)",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {/* Re-chunk panel */}
                {rechunkDoc === doc.id && (
                  <tr key={`rechunk-${doc.id}`}>
                    <td colSpan={6} style={{ padding: 12, background: "#fafafa", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
                        <div>
                          <label style={{ fontSize: 12, color: "var(--muted)" }}>New Chunk Size</label>
                          <input
                            type="number"
                            value={newChunkSize}
                            onChange={(e) => setNewChunkSize(parseInt(e.target.value) || 1000)}
                            style={{ display: "block", width: 120, padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: "var(--muted)" }}>New Overlap</label>
                          <input
                            type="number"
                            value={newChunkOverlap}
                            onChange={(e) => setNewChunkOverlap(parseInt(e.target.value) || 200)}
                            style={{ display: "block", width: 120, padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
                          />
                        </div>
                        <button
                          onClick={() => handleRechunk(doc.id)}
                          disabled={rechunking}
                          style={{
                            padding: "6px 16px",
                            fontSize: 13,
                            background: "var(--accent)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "var(--radius)",
                          }}
                        >
                          {rechunking ? "Processing..." : "Apply"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Expanded chunks */}
                {expandedDoc === doc.id && (
                  <tr key={`chunks-${doc.id}`}>
                    <td colSpan={6} style={{ padding: 0, borderBottom: "2px solid var(--border)" }}>
                      <div style={{ maxHeight: 400, overflow: "auto", background: "#f9f9f9" }}>
                        {chunks.map((chunk) => (
                          <div
                            key={chunk.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedChunk(expandedChunk === chunk.id ? null : chunk.id);
                            }}
                            style={{
                              padding: "8px 16px",
                              borderBottom: "1px solid #eee",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            <span style={{ color: "var(--muted)", marginRight: 8 }}>#{chunk.chunk_index}</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginRight: 8 }}>
                              {chunk.tokens} tok
                            </span>
                            {expandedChunk === chunk.id ? (
                              <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, fontSize: 12, lineHeight: 1.6 }}>
                                {chunk.content}
                              </pre>
                            ) : (
                              <span>{chunk.content.slice(0, 150)}...</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
