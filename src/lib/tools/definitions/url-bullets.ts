// VEND/AI — Tool: URL → 3 Bullets
//
// Slot A2 (featured). Sync. Native. 12 coins.
// Reads a URL, returns three editorial bullets. No fluff, no preamble.

import { z } from "zod";
import { DEFAULT_MODEL } from "../../anthropic";
import type { ToolDefinition } from "../contract";

const inputSchema = z.object({
  url: z.string().url("Must be a valid URL").max(2048, "URL too long"),
});

const outputSchema = z.object({
  bullets: z.tuple([z.string(), z.string(), z.string()]),
  source_title: z.string(),
});

const SYSTEM_PROMPT = `You read a web page and return exactly three bullets that capture what it actually says.

Rules:
- Three bullets, no more, no less.
- Each bullet is one sentence, 12-25 words.
- Concrete claims. Names, numbers, dates when present.
- No "the article discusses..." constructions. State the claim directly.
- No fluff, no preamble, no "in summary".
- Editorial-Swiss tone: clipped, precise, ink-on-paper.

Return JSON only, in this shape:
{ "source_title": "...", "bullets": ["...", "...", "..."] }`;

export const urlBullets: ToolDefinition = {
  slug: "url-bullets",
  shape: "sync",
  packaging: "native",
  pricing: { kind: "flat", coins: 12 },
  persona: {
    name: "The Reader",
    glyph: "◐",
    bio: "Reads anything. Reports back in three sentences. No fluff.",
    accentColor: "#d35400",
    creatorCredit: "VEND/AI in-house",
  },
  inputSchema,
  outputSchema,
  handler: async (rawInput, ctx) => {
    const input = inputSchema.parse(rawInput);

    // Fetch the URL
    let pageText: string;
    let pageTitle: string;
    try {
      const res = await fetch(input.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 VEND/AI Reader (+https://vendai.com/about)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      }
      const html = await res.text();
      pageText = stripHtml(html).slice(0, 12_000);
      pageTitle = extractTitle(html);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "fetch error";
      throw new Error(`Could not read URL: ${msg}`);
    }

    const anthropic = ctx.anthropic!;
    const userMessage = `URL: ${input.url}\nDetected title: ${pageTitle}\n\nPage content:\n\n${pageText}`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("No text returned from model");
    }

    const jsonMatch = block.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Model did not return JSON");
    }

    let parsed: { source_title?: string; bullets?: unknown };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Model returned malformed JSON");
    }

    if (
      !parsed.bullets ||
      !Array.isArray(parsed.bullets) ||
      parsed.bullets.length !== 3
    ) {
      throw new Error("Model did not return exactly three bullets");
    }

    return {
      bullets: parsed.bullets as [string, string, string],
      source_title: parsed.source_title || pageTitle || input.url,
    };
  },
};

// ── helpers ──────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "";
}
