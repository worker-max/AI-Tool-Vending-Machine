import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const tools = db
    ? await db.select().from(schema.tools).orderBy(desc(schema.tools.createdAt))
    : [];

  return (
    <div>
      <div className="label">Content · Tools</div>
      <h1
        style={{
          marginTop: 12,
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        Registered tools ({tools.length})
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-2)" }}>
        Native tools live in <code>src/lib/tools/definitions/</code> and
        register at boot. v1 admin shows the published state; full CRUD ships
        in v1.1.
      </p>

      <table
        style={{
          marginTop: 32,
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--ink)", textAlign: "left" }}>
            <th className="label" style={{ padding: "8px 0" }}>
              Slot
            </th>
            <th className="label" style={{ padding: "8px 0" }}>
              Glyph
            </th>
            <th className="label" style={{ padding: "8px 0" }}>
              Slug
            </th>
            <th className="label" style={{ padding: "8px 0" }}>
              Name
            </th>
            <th className="label" style={{ padding: "8px 0" }}>
              Shape
            </th>
            <th className="label" style={{ padding: "8px 0" }}>
              Pkg
            </th>
            <th
              className="label"
              style={{ padding: "8px 0", textAlign: "right" }}
            >
              Price
            </th>
            <th
              className="label"
              style={{ padding: "8px 0", textAlign: "right" }}
            >
              Pulls
            </th>
            <th className="label" style={{ padding: "8px 0" }}>
              State
            </th>
          </tr>
        </thead>
        <tbody>
          {tools.length === 0 && (
            <tr>
              <td colSpan={9} style={{ padding: "16px 0" }}>
                <p
                  className="mono"
                  style={{ color: "var(--ink-3)", fontSize: 12 }}
                >
                  NO TOOLS REGISTERED · RUN <code>npm run db:push</code> THEN
                  SEED VIA <code>scripts/seed.ts</code>
                </p>
              </td>
            </tr>
          )}
          {tools.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td className="mono" style={{ padding: "12px 0", fontSize: 12 }}>
                {t.slotCode}
              </td>
              <td style={{ padding: "12px 0", fontSize: 22 }}>{t.glyph}</td>
              <td className="mono" style={{ padding: "12px 0", fontSize: 12 }}>
                {t.slug}
              </td>
              <td style={{ padding: "12px 0", fontSize: 15 }}>{t.name}</td>
              <td className="mono" style={{ padding: "12px 0", fontSize: 11 }}>
                {t.shape.toUpperCase()}
              </td>
              <td className="mono" style={{ padding: "12px 0", fontSize: 11 }}>
                {t.packaging.toUpperCase()}
              </td>
              <td
                style={{ padding: "12px 0", fontSize: 14, textAlign: "right" }}
              >
                {t.priceCoins} · ${(t.priceCoins / 100).toFixed(2)}
              </td>
              <td
                style={{ padding: "12px 0", fontSize: 14, textAlign: "right" }}
              >
                {t.pullCount}
              </td>
              <td
                className="mono"
                style={{
                  padding: "12px 0",
                  fontSize: 11,
                  color: t.published ? "var(--success)" : "var(--ink-3)",
                }}
              >
                {t.published ? "PUBLISHED" : "DRAFT"}
                {t.featured ? " · FEATURED" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
