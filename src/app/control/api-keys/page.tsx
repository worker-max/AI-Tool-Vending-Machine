import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminApiKeysPage() {
  const keys = db
    ? await db.select().from(schema.apiKeys).orderBy(desc(schema.apiKeys.createdAt))
    : [];

  return (
    <div>
      <div className="label">System · API keys</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        API keys ({keys.length})
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-2)", maxWidth: "60ch" }}>
        For external automation. Schema scaffolded in v1; issuance UI lands in
        v1.1.
      </p>

      <div style={{ marginTop: 32, display: "grid", gap: 12 }}>
        {keys.length === 0 && (
          <p className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
            NO API KEYS ISSUED
          </p>
        )}
        {keys.map((k) => (
          <div
            key={k.id}
            style={{
              padding: 16,
              border: "1px solid var(--ink)",
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{k.label}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                {k.keyPreview}…
              </div>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {k.lastUsedAt ? `LAST ${new Date(k.lastUsedAt).toLocaleDateString()}` : "UNUSED"}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: k.revokedAt ? "var(--danger)" : "var(--success)",
              }}
            >
              {k.revokedAt ? "REVOKED" : "ACTIVE"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
