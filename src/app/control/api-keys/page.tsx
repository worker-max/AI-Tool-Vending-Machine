"use client";

import { useEffect, useState } from "react";

interface ApiKey {
  id: string;
  label: string;
  keyPreview: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [justIssued, setJustIssued] = useState<{
    label: string;
    rawKey: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/api-keys");
    const json = await res.json();
    if (json.ok) setKeys(json.keys);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    setIssuing(true);
    setError(null);
    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const json = await res.json();
    if (json.ok) {
      setJustIssued({ label, rawKey: json.rawKey });
      setLabel("");
      load();
    } else {
      setError(json.error || "Failed");
    }
    setIssuing(false);
  }

  async function onRevoke(id: string) {
    if (!confirm("Revoke this key? Active integrations using it will stop working immediately.")) return;
    const res = await fetch(`/api/admin/api-keys/${id}/revoke`, { method: "POST" });
    const json = await res.json();
    if (json.ok) load();
  }

  return (
    <div>
      <div className="label">System · API keys</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        API keys ({keys.filter((k) => !k.revokedAt).length} active)
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-2)", maxWidth: "60ch" }}>
        API keys authenticate external integrations — including the MCP server
        at <code>/api/mcp</code>. Each key is tied to your operator account;
        all pulls bill your wallet (or VIP grant if active).
      </p>

      <div
        className="card-paper"
        style={{
          marginTop: 24,
          padding: 20,
          background: "var(--tangerine-wash)",
          borderLeftWidth: 3,
          borderLeftColor: "var(--tangerine)",
        }}
      >
        <div className="label" style={{ color: "var(--tangerine)" }}>
          MCP setup · Quick reference
        </div>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)" }}>
          Add VEND/AI to <strong>Claude Desktop</strong>, <strong>claude.ai</strong>,
          or <strong>Cursor</strong> as a remote MCP server:
        </p>
        <pre
          className="mono"
          style={{
            marginTop: 12,
            fontSize: 11,
            padding: 12,
            background: "var(--paper-2)",
            overflowX: "auto",
            border: "1px solid var(--hairline)",
          }}
        >{`{
  "vendai": {
    "url": "${typeof window !== "undefined" ? window.location.origin : "https://your-vendai-host"}/api/mcp",
    "headers": { "Authorization": "Bearer va_live_..." }
  }
}`}</pre>
      </div>

      <form
        onSubmit={onIssue}
        style={{
          marginTop: 32,
          padding: 24,
          border: "1px solid var(--ink)",
          display: "grid",
          gap: 16,
          maxWidth: 560,
        }}
      >
        <label>
          <span className="label">Label (e.g. "Claude Desktop · personal Mac")</span>
          <input
            type="text"
            required
            className="input-paper"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-lever" disabled={issuing || !label}>
          {issuing ? "Issuing…" : "Issue new key"}
        </button>
        {error && (
          <div
            className="mono"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              fontSize: 12,
            }}
          >
            {error.toUpperCase()}
          </div>
        )}
      </form>

      {justIssued && (
        <div
          style={{
            marginTop: 24,
            padding: 24,
            border: "1.5px solid var(--ink)",
            background: "#fff",
          }}
        >
          <div className="label" style={{ color: "var(--tangerine)" }}>
            New key · {justIssued.label}
          </div>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "var(--ink-2)",
            }}
          >
            <strong>Copy this key now.</strong> It will not be shown again. The
            stored hash cannot be reversed.
          </p>
          <div
            className="mono"
            style={{
              marginTop: 16,
              padding: "14px 16px",
              background: "var(--ink)",
              color: "var(--paper)",
              fontSize: 12,
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {justIssued.rawKey}
          </div>
          <button
            type="button"
            className="btn-outline"
            style={{ marginTop: 16 }}
            onClick={() => {
              navigator.clipboard.writeText(justIssued.rawKey);
            }}
          >
            Copy to clipboard
          </button>
          <button
            type="button"
            className="btn-outline"
            style={{ marginTop: 16, marginLeft: 12 }}
            onClick={() => setJustIssued(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div style={{ marginTop: 48 }}>
        {loading ? (
          <p className="mono" style={{ fontSize: 12 }}>
            LOADING…
          </p>
        ) : keys.length === 0 ? (
          <p className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
            NO KEYS ISSUED
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--ink)", textAlign: "left" }}>
                <th className="label" style={{ padding: "8px 0" }}>Label</th>
                <th className="label" style={{ padding: "8px 0" }}>Preview</th>
                <th className="label" style={{ padding: "8px 0" }}>Last used</th>
                <th className="label" style={{ padding: "8px 0" }}>State</th>
                <th className="label" style={{ padding: "8px 0", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "12px 0", fontSize: 14 }}>{k.label}</td>
                  <td className="mono" style={{ padding: "12px 0", fontSize: 11, color: "var(--ink-3)" }}>
                    {k.keyPreview}…
                  </td>
                  <td className="mono" style={{ padding: "12px 0", fontSize: 11, color: "var(--ink-3)" }}>
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleDateString()
                      : "UNUSED"}
                  </td>
                  <td
                    className="mono"
                    style={{
                      padding: "12px 0",
                      fontSize: 11,
                      color: k.revokedAt ? "var(--danger)" : "var(--success)",
                    }}
                  >
                    {k.revokedAt ? "REVOKED" : "ACTIVE"}
                  </td>
                  <td style={{ padding: "12px 0", textAlign: "right" }}>
                    {!k.revokedAt && (
                      <button
                        type="button"
                        className="mono"
                        onClick={() => onRevoke(k.id)}
                        style={{
                          background: "none",
                          border: "1px solid var(--danger)",
                          color: "var(--danger)",
                          fontSize: 10,
                          padding: "4px 10px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
