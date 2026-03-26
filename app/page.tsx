"use client";

import { useState } from "react";
import DocumentList from "./components/DocumentList";
import UploadForm from "./components/UploadForm";
import ChatInterface from "./components/ChatInterface";
import ScriptRunner from "./components/ScriptRunner";

type Tab = "documents" | "chat" | "scripts" | "upload";

export default function Home() {
  const [tab, setTab] = useState<Tab>("documents");
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "documents", label: "Documents" },
    { key: "chat", label: "Chat" },
    { key: "scripts", label: "Scripts" },
    { key: "upload", label: "Upload" },
  ];

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 1100, margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22 }}>PAG Documents</h1>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Serbia Public Asset Governance</span>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "2px solid var(--border)",
          marginBottom: 24,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              border: "none",
              background: "none",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t.key ? "var(--accent)" : "var(--muted)",
              fontWeight: tab === t.key ? 600 : 400,
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "documents" && <DocumentList refreshKey={refreshKey} />}
      {tab === "chat" && <ChatInterface />}
      {tab === "scripts" && <ScriptRunner />}
      {tab === "upload" && (
        <UploadForm
          onUploaded={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </main>
  );
}
