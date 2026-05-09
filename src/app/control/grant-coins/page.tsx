"use client";

import { useState } from "react";

export default function GrantCoinsPage() {
  const [form, setForm] = useState({ email: "", coins: 100, reason: "" });
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });
    const res = await fetch("/api/admin/grant-coins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.ok) {
      setState({ kind: "success" });
      setForm({ email: "", coins: 100, reason: "" });
    } else {
      setState({ kind: "error", message: json.error || "Failed" });
    }
  }

  return (
    <div>
      <div className="label">System · Grant coins</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        Manual coin grant
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-2)", maxWidth: "60ch" }}>
        Stripe pack purchases land in v1.1. For v1, you grant coins manually
        in response to user requests. Recipient must have signed in at least
        once.
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 32,
          padding: 24,
          border: "1px solid var(--ink)",
          display: "grid",
          gap: 16,
          maxWidth: 480,
        }}
      >
        <label>
          <span className="label">Recipient email</span>
          <input
            type="email"
            required
            className="input-paper"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          <span className="label">Coins to grant</span>
          <input
            type="number"
            required
            className="input-paper"
            value={form.coins}
            onChange={(e) => setForm({ ...form, coins: parseInt(e.target.value) || 0 })}
          />
        </label>
        <label>
          <span className="label">Reason (logged in transaction metadata)</span>
          <input
            type="text"
            className="input-paper"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="e.g. v1_beta_tester"
          />
        </label>
        <button
          type="submit"
          className="btn-lever"
          disabled={state.kind === "submitting" || !form.email || !form.coins}
        >
          {state.kind === "submitting" ? "Granting…" : "Grant coins"}
        </button>
        {state.kind === "success" && (
          <div
            className="mono"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--success)",
              color: "var(--success)",
              fontSize: 12,
            }}
          >
            GRANTED
          </div>
        )}
        {state.kind === "error" && (
          <div
            className="mono"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              fontSize: 12,
            }}
          >
            {state.message.toUpperCase()}
          </div>
        )}
      </form>
    </div>
  );
}
