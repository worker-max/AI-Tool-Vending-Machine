import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { brand } from "@/lib/brand.config";
import { SlotCard, EmptySlot } from "@/components/arcade/SlotCard";

const SLOT_CODES = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];

export const dynamic = "force-dynamic";

export default async function ArcadePage() {
  const tools = db
    ? await db
        .select()
        .from(schema.tools)
        .where(eq(schema.tools.published, true))
        .orderBy(asc(schema.tools.slotCode))
    : [];

  const bySlot = new Map(tools.map((t) => [t.slotCode, t]));

  return (
    <div>
      <div className="label" style={{ marginBottom: 16 }}>
        {brand.unitNumber} · Active inventory
      </div>
      <h1
        className="display"
        style={{ fontSize: "clamp(36px, 4vw, 56px)", marginBottom: 48 }}
      >
        Pick a creature.
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 48,
          alignItems: "start",
        }}
      >
        <div className="machine">
          <div className="machine-head">
            <div>
              {brand.name.split("/")[0]}
              <sup>/</sup>
              {brand.name.split("/")[1]}
            </div>
            <div className="mono">{brand.unitNumber}</div>
          </div>
          <div>
            <div className="machine-screen">
              <span>READY</span>
              <span className="sig">▮ ▮ ▮</span>
              <span>SELECT</span>
            </div>
            <div className="machine-grid" style={{ marginTop: 12 }}>
              {SLOT_CODES.map((code) => {
                const tool = bySlot.get(code);
                return tool ? (
                  <SlotCard key={code} tool={tool} />
                ) : (
                  <EmptySlot key={code} slotCode={code} />
                );
              })}
            </div>
          </div>
          <div className="machine-foot">
            <div>SELECT · INSERT · DEPLOY</div>
            <div className="mono">{tools.length} ONLINE</div>
          </div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 16 }}>
            Active tools
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {tools.length === 0 && (
              <li className="mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>
                NO TOOLS PUBLISHED · CHECK ADMIN PANEL OR SEED DB
              </li>
            )}
            {tools.map((t) => (
              <li
                key={t.id}
                style={{
                  paddingTop: 16,
                  paddingBottom: 16,
                  borderTop: "1px solid var(--hairline)",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span className="mono" style={{ fontSize: 11 }}>
                    {t.slotCode}
                  </span>
                  <span className="mono" style={{ fontSize: 11 }}>
                    ${(t.priceCoins / 100).toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 16,
                    fontWeight: 500,
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "var(--ink-2)",
                    lineHeight: 1.5,
                  }}
                >
                  {t.bio}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
