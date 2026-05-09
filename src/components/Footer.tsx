import Link from "next/link";
import { brand } from "@/lib/brand.config";
import { FooterPortal } from "./FooterPortal";

export function Footer() {
  return (
    <footer
      className="hairline-top"
      style={{ background: "var(--paper-2)", marginTop: 96 }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "48px 32px 32px",
          display: "grid",
          gridTemplateColumns: "1.4fr repeat(3, 1fr)",
          gap: 48,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            {brand.name.split("/")[0]}
            <sup style={{ color: "var(--tangerine)" }}>/</sup>
            {brand.name.split("/")[1]}
          </div>
          <p
            className="serif-accent"
            style={{ marginTop: 12, fontSize: 16, color: "var(--ink-2)", maxWidth: "32ch" }}
          >
            {brand.tagline}
          </p>
          <FooterPortal />
        </div>

        {brand.footer.columns.map((col) => (
          <div key={col.title}>
            <div className="label" style={{ marginBottom: 16 }}>
              {col.title}
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{ color: "var(--ink-2)", fontSize: 14 }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="hairline-top"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "20px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>
          © {new Date().getFullYear()} {brand.footer.copyright}
        </div>
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>
          {brand.unitNumber} · ONLINE
        </div>
      </div>
    </footer>
  );
}
