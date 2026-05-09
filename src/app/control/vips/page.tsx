"use client";

import { useEffect, useState } from "react";

interface VipRow {
  grant: {
    id: string;
    monthlyBudgetCoins: number;
    monthSpentCoins: number;
    active: boolean;
    notes: string | null;
    monthAnchor: string;
  };
  user: { id: string; email: string; name: string | null } | null;
}

export default function AdminVipsPage() {
  const [vips, setVips] = useState<VipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", monthlyBudgetCoins: 1000, notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/vips");
    const json = await res.json();
    if (json.ok) setVips(json.vips);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/vips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.ok) {
      setForm({ email: "", monthlyBudgetCoins: 1000, notes: "" });
      load();
    } else {
      setError(json.error || "Failed");
    }
    setSubmitting(false);
  }

  return (
    <div>
      <div className="label">System · VIP grants</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        VIPs ({vips.length})
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-2)" }}>
        VIP users get pulls billed against a monthly budget pool. When the
        pool is empty for the month, pulls fall back to wallet balance.
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 32,
          padding: 24,
          border: "1px solid var(--ink)",
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        <label>
          <span className="label">Email</span>
          <input
            type="email"
            required
            className="input-paper"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          <span className="label">Monthly budget (coins)</span>
          <input
            type="number"
            required
            className="input-paper"
            value={form.monthlyBudgetCoins}
            onChange={(e) =>
              setForm({ ...form, monthlyBudgetCoins: parseInt(e.target.value) || 0 })
            }
          />
        </label>
        <label>
          <span className="label">Notes</span>
          <input
            type="text"
            className="input-paper"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        <div style={{ gridColumn: "1 / -1" }}>
          <button
            type="submit"
            className="btn-lever"
            disabled={submitting || !form.email}
          >
            {submitting ? "Granting…" : "Grant VIP"}
          </button>
          {error && (
            <span
              className="mono"
              style={{ marginLeft: 16, color: "var(--danger)", fontSize: 12 }}
            >
              {error.toUpperCase()}
            </span>
          )}
        </div>
      </form>

      <div style={{ marginTop: 48 }}>
        {loading ? (
          <p className="mono" style={{ fontSize: 12 }}>LOADING…</p>
        ) : vips.length === 0 ? (
          <p className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
            NO VIPS GRANTED YET
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--ink)", textAlign: "left" }}>
                <th className="label" style={{ padding: "8px 0" }}>Email</th>
                <th className="label" style={{ padding: "8px 0" }}>Budget</th>
                <th className="label" style={{ padding: "8px 0" }}>Spent (month)</th>
                <th className="label" style={{ padding: "8px 0" }}>Anchor</th>
                <th className="label" style={{ padding: "8px 0" }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {vips.map((v) => (
                <tr key={v.grant.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "10px 0", fontSize: 14 }}>
                    {v.user?.email ?? "—"}
                  </td>
                  <td style={{ padding: "10px 0", fontSize: 14 }}>{v.grant.monthlyBudgetCoins}</td>
                  <td style={{ padding: "10px 0", fontSize: 14 }}>{v.grant.monthSpentCoins}</td>
                  <td className="mono" style={{ padding: "10px 0", fontSize: 11, color: "var(--ink-3)" }}>
                    {new Date(v.grant.monthAnchor).toLocaleDateString()}
                  </td>
                  <td className="mono" style={{ padding: "10px 0", fontSize: 11, color: v.grant.active ? "var(--success)" : "var(--ink-3)" }}>
                    {v.grant.active ? "YES" : "NO"}
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
