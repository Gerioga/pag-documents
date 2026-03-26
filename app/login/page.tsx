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
        fontFamily: "system-ui",
        maxWidth: 400,
        margin: "120px auto",
        padding: "0 20px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>PAG Documents</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>Enter password to continue</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 6,
            boxSizing: "border-box",
          }}
          autoFocus
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 16,
            marginTop: 12,
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Enter
        </button>
        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </form>
    </main>
  );
}
