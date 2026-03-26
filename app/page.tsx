"use client";

import { useState } from "react";
import DocumentList from "./components/DocumentList";
import UploadForm from "./components/UploadForm";
import ChatInterface from "./components/ChatInterface";
import ScriptRunner from "./components/ScriptRunner";

type Tab = "about" | "documents" | "chat" | "scripts" | "upload";

export default function Home() {
  const [tab, setTab] = useState<Tab>("about");
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "about", label: "About" },
    { key: "documents", label: "Documents" },
    { key: "chat", label: "Chat" },
    { key: "scripts", label: "Scripts" },
    { key: "upload", label: "Upload" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "16px 0",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src="/pim-pam-logo.png"
              alt="PIM-PAM"
              style={{ height: 40 }}
            />
            <div style={{ height: 28, width: 1, background: "rgba(255,255,255,0.15)" }} />
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                PAG Document AI
              </h1>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: -2 }}>
                Serbia — Public Asset Governance
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            gap: 0,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: tab === t.key ? 600 : 500,
                border: "none",
                background: "none",
                borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === t.key ? "#ffffff" : "var(--muted)",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {tab === "about" && (
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              padding: 40,
              maxWidth: 800,
              color: "var(--fg-dark)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 20,
                color: "var(--fg-dark)",
              }}
            >
              About this tool
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#444" }}>
              The PAG Document AI is an analytical platform designed to help policy makers
              and government officials navigate Serbia's public asset governance legal framework.
              It uses AI to search, cross-reference, and analyze the full corpus of laws, decrees,
              and regulations governing public property — identifying regulatory gaps, overlaps,
              and areas where the legal framework falls short of EU standards. Similar to the{" "}
              <a
                href="https://pim-pam.net/web-applications/#ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
              >
                PIM-PAM public investment management tools
              </a>
              , this platform translates complex legislation into actionable policy insights
              through structured analysis scripts and an interactive AI chat assistant.
            </p>
          </div>
        )}

        {tab === "documents" && (
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              padding: 28,
              color: "var(--fg-dark)",
            }}
          >
            <DocumentList refreshKey={refreshKey} />
          </div>
        )}

        {tab === "chat" && (
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              padding: 28,
              color: "var(--fg-dark)",
            }}
          >
            <ChatInterface />
          </div>
        )}

        {tab === "scripts" && (
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              padding: 28,
              color: "var(--fg-dark)",
            }}
          >
            <ScriptRunner />
          </div>
        )}

        {tab === "upload" && (
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              padding: 28,
              color: "var(--fg-dark)",
            }}
          >
            <UploadForm
              onUploaded={() => setRefreshKey((k) => k + 1)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 24px 40px",
          textAlign: "center",
          fontSize: 12,
          color: "var(--muted)",
        }}
      >
        Public Investment Management — Public Asset Management · pim-pam.net
      </footer>
    </div>
  );
}
