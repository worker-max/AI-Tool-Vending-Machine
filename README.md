# VEND/AI

> An editorial AI-tool arcade. Browse the slot grid, insert coins, pull the lever, and a creature dispenses an output. Far from AI slop.

**Status:** v1 · Foundation ready · Awaiting environment wiring
**Foundation lineage:** First citizen of the city of AI creatures (see [`docs/foundation/LINEAGE.md`](docs/foundation/LINEAGE.md)).
**Spec:** [`docs/plans/2026-05-09-vendai-v1-design.md`](docs/plans/2026-05-09-vendai-v1-design.md)
**Project page:** [`docs/PROJECT.md`](docs/PROJECT.md)

---

## What's here

| Layer | Implementation |
|---|---|
| **Stack** | Next.js 16 (App Router) · React 19 · TypeScript strict · Drizzle ORM · Neon Postgres · Tailwind v4 |
| **Auth** | Magic-link email via Resend, JWT cookie session (no Auth.js v5 — see spec deviation below) |
| **Routing** | Hostname split: marketing on `vendai.com`, admin on `control.vendai.com` (rewrites to `/control/*`) |
| **Tool runtime** | Shape-agnostic contract (sync/async/streaming/voice). v1 ships **sync** only |
| **Tool packaging** | Hybrid: native (live) · http (scaffolded) · sandbox (scaffolded) |
| **Coin economy** | Tool-specific flat price · prepaid coin pouch · auto-refund on failure · VIP comp via budget pool |
| **LLM provider** | Anthropic Claude direct (Sonnet 4.6) — via OpenRouter aggregator in v1.1+ |
| **Submissions** | Form-based at `/submit`, manual review in operator panel |
| **Signatures** | Footer portal (passphrase input), console welcome (ASCII machine on dev tools open), Konami code easter egg, three-tier admin |

## Quickstart (after first clone or pull)

### 1. Install

```bash
npm install
```

### 2. Set environment variables

Copy `.env.example` → `.env.local` and fill in:

| Var | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `JWT_SECRET` | Yes | Run `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Yes | Used by the v1 starter tools |
| `RESEND_API_KEY` | Optional in dev | Without it, magic links print to server console |
| `OPERATOR_EMAIL` | Recommended | Email that auto-promotes to operator on first sign-in |
| `NEXT_PUBLIC_SITE_URL` | Recommended | e.g. `https://vendai.com` or `http://localhost:3000` |

### 3. Push the schema

```bash
npm run db:push
```

This creates the 11 `va_*` tables in your Neon DB.

### 4. Run dev

```bash
npm run dev
```

Visit:
- `http://localhost:3000` — Marketing landing
- `http://localhost:3000/arcade` — The slot grid (empty until you seed)
- `http://localhost:3000/auth/sign-in` — Get your first magic link
- `http://control.localhost:3000` — Operator admin (sign in first, then visit; requires `OPERATOR_EMAIL` to match)

### 5. Seed UNIT 014 + the two starter tools

After signing in as operator, hit:

```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Cookie: va_session=<your-session-cookie>"
```

