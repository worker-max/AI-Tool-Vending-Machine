"use client";

import { useEffect } from "react";

const ASCII = `
  ┌─────────────────────────────────┐
  │  V E N D / A I  ·  UNIT 014     │
  │  ┌───┬───┬───┐                  │
  │  │ ∿ │ ◐ │ ▤ │   READY          │
  │  ├───┼───┼───┤                  │
  │  │ ◇ │ ○ │ △ │   SELECT         │
  │  ├───┼───┼───┤                  │
  │  │ ▢ │ + │ ✕ │   DISPENSE       │
  │  └───┴───┴───┘                  │
  └─────────────────────────────────┘
`;

export function ConsoleWelcome() {
  useEffect(() => {
    const heading =
      "color: #d35400; font-size: 14px; font-weight: 600; letter-spacing: 0.1em;";
    const subtle = "color: #6e6e6e; font-size: 12px;";
    /* eslint-disable no-console */
    console.log(`%cVEND/AI`, heading);
    console.log(ASCII);
    console.log(
      `%cAn editorial AI-tool arcade. The interaction is arcade. The visuals are ink-on-paper.`,
      subtle
    );
    console.log(
      `%cFound a way in here? Try typing a passphrase in the footer. Or the Konami code on this page.`,
      subtle
    );
    /* eslint-enable no-console */
  }, []);

  return null;
}
