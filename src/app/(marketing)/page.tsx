import Link from "next/link";
import { brand } from "@/lib/brand.config";

export default function LandingPage() {
  return (
    <div>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 64,
          alignItems: "end",
          marginTop: 64,
          marginBottom: 96,
        }}
      >
        <div>
          <div className="label" style={{ marginBottom: 32 }}>
            An editorial AI-tool arcade · For visitors and operators
          </div>
          <h1 className="display">
            Dispense
            <br />
            <em>intelligence</em>
            <br />
            with <span className="accent">precision.</span>
          </h1>
          <p
            className="serif-accent"
            style={{
              marginTop: 32,
              fontSize: 22,
              lineHeight: 1.4,
              color: "var(--ink-2)",
              maxWidth: "44ch",
              fontStyle: "normal",
            }}
          >
            Browse the slot grid, insert coins, pull the lever. A creature
            wakes up, does one thing well, and dispenses an output. No
            chatbot churn. No AI slop. Far from it.
          </p>
          <div
            style={{
              marginTop: 40,
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <Link href="/arcade" className="btn-lever">
              Enter the arcade
            </Link>
            <Link href="/auth/sign-in" className="btn-outline">
              Insert coin
            </Link>
          </div>

          <dl
            style={{
              marginTop: 80,
              paddingTop: 32,
              borderTop: "1px solid var(--ink)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 32,
            }}
          >
            <div>
              <dt className="label">Status</dt>
              <dd style={{ marginTop: 6 }}>Online · v1.0</dd>
            </div>
            <div>
              <dt className="label">Machines</dt>
              <dd style={{ marginTop: 6 }}>{brand.unitNumber}</dd>
            </div>
            <div>
              <dt className="label">Tools loaded</dt>
              <dd style={{ marginTop: 6 }}>2 · launch lineup</dd>
            </div>
            <div>
              <dt className="label">Submission</dt>
              <dd style={{ marginTop: 6 }}>
                <Link
                  href="/submit"
                  style={{ borderBottom: "1px solid var(--tangerine)" }}
                >
                  Open
                </Link>
              </dd>
            </div>
          </dl>
        </div>

        {/* CSS-only vending machine illustration */}
        <div className="machine" aria-hidden="true">
          <div className="machine-head">
            <div>
              {brand.name.split("/")[0]}
              <sup>/</sup>
              {brand.name.split("/")[1]}
            </div>
            <div className="mono">{brand.unitNumber}</div>
          </div>
          <div>
            <div className="machine-screen">
              <span>READY</span>
              <span className="sig">▮ ▮ ▮</span>
              <span>$0.00</span>
            </div>
            <div className="machine-grid" style={{ marginTop: 12 }}>
              <div className="slot">
                <div>A1</div>
                <div className="slot-sym">∿</div>
                <div className="slot-price">$0.04</div>
              </div>
              <div className="slot featured">
                <div>A2</div>
                <div className="slot-sym">◐</div>
                <div className="slot-price">$0.12</div>
              </div>
              <div className="slot">
                <div>A3</div>
                <div className="slot-sym">▤</div>
                <div className="slot-price">—</div>
              </div>
              <div className="slot">
                <div>B1</div>
                <div className="slot-sym">·</div>
                <div className="slot-price">—</div>
              </div>
              <div className="slot">
                <div>B2</div>
                <div className="slot-sym">·</div>
                <div className="slot-price">—</div>
              </div>
              <div className="slot">
                <div>B3</div>
                <div className="slot-sym">·</div>
                <div className="slot-price">—</div>
              </div>
              <div className="slot">
                <div>C1</div>
                <div className="slot-sym">·</div>
                <div className="slot-price">—</div>
              </div>
              <div className="slot">
                <div>C2</div>
                <div className="slot-sym">·</div>
                <div className="slot-price">—</div>
              </div>
              <div className="slot">
                <div>C3</div>
                <div className="slot-sym">·</div>
                <div className="slot-price">—</div>
              </div>
            </div>
          </div>
          <div className="machine-foot">
            <div>SELECT · INSERT · DEPLOY</div>
            <div className="mono">v1.0</div>
          </div>
        </div>
      </section>

      <section
        className="hairline-top"
        style={{ paddingTop: 48, marginTop: 48 }}
      >
        <div className="label" style={{ marginBottom: 16 }}>
          How it works
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
          }}
        >
          <div>
            <div
              className="mono"
              style={{ color: "var(--tangerine)", fontSize: 11 }}
            >
              01
            </div>
            <h3
              style={{
                marginTop: 8,
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              Browse the grid
            </h3>
            <p
              style={{
                marginTop: 8,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              Each slot holds a creature with a name, a glyph, and one job.
              Different prices for different work.
            </p>
          </div>
          <div>
            <div
              className="mono"
              style={{ color: "var(--tangerine)", fontSize: 11 }}
            >
              02
            </div>
            <h3
              style={{
                marginTop: 8,
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              Insert coins
            </h3>
            <p
              style={{
                marginTop: 8,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              Sign up. Get 10 free coins. Buy more, redeem a coupon, or wait
              to be invited as a VIP.
            </p>
          </div>
          <div>
            <div
              className="mono"
              style={{ color: "var(--tangerine)", fontSize: 11 }}
            >
              03
            </div>
            <h3
              style={{
                marginTop: 8,
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              Pull the lever
            </h3>
            <p
              style={{
                marginTop: 8,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              The creature works. Output appears in the dispense tray. If
              something fails, your coins come back.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
