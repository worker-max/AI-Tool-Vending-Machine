"use client";

import { useState } from "react";

export default function CouponsPage() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "redeeming" }
    | { kind: "success"; coins: number; restriction: string | null }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "redeeming" });
    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (json.ok) {
        setState({
          kind: "success",
          coins: json.grantedCoins,
          restriction: json.restriction,
        });
        setCode("");
      } else {
        setState({
          kind: "error",
          message: errorToMessage(json.error),
        });
      }
    } catch {
      setState({ kind: "error", message: "Network error." });
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "32px auto" }}>
      <div className="label">Coupons</div>
      <h1
        className="display"
        style={{ fontSize: "clamp(36px, 4vw, 56px)", marginTop: 12 }}
      >
        Redeem a <em>code.</em>
      </h1>
      <p
        style={{
          marginTop: 16,
          fontSize: 16,
          color: "var(--ink-2)",
          lineHeight: 1.55,
          maxWidth: "48ch",
        }}
      >
        Coupon codes grant coins to your wallet. Each code works once per
        account. Some codes are tool-specific.
      </p>

      <form onSubmit={onSubmit} style={{ marginTop: 32, display: "grid", gap: 16 }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER CODE"
          className="input-paper mono"
          style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}
          required
          disabled={state.kind === "redeeming"}
        />
        <button
          type="submit"
          className="btn-lever"
          disabled={state.kind === "redeeming" || !code}
        >
          {state.kind === "redeeming" ? "Redeeming…" : "Redeem"}
        </button>
      </form>

      {state.kind === "success" && (
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: "var(--tangerine-wash)",
            borderLeft: "3px solid var(--tangerine)",
          }}
        >
          <div className="label" style={{ color: "var(--tangerine)" }}>
            Redeemed
          </div>
          <div style={{ marginTop: 8, fontSize: 18 }}>
            <strong>+{state.coins} coins</strong> added to your wallet.
          </div>
          {state.restriction && (
            <div
              style={{ marginTop: 8, fontSize: 13, color: "var(--ink-2)" }}
            >
              Intended for: <code>{state.restriction}</code>
            </div>
          )}
        </div>
      )}

      {state.kind === "error" && (
        <div
          className="mono"
          style={{
            marginTop: 16,
            padding: "10px 14px",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            fontSize: 12,
          }}
        >
          {state.message.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function errorToMessage(error: string): string {
  switch (error) {
    case "NOT_AUTHENTICATED":
      return "Sign in first.";
    case "NOT_FOUND":
      return "That code wasn't recognized.";
    case "INACTIVE":
      return "That code is inactive.";
    case "EXPIRED":
      return "That code has expired.";
    case "CAP_REACHED":
      return "That code has reached its redemption cap.";
    case "ALREADY_REDEEMED":
      return "You've already redeemed this code.";
    default:
      return "Could not redeem.";
  }
}
