import Link from "next/link";
import { brand } from "@/lib/brand.config";
import { getSession } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";

export async function Header() {
  const session = await getSession();
  let balance: number | null = null;
  if (session) {
    try {
      const wallet = await getOrCreateWallet(session.userId);
      balance = wallet.balanceCoins;
    } catch {
      balance = null;
    }
  }

  return (
    <header className="hairline-bottom" style={{ background: "var(--paper)" }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            fontSize: 18,
            color: "var(--ink)",
          }}
        >
          {brand.name.split("/")[0]}
          <sup style={{ color: "var(--tangerine)" }}>/</sup>
          {brand.name.split("/")[1]}
        </Link>

        <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {brand.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mono"
              style={{
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              {item.label}
            </Link>
          ))}
          {session ? (
            <Link
              href="/wallet"
              className="mono"
              style={{
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink)",
                padding: "8px 14px",
                border: "1px solid var(--ink)",
              }}
            >
              {balance !== null ? `${balance} coins` : "Wallet"}
            </Link>
          ) : (
            <Link
              href="/auth/sign-in"
              className="mono"
              style={{
                fontSize: 12,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--paper)",
                background: "var(--ink)",
                padding: "10px 16px",
              }}
            >
              Insert coin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
