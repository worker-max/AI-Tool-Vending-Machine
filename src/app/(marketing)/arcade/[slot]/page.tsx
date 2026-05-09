import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ToolRunner, type InputField } from "@/components/arcade/ToolRunner";

export const dynamic = "force-dynamic";

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slot: string }>;
}) {
  const { slot } = await params;
  const slotCode = slot.toUpperCase();

  if (!db) notFound();

  const rows = await db
    .select()
    .from(schema.tools)
    .where(
      and(
        eq(schema.tools.slotCode, slotCode),
        eq(schema.tools.published, true)
      )
    )
    .limit(1);

  const tool = rows[0];
  if (!tool) notFound();

  const session = await getSession();
  const inputs = formInputsFor(tool.slug);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 64 }}>
      <aside>
        <div className="label">Slot {tool.slotCode}</div>
        <div
          className="card-paper"
          style={{
            marginTop: 12,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            aspectRatio: "1",
          }}
        >
          <div
            style={{
              fontSize: 96,
              lineHeight: 1,
              color: tool.accentColor || "var(--ink)",
            }}
          >
            {tool.glyph}
          </div>
        </div>

        <h1
          style={{
            marginTop: 24,
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {tool.name}
        </h1>
        <p
          className="serif-accent"
          style={{
            marginTop: 12,
            fontSize: 17,
            lineHeight: 1.5,
            color: "var(--ink-2)",
          }}
        >
          {tool.bio}
        </p>

        <dl
          style={{
            marginTop: 32,
            display: "grid",
            gap: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <div>
            <dt className="label">Cost per pull</dt>
            <dd style={{ marginTop: 4 }}>
              {tool.priceCoins} coins · ${(tool.priceCoins / 100).toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="label">Shape</dt>
            <dd style={{ marginTop: 4 }} className="mono">
              {tool.shape.toUpperCase()}
            </dd>
          </div>
          <div>
            <dt className="label">Created by</dt>
            <dd style={{ marginTop: 4 }}>{tool.creatorCredit}</dd>
          </div>
        </dl>
      </aside>

      <section>
        <div className="label">Input</div>
        <h2
          style={{
            marginTop: 8,
            fontSize: 24,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            marginBottom: 24,
          }}
        >
          Tell the {tool.name.toLowerCase()} what to work on.
        </h2>

        <ToolRunner
          toolSlug={tool.slug}
          toolName={tool.name}
          priceCoins={tool.priceCoins}
          inputs={inputs}
          authenticated={!!session}
        />
      </section>
    </div>
  );
}

// UI form descriptors per tool slug. Native tools' inputSchema gives the
// validation contract; this gives the form fields. Future tools will carry
// formInputs in their registry config.
function formInputsFor(slug: string): InputField[] {
  switch (slug) {
    case "editorial-rewriter":
      return [
        {
          name: "text",
          label: "Text to rewrite",
          type: "textarea",
          placeholder: "Paste a paragraph (10–1500 characters)…",
          required: true,
        },
        {
          name: "tone",
          label: "Tone",
          type: "select",
          defaultValue: "crisp",
          options: [
            { value: "crisp", label: "Crisp · brief, declarative" },
            { value: "reportorial", label: "Reportorial · wire-dispatch" },
            { value: "wry", label: "Wry · dry humor allowed" },
          ],
        },
      ];
    case "url-bullets":
      return [
        {
          name: "url",
          label: "URL to read",
          type: "url",
          placeholder: "https://example.com/article",
          required: true,
        },
      ];
    default:
      return [
        {
          name: "input",
          label: "Input",
          type: "textarea",
          placeholder: "Tool input…",
        },
      ];
  }
}
