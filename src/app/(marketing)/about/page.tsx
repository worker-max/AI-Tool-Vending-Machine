import { brand } from "@/lib/brand.config";

export default function AboutPage() {
  return (
    <div className="prose-paper" style={{ margin: "32px auto" }}>
      <div className="label">About · The city</div>
      <h1
        className="display"
        style={{
          fontSize: "clamp(36px, 4vw, 56px)",
          marginTop: 12,
          marginBottom: 32,
        }}
      >
        {brand.name} is a citizen, not a product.
      </h1>

      <p>
        Every site I build is a citizen of a city of AI creatures. Each
        citizen has its own face, its own voice, its own job. They share a
        language — the same auth, the same design DNA, the same way of
        recognizing a returning visitor. But they don't blur into one
        platform. The point is the difference.
      </p>

      <p>
        {brand.name} is the first citizen. An editorial AI-tool arcade.
        Browse the slot grid, insert coins, pull the lever. A creature wakes
        up, does one thing well, hands you the result. {brand.unitNumber} is
        the only machine online today; more will follow.
      </p>

      <h2>Why an arcade, not a chatbot</h2>
      <p>
        Most AI products are one giant chat window asking you to come up with
        the question. That's lazy. An arcade is the opposite: each creature
        is a specialist. You don't ask the rewriter to read a URL. You don't
        ask the reader to rewrite a paragraph. The interaction is short,
        clear, and bounded — coin in, output out.
      </p>

      <h2>Why editorial, not neon</h2>
      <p>
        Most AI sites borrow the same visual language: gradients, neural-net
        iconography, terminal-green tropes. {brand.name} reaches the other
        way. Paper. Ink. Hairline rules. Tangerine. Monospace metadata. The
        interaction is arcade; the language is MIT Press. The high-design
        move is the collision.
      </p>

      <h2>Who runs this</h2>
      <p>
        Colin Highland. Operator of {brand.unitNumber}. Built atop the
        cms-template foundation, designed so the next citizen of the city
        ships faster than this one did.
      </p>
    </div>
  );
}
