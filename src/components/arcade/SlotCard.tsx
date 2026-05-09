import Link from "next/link";
import type { Tool } from "@/lib/db/schema";

export function SlotCard({ tool }: { tool: Tool }) {
  const usd = (tool.priceCoins / 100).toFixed(2);
  return (
    <Link
      href={`/arcade/${tool.slotCode.toLowerCase()}`}
      className={`slot ${tool.featured ? "featured" : ""}`}
      style={{ textDecoration: "none" }}
      aria-label={`${tool.name} — ${tool.bio} — $${usd}`}
    >
      <div>{tool.slotCode}</div>
      <div className="slot-sym">{tool.glyph}</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <span style={{ fontSize: 8, opacity: 0.7 }}>
          {tool.name.length > 14 ? tool.name.slice(0, 14) + "…" : tool.name}
        </span>
        <span className="slot-price">${usd}</span>
      </div>
    </Link>
  );
}

export function EmptySlot({ slotCode }: { slotCode: string }) {
  return (
    <div className="slot" style={{ opacity: 0.35, cursor: "default" }}>
      <div>{slotCode}</div>
      <div className="slot-sym" style={{ color: "var(--ink-3)" }}>
        ·
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <span style={{ fontSize: 8 }}>—</span>
        <span className="slot-price">—</span>
      </div>
    </div>
  );
}
