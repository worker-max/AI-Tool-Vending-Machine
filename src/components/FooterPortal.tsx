"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Default passphrase mapping. Operator can extend in v1.1+.
const PASSPHRASES: Record<string, string> = {
  "dispense intelligence": "/lore",
  "unit 014": "/lore",
  "the city": "/about",
};

export function FooterPortal() {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut: typing the Konami code on the homepage triggers a
  // small easter egg by routing to /lore?konami=1. Listener mounted on body.
  useEffect(() => {
    const sequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === sequence[progress]) {
        progress += 1;
        if (progress === sequence.length) {
          progress = 0;
          router.push("/lore?konami=1");
        }
      } else {
        progress = e.key === sequence[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const key = value.trim().toLowerCase();
    const dest = PASSPHRASES[key];
    if (dest) {
      router.push(dest);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 320);
      setValue("");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        marginTop: 24,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        className="mono"
        style={{
          color: "var(--ink-3)",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        &gt;
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="enter passphrase…"
        className="portal-cursor"
        spellCheck={false}
        autoComplete="off"
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          fontFamily: "var(--font-mono), JetBrains Mono, monospace",
          fontSize: 12,
          letterSpacing: "0.1em",
          color: "var(--ink)",
          width: 220,
          transform: shake ? "translateX(2px)" : "none",
          transition: "transform 80ms",
        }}
      />
    </form>
  );
}
