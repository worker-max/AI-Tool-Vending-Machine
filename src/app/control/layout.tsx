import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { brand } from "@/lib/brand.config";

export default async function ControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in?redirect=/control");
  if (session.role !== "operator") redirect("/arcade");

  const nav: NavGroup[] = [
    {
      title: "Content",
      items: [
        { label: "Tools", href: "/control/tools" },
        { label: "Submissions", href: "/control/submissions" },
        { label: "Machines", href: "/control/machines" },
      ],
    },
    {
      title: "Experience",
      items: [{ label: "Footer portal codes", href: "/control/portal" }],
    },
    {
      title: "System",
      items: [
        { label: "VIP grants", href: "/control/vips" },
        { label: "Coupons", href: "/control/coupons" },
        { label: "Grant coins", href: "/control/grant-coins" },
        { label: "Wallet ledger", href: "/control/ledger" },
        { label: "API keys", href: "/control/api-keys" },
        { label: "Settings", href: "/control/settings" },
      ],
    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "240px 1fr" }}>
      <aside
        style={{
          background: "var(--paper-2)",
          borderRight: "1px solid var(--ink)",
          padding: "24px 16px",
          position: "sticky",
          top: 0,
          alignSelf: "start",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <Link
          href="/control"
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            display: "block",
            marginBottom: 4,
          }}
        >
          {brand.name.split("/")[0]}
          <sup style={{ color: "var(--tangerine)" }}>/</sup>
          {brand.name.split("/")[1]}
        </Link>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 24 }}>
          OPERATOR · {brand.unitNumber}
        </div>

        {nav.map((group) => (
          <div key={group.title} style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>
              {group.title}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      display: "block",
                      padding: "6px 0",
                      fontSize: 13,
                      color: "var(--ink-2)",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div
          style={{
            marginTop: "auto",
            paddingTop: 24,
            borderTop: "1px solid var(--hairline)",
            fontSize: 11,
            color: "var(--ink-3)",
          }}
        >
          <div>{session.email}</div>
          <form method="post" action="/api/auth/sign-out">
            <button
              type="submit"
              className="mono"
              style={{
                marginTop: 8,
                background: "none",
                border: "none",
                color: "var(--ink-3)",
                cursor: "pointer",
                padding: 0,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main style={{ padding: "32px 40px", maxWidth: 1200 }}>{children}</main>
    </div>
  );
}

interface NavGroup {
  title: string;
  items: { label: string; href: string }[];
}
