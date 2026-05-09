import { Suspense } from "react";

export default function LorePage() {
  return (
    <Suspense fallback={null}>
      <LoreContent />
    </Suspense>
  );
}

function LoreContent() {
  return (
    <div
      style={{ maxWidth: 640, margin: "32px auto", padding: "0 16px" }}
      className="prose-paper"
    >
      <div className="label">Lore · Hidden archive</div>
      <h1
        className="display"
        style={{ fontSize: "clamp(36px, 4vw, 56px)", marginTop: 12 }}
      >
        You found a way <em>in.</em>
      </h1>

      <p>
        UNIT 014 isn't the first machine. There were thirteen before it. None
        of them are online anymore. Some were retired. Some never shipped.
        Some are still out there, you just can't reach them.
      </p>

      <p>
        The creatures live in the slots. They sleep when the lever isn't
        pulled. They don't know about each other. They each remember the
        last time they were used, and nothing else.
      </p>

      <p>
        If you typed the right passphrase to get here, you already know the
        operator. If you didn't — welcome. The arcade is open. The grid is
        small. The work is real.
      </p>

      <hr style={{ margin: "48px 0", borderTop: "1px solid var(--hairline)" }} />

      <p
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--ink-3)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Recovered fragment · Document 014.001
      </p>
    </div>
  );
}
