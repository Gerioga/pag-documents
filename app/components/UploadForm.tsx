"use client";

import { useState, useRef } from "react";
import { DEFAULT_CHUNK_PARAMS } from "@/lib/chunker";

const DOC_TYPES = ["Law", "Decree", "Regulation", "Rulebook", "Strategy", "PFM Doc"];
const LANGUAGES = ["EN", "SR-CYR", "SR-LAT"];

export default function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Law");
  const [language, setLanguage] = useState("SR-CYR");
  const [chunkSize, setChunkSize] = useState(1500);
  const [chunkOverlap, setChunkOverlap] = useState(300);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDocTypeChange(type: string) {
    setDocType(type);
    const defaults = DEFAULT_CHUNK_PARAMS[type] || { chunkSize: 1000, chunkOverlap: 200 };
    setChunkSize(defaults.chunkSize);
    setChunkOverlap(defaults.chunkOverlap);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);
    formData.append("original_language", language);
    formData.append("content_language", "EN");
    formData.append("chunk_size", chunkSize.toString());
    formData.append("chunk_overlap", chunkOverlap.toString());

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(`Uploaded: ${data.document.filename} (${data.chunks_created} chunks, ${data.text_length.toLocaleString()} chars)`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Upload Document</h2>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) setFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "var(--radius)",
          padding: 40,
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "var(--accent-light)" : "transparent",
          marginBottom: 16,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.html,.htm"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ display: "none" }}
        />
        {file ? (
          <span style={{ fontWeight: 600 }}>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
        ) : (
          <span style={{ color: "var(--muted)" }}>Drop PDF, DOCX, or HTML here (or click)</span>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
            Document Type
          </label>
          <select
            value={docType}
            onChange={(e) => handleDocTypeChange(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
            Original Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chunking params */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
            Chunk Size (chars)
          </label>
          <input
            type="number"
            value={chunkSize}
            onChange={(e) => setChunkSize(parseInt(e.target.value) || 1000)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
            Chunk Overlap (chars)
          </label>
          <input
            type="number"
            value={chunkOverlap}
            onChange={(e) => setChunkOverlap(parseInt(e.target.value) || 200)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
          />
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 15,
          backgroundColor: uploading ? "var(--muted)" : "var(--accent)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius)",
        }}
      >
        {uploading ? "Uploading & Processing..." : "Upload & Chunk"}
      </button>

      {result && (
        <p style={{ marginTop: 12, color: "var(--success)", fontSize: 14 }}>{result}</p>
      )}
      {error && (
        <p style={{ marginTop: 12, color: "var(--danger)", fontSize: 14 }}>{error}</p>
      )}
    </div>
  );
}
