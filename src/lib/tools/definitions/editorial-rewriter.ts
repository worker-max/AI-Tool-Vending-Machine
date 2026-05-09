// VEND/AI — Tool: Editorial Rewriter
//
// Slot A1. Sync. Native. 4 coins.
// Rewrites a paragraph in editorial-Swiss voice — clipped, ink-on-paper.

import { z } from "zod";
import { DEFAULT_MODEL } from "../../anthropic";
import type { ToolDefinition } from "../contract";

const inputSchema = z.object({
  text: z
    .string()
    .min(10, "Text must be at least 10 characters")
    .max(1500, "Text must be 1500 characters or less"),
  tone: z.enum(["crisp", "reportorial", "wry"]).optional().default("crisp"),
});

const outputSchema = z.object({
  rewritten: z.string(),
});

const SYSTEM_PROMPT = `You are an editor at a high-design magazine. You rewrite text in an editorial-Swiss voice: clipped, precise, ink-on-paper. Short sentences. Concrete nouns. Active verbs. No filler. No "in today's fast-paced world" openers. No "in conclusion" closers. No clichés. No hedge words ("very", "quite", "really").

Style anchors:
- Reach for mechanism, paper engineering, editorial craft over circuits/neon/futurism.
- Cadence over volume. A line break is a tool.
- The reader is intelligent. Don't explain the obvious.

Tone variants:
- crisp: brief, declarative, almost telegraphic
- reportorial: factual, observed-from-a-distance, like a wire dispatch
- wry: dry humor allowed in one sentence per paragraph; never sarcastic

Output ONLY the rewritten text. No preamble, no explanation, no quotes around it, no notes.`;

export const editorialRewriter: ToolDefinition = {
  slug: "editorial-rewriter",
  shape: "sync",
  packaging: "native",
  pricing: { kind: "flat", coins: 4 },
  persona: {
    name: "The Rewriter",
    glyph: "∿",
    bio: "Cuts your sentences down to their bones. Hands them back sharper.",
    creatorCredit: "VEND/AI in-house",
  },
  inputSchema,
  outputSchema,
  handler: async (rawInput, ctx) => {
    const input = inputSchema.parse(rawInput);
    const anthropic = ctx.anthropic!;
    const userMessage = `Tone: ${input.tone}\n\nRewrite:\n\n${input.text}`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("No text returned from model");
    }
    return { rewritten: block.text.trim() };
  },
};