(Or visit the route in a logged-in browser tab — it's a POST so use a bookmarklet or curl.)

This creates UNIT 014 and publishes:
- **A1 · Editorial Rewriter** (`∿`) · 4 coins · sync
- **A2 · URL → 3 Bullets** (`◐`, featured) · 12 coins · sync

Refresh `/arcade` — the grid populates.

## Project layout

```
vendai/
├── docs/
│   ├── plans/2026-05-09-vendai-v1-design.md   Full design spec
│   ├── PROJECT.md                              Notion-equivalent project ref
│   └── foundation/LINEAGE.md                   Pointer to the seed
├── drizzle.config.ts                           Drizzle config
├── src/
│   ├── middleware.ts                           Hostname split + auth gating
│   ├── app/
│   │   ├── (marketing)/                        Public routes (Header + Footer wrapper)
│   │   │   ├── page.tsx                          Landing
│   │   │   ├── arcade/                           Slot grid + tool detail
│   │   │   ├── auth/sign-in/                     Magic-link form
│   │   │   ├── coupons/                          Coupon redemption
│   │   │   ├── wallet/                           Balance + transactions
│   │   │   ├── submit/                           Public tool submission
│   │   │   ├── about/                            Lore-light intro
│   │   │   └── lore/                             Hidden archive (passphrase target)
│   │   ├── control/                            Operator admin (under control.<host>)
│   │   │   ├── page.tsx                          Dashboard
│   │   │   ├── tools/                            Tool list
│   │   │   ├── submissions/                      Submission queue
│   │   │   ├── coupons/                          Coupon CRUD
│   │   │   ├── vips/                             VIP grants
│   │   │   ├── grant-coins/                      Manual coin grant (no Stripe)
│   │   │   ├── machines/                         Machine fleet
│   │   │   ├── portal/                           Footer-portal codes (read-only v1)
│   │   │   ├── ledger/                           Wallet transaction ledger
│   │   │   ├── settings/                         Read-only brand.config view
│   │   │   └── api-keys/                         API keys (scaffold)
│   │   └── api/                                Route handlers
│   │       ├── auth/{send-link,callback,sign-out}/route.ts
│   │       ├── tools/[slug]/run/route.ts         Pull a lever
│   │       ├── wallet/route.ts                   Balance + tx
│   │       ├── coupons/redeem/route.ts
│   │       ├── submissions/route.ts              Public submission intake
│   │       └── admin/                            Operator-only CRUD
│   ├── components/
│   │   ├── Header.tsx · Footer.tsx
│   │   ├── FooterPortal.tsx                     Blinking-cursor passphrase input
│   │   ├── ConsoleWelcome.tsx                   Dev-tools ASCII greeting
│   │   └── arcade/{SlotCard,ToolRunner}.tsx
│   └── lib/
│       ├── brand.config.ts                     Single-file brand swap
│       ├── auth.ts                             JWT session helpers
│       ├── magic-link.ts                       Issue + consume magic links
│       ├── wallet.ts                           reserve/settle/refund/grant
│       ├── coupons.ts                          redeemCoupon
│       ├── vip.ts                              tryVipBill, getActiveVip
│       ├── anthropic.ts                        Claude SDK client
│       ├── db/{index.ts, schema.ts}            Drizzle wiring + 11 tables
│       └── tools/
│           ├── contract.ts                     ToolDefinition types
│           ├── registry.ts                     Native tool registration
│           ├── dispatcher.ts                   Run a tool (reserve → run → settle/refund)
│           ├── adapters/{native,http,sandbox}.ts
│           └── definitions/
│               ├── editorial-rewriter.ts
│               └── url-bullets.ts
└── public/                                      Static assets
```

## Use VEND/AI from your Claude account (MCP server)

VEND/AI exposes every published native tool as an MCP tool. Add VEND/AI as a remote MCP server in **Claude Desktop**, **claude.ai**, or **Cursor** and the lever-pull moves into your normal Claude session — same dispatcher, same wallet, same auto-refund on failure.

### Setup

1. **Sign in** with `OPERATOR_EMAIL` (or any operator account).
2. **Issue an API key** at `/control/api-keys`. Copy it on the spot — it isn't shown again.
3. **Add the MCP server** to your client:

**Claude Desktop / Cursor (streamable HTTP, native):**

```json
{
  "vendai": {
    "url": "https://your-vendai-host/api/mcp",
    "headers": { "Authorization": "Bearer va_live_..." }
  }
}
```

**Claude Desktop / stdio-only clients via mcp-remote:**

```json
{
  "vendai": {
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote",
      "https://your-vendai-host/api/mcp",
      "--header",
      "Authorization: Bearer va_live_..."
    ]
  }
}
```

### Tools exposed

Each native tool registers as `vendai_<slug>` (slug uses underscores). v1 launches with:

| MCP tool name | What it does | Cost |
|---|---|---|
| `vendai_editorial_rewriter` | Rewrites text in editorial-Swiss voice | 4 coins |
| `vendai_url_bullets` | Reads a URL, returns three editorial bullets | 12 coins |

Calls bill the API-key-owner's wallet. If the owner has an active VIP grant, pulls bill the budget pool instead. Failed calls auto-refund within 5s.

### How it routes internally

```
Claude Desktop → POST /api/mcp (Bearer va_live_...)
                  ↓
                  withMcpAuth → verifyApiKey() → { userId, email }
                  ↓
                  registerVendaiTools handler reads extra.authInfo
                  ↓
                  dispatch(slug, input, { userId, email })  ← same dispatcher
                  ↓                                            the arcade uses
                  Native adapter → tool.handler() → output
                  ↓
                  Auto-refund if it threw, settle if it didn't
                  ↓
                  Return MCP tool response (text + structuredContent)
```

One registry. Two surfaces (web + MCP). Same coin economy.

---

## Spec deviations (v1 reality vs. spec)

These are intentional. Logged here so future-you doesn't grep for missing pieces.

| Spec said | v1 actual | Why |
|---|---|---|
| Auth.js v5 + Drizzle adapter | Custom JWT-cookie + magic-link via Resend | cms-template's `auth.ts` already used JWT-cookie; Auth.js was in deps but not wired. JWT pattern is lighter, faster to ship, same UX. |
| OpenRouter aggregator | Anthropic SDK direct | Both v1 tools use Claude. OpenRouter wraps in v1.1+ when first non-Claude tool ships. |
| Stripe pack purchases | Operator manual grant via `/control/grant-coins` | Spec already deferred Stripe to v1.1; admin grant route lets us test wallet end-to-end without it. |
| HTTP + Sandbox adapters live | Both scaffolded; throw if invoked | Spec called for these in v1 to validate the contract; v1 ships only Native fully wired. Adapters land when first partner / first sandbox submission is approved. |
| Theme dial 4 modes | Primary only | Custom/Clean/Retro themes scaffolded as `brand.features.themeDial: true` flag; mode-specific overrides ship in v1.1. |

## What you do on return

1. **Provision the 4 environment variables** (see Quickstart §2).
2. **Connect Vercel** to `worker-max/AI-Tool-Vending-Machine` repo.
3. **Run** `npm run db:push` against your Neon DB.
4. **Sign in** with `OPERATOR_EMAIL`, then **POST `/api/admin/seed`** to publish UNIT 014.
5. **Review** `feat/v1-foundation` branch. **Merge** to `main` when happy.
6. **(Optional)** Pick a custom domain; wire to Vercel.
7. **(Optional)** Reconnect Notion MCP and migrate `docs/PROJECT.md` into the workspace.

## Hard rules honored (per [SITE-FOUNDATION](../claude-projects/cms-template/docs/SITE-FOUNDATION.md))

- No tech-forward visual clichés (no neon, gradients, neural-net iconography).
- No scripted/decorative fonts (Inter / JetBrains Mono / Source Serif 4 only).
- No CenterWell / Humana mentions.
- No connection to brother's projects.
- No commits directly to `main` (this branch is `feat/v1-foundation`).
- All commits authored by `worker@workforcewave.com` (Vercel-verified).

## Build commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run db:generate  # drizzle-kit generate (migrations)
npm run db:push      # drizzle-kit push (no-migration sync, dev-only)
npm run db:migrate   # drizzle-kit migrate (production)
```
