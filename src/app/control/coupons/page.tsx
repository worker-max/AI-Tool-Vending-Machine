"use client";

import { useEffect, useState } from "react";

interface Coupon {
  id: string;
  code: string;
  grantCoins: number;
  toolSlugRestriction: string | null;
  redemptionCap: number | null;
  redemptionCount: number;
  expiresAt: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    grantCoins: 25,
    toolSlugRestriction: "",
    redemptionCap: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/coupons");
    const json = await res.json();
    if (json.ok) setCoupons(json.coupons);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        grantCoins: form.grantCoins,
        toolSlugRestriction: form.toolSlugRestriction || null,
        redemptionCap: form.redemptionCap ? parseInt(form.redemptionCap) : null,
        notes: form.notes || null,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setForm({ code: "", grantCoins: 25, toolSlugRestriction: "", redemptionCap: "", notes: "" });
      load();
    } else {
      setError(json.error || "Failed");
    }
    setSubmitting(false);
  }

  return (
    <div>
      <div className="label">System · Coupons</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        Coupon codes ({coupons.length})
      </h1>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 32,
          padding: 24,
          border: "1px solid var(--ink)",
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(2, 1fr)",
        }}
      >
        <Field
          label="Code"
          value={form.code}
          onChange={(v) => setForm({ ...form, code: v.toUpperCase() })}
          required
        />
        <Field
          label="Grant coins"
          type="number"
          value={String(form.grantCoins)}
          onChange={(v) => setForm({ ...form, grantCoins: parseInt(v) || 0 })}
          required
        />
        <Field
          label="Tool slug restriction (optional)"
          value={form.toolSlugRestriction}
          onChange={(v) => setForm({ ...form, toolSlugRestriction: v })}
        />
        <Field
          label="Redemption cap (optional)"
          type="number"
          value={form.redemptionCap}
          onChange={(v) => setForm({ ...form, redemptionCap: v })}
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field
            label="Notes (optional)"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button
            type="submit"
            className="btn-lever"
            disabled={submitting || !form.code || !form.grantCoins}
          >
            {submitting ? "Creating…" : "Create coupon"}
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
        ) : coupons.length === 0 ? (
          <p className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
            NO COUPONS YET
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--ink)", textAlign: "left" }}>
                <th className="label" style={{ padding: "8px 0" }}>Code</th>
                <th className="label" style={{ padding: "8px 0" }}>Coins</th>
                <th className="label" style={{ padding: "8px 0" }}>Restriction</th>
                <th className="label" style={{ padding: "8px 0" }}>Cap</th>
                <th className="label" style={{ padding: "8px 0" }}>Redeemed</th>
                <th className="label" style={{ padding: "8px 0" }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                  <td className="mono" style={{ padding: "10px 0", fontSize: 12 }}>{c.code}</td>
                  <td style={{ padding: "10px 0", fontSize: 14 }}>{c.grantCoins}</td>
                  <td className="mono" style={{ padding: "10px 0", fontSize: 11, color: "var(--ink-3)" }}>
                    {c.toolSlugRestriction || "—"}
                  </td>
                  <td style={{ padding: "10px 0", fontSize: 14 }}>{c.redemptionCap ?? "∞"}</td>
                  <td style={{ padding: "10px 0", fontSize: 14 }}>{c.redemptionCount}</td>
                  <td className="mono" style={{ padding: "10px 0", fontSize: 11, color: c.active ? "var(--success)" : "var(--ink-3)" }}>
                    {c.active ? "YES" : "NO"}
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: "block" }}>
      <span className="label" style={{ display: "block", marginBottom: 6 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="input-paper"
      />
    </label>
  );
}
