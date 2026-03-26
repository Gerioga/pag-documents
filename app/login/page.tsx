"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Wrong password");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 20px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <img
          src="/pim-pam-logo.png"
          alt="PIM-PAM"
          style={{ height: 48, marginBottom: 24, background: "#ffffff", borderRadius: 4, padding: 6 }}
        />
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 24,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 4,
          }}
        >
          PAG Document AI
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          Serbia — Public Asset Governance
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "var(--radius)",
          padding: 32,
        }}
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 15,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)",
            color: "#ffffff",
            outline: "none",
          }}
          autoFocus
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 15,
            fontWeight: 600,
            marginTop: 12,
            backgroundColor: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          Enter
        </button>
        {error && <p style={{ color: "var(--danger)", marginTop: 12, textAlign: "center", fontSize: 14 }}>{error}</p>}
      </form>
    </main>
  );
}
