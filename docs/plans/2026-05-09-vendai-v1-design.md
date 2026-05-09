# VEND/AI — v1 Design Spec

**Date:** 2026-05-09
**Status:** Approved for implementation (autonomous build authorized)
**Foundation lineage:** [SITE-FOUNDATION.md](../../../claude-projects/cms-template/docs/SITE-FOUNDATION.md)
**Related:** [Design Guidelines.html](../../../Downloads/Design%20Guidelines.html)

---

## 1. Overview

VEND/AI is an editorial AI-tool arcade. Visitors browse a slot grid, insert coins, pull a lever, and a creature dispenses an output. It is the first citizen of Colin Highland's "city of AI creatures" — designed to be a model foundation for every future AI-bearing site he builds.

The aesthetic is **editorial / Swiss / spec-sheet**, not arcade-neon. The interaction model is arcade; the visuals are MIT Press. This tension is the design's core move and the antidote to AI slop.

### The unit of dispense

Each slot in the machine holds one **tool**. A tool is a creature with:
- A name and bio
- A glyph (editorial silhouette, not generic AI iconography)
- A shape: `sync | async | streaming | voice` (only `sync` shipped in v1)
- A packaging: `native | http | sandbox` (only `native` fully wired in v1)
- A pricing: tool-specific flat coin cost
- A schema: typed input + output contracts

Visitors with sufficient coins pull the lever; the tool runs; output appears in the dispense tray.

---

## 2. Locked decisions (the bones)

| # | Decision | Choice |
|---|---|---|
| 01 | Foundation | Clone `cms-template`. Rewrite `brand.config.ts` in commit 1. Hard separation from WFW. |
| 02 | Spec scope | VEND/AI first. Foundation extracted post-launch. |
| 03 | Vision | City of AI creatures. VEND/AI is first citizen. Each tool is a creature. |
| 04 | Aesthetic | Editorial / Swiss. Paper, ink, tangerine, hairlines. Arcade *energy*, not arcade *visuals*. |
| 05 | Tool runtime | Shape-agnostic contract: `sync` / `async` / `streaming` / `voice`. v1 ships `sync` only. |
| 06 | Tool packaging | Hybrid: `native` / `http` / `sandbox`. v1 ships `native` fully wired; `http` and `sandbox` adapters scaffolded but not in launch lineup. |
| 07 | Coin economy | Tool-specific flat price. Coins prepaid. 1 coin = $0.01. Auto-refund on failure. |
| 08 | Submission pipeline | Form-based v1 at `/submit`. Internal manifest is JSONB on `va_tool_submissions`. CLI/portal post-v1. |
| 09 | Machine count | 1 at launch, "UNIT 014" (consistent with design doc lore). Schema supports n. |
| 10 | Identity | Magic-link email auth via Auth.js v5 + Resend. Dev mode logs link to console. |
| 11 | Persona data | Per-tool record. No separate `creatures` table in v1. |
| 12 | Admin panel | CRUD per resource on cms-template scaffold. Editorial styling. |
| 13 | LLM provider (v1) | Anthropic SDK direct. Tool registry contract allows any provider; v1 tools all use Claude. |
| 14 | Stripe | Not in v1. Admin grants coins manually. Wallet model & UI ready for v1.1 wiring. |
| 15 | Domain | Vercel preview URL for launch. User picks final domain post-build. |

---

## 3. Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│                     vendai.com (Marketing)                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │  Arcade (slot   │  │  Tool detail     │  │  /submit   │  │
│  │  grid + lever)  │→ │  (lever pull)    │→ │  (form)    │  │
│  └─────────────────┘  └──────────────────┘  └────────────┘  │
│            ↓                    ↓                  ↓         │
└─────────────┼────────────────────┼─────────────────┼─────────┘
              │                    │                 │
       ┌──────▼─────┐      ┌───────▼──────┐   ┌──────▼──────┐
       │  /api/     │      │ /api/tools/  │   │  /api/      │
       │  wallet/*  │      │  [slug]/run  │   │ submissions │
       └──────┬─────┘      └───────┬──────┘   └──────┬──────┘
              │                    │                  │
              ▼                    ▼                  ▼
       ┌──────────────────────────────────────────────────────┐
       │          Drizzle ORM · Neon Postgres                 │
       │   (va_users · va_wallets · va_transactions ·         │
       │    va_tools · va_machines · va_coupons ·             │
       │    va_vip_grants · va_tool_submissions)              │
       └──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              control.vendai.com (Operator Admin)            │
│  Tools · Submissions · Coupons · VIPs · Wallet Ledger ·     │
│  Machines · Settings · API Keys                             │
└─────────────────────────────────────────────────────────────┘

         (Hostname split via src/middleware.ts)
```

### Tool registry contract (the keystone)

```ts
// src/lib/tools/contract.ts
export type ToolShape = 'sync' | 'async' | 'streaming' | 'voice';
export type ToolPackaging = 'native' | 'http' | 'sandbox';

export interface ToolPricing {
  kind: 'flat';        // v1 only — registry permits 'hybrid' for future
  coins: number;       // cost per pull
}

export interface ToolPersona {
  name: string;
  glyph: string;       // SVG path or symbol char (editorial, not AI-generic)
  bio: string;         // 1–2 sentences
  accent_color?: string;
  voice_profile?: string;
  creator_credit: string;
}

export interface ToolDefinition<I = unknown, O = unknown> {
  slug: string;        // URL-safe, registry key
  shape: ToolShape;
  packaging: ToolPackaging;
  pricing: ToolPricing;
  persona: ToolPersona;
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  // Native-only: handler runs in-process
  handler?: (input: I, ctx: ToolContext) => Promise<O>;
  // HTTP-only: signed proxy target
  endpoint?: { url: string; auth: 'hmac'; secretEnvKey: string };
  // Sandbox-only: package reference
  sandboxRef?: { manifestPath: string };
}

export interface ToolContext {
  userId: string;
  walletId: string;
  // Each tool has access to ctx.anthropic, ctx.openrouter, etc. (typed)
  anthropic: AnthropicClient;
}
```

### Dispatcher

```ts
// src/lib/tools/dispatcher.ts
async function dispatch(slug: string, rawInput: unknown, userId: string): Promise<DispatchResult> {
  const tool = await registry.get(slug);
  if (!tool) return { ok: false, error: 'NOT_FOUND' };
  
  const input = tool.inputSchema.safeParse(rawInput);
  if (!input.success) return { ok: false, error: 'INVALID_INPUT', details: input.error };
  
  // 1. Reserve coins (deduct from wallet, mark transaction pending)
  const reservation = await wallet.reserve(userId, tool.pricing.coins, slug);
  if (!reservation.ok) return { ok: false, error: 'INSUFFICIENT_COINS' };
  
  try {
    // 2. Route to adapter by packaging
    const adapter = adapters[tool.packaging];
    const output = await adapter.run(tool, input.data, await buildContext(userId));
    
    // 3. Validate output
    const validated = tool.outputSchema.safeParse(output);
    if (!validated.success) throw new ToolFailure('INVALID_OUTPUT');
    
    // 4. Settle transaction
    await wallet.settle(reservation.id);
    return { ok: true, output: validated.data };
  } catch (err) {
    // 5. Auto-refund within 5s
    await wallet.refund(reservation.id);
    return { ok: false, error: 'TOOL_FAILURE', details: err.message };
  }
}
```

---

## 4. Data model (Drizzle, `va_` prefix)

```ts
// src/lib/db/schema.ts (excerpts)

// Auth tables (Auth.js + Drizzle adapter)
export const users = pgTable('va_users', { ... });           // standard Auth.js shape
export const accounts = pgTable('va_accounts', { ... });
export const sessions = pgTable('va_sessions', { ... });
export const verificationTokens = pgTable('va_verification_tokens', { ... });

// Wallet & ledger
export const wallets = pgTable('va_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id).notNull().unique(),
  balanceCoins: integer('balance_coins').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactions = pgTable('va_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').references(() => wallets.id).notNull(),
  kind: text('kind', { enum: ['pull', 'refund', 'grant', 'redemption', 'pack_purchase'] }).notNull(),
  coins: integer('coins').notNull(),                          // signed: + grants, - pulls
  status: text('status', { enum: ['pending', 'settled', 'refunded', 'failed'] }).notNull(),
  toolSlug: text('tool_slug'),                                // null for grants/purchases
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Machines & tools
export const machines = pgTable('va_machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitNumber: text('unit_number').notNull().unique(),         // 'UNIT 014'
  displayName: text('display_name').notNull(),
  online: boolean('online').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tools = pgTable('va_tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  machineId: uuid('machine_id').references(() => machines.id).notNull(),
  slotCode: text('slot_code').notNull(),                      // 'A1' .. 'C3'
  slug: text('slug').notNull().unique(),                      // 'editorial-rewriter'
  shape: text('shape', { enum: ['sync', 'async', 'streaming', 'voice'] }).notNull(),
  packaging: text('packaging', { enum: ['native', 'http', 'sandbox'] }).notNull(),
  priceCoins: integer('price_coins').notNull(),
  // Persona data
  name: text('name').notNull(),
  glyph: text('glyph').notNull(),
  bio: text('bio').notNull(),
  accentColor: text('accent_color'),
  voiceProfile: text('voice_profile'),
  creatorCredit: text('creator_credit').notNull(),
  // Adapter config
  config: jsonb('config').$type<Record<string, unknown>>(),
  // State
  published: boolean('published').notNull().default(false),
  pullCount: integer('pull_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Coupons
export const coupons = pgTable('va_coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),                      // 'WELCOME25'
  grantCoins: integer('grant_coins').notNull(),               // coins given on redemption
  toolSlugRestriction: text('tool_slug_restriction'),         // null = any tool
  redemptionCap: integer('redemption_cap'),                   // null = unlimited
  redemptionCount: integer('redemption_count').notNull().default(0),
  expiresAt: timestamp('expires_at'),                         // null = never
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const couponRedemptions = pgTable('va_coupon_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  couponId: uuid('coupon_id').references(() => coupons.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
});

// VIP grants
export const vipGrants = pgTable('va_vip_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id).notNull().unique(),
  monthlyBudgetCoins: integer('monthly_budget_coins').notNull(),
  monthSpentCoins: integer('month_spent_coins').notNull().default(0),
  monthAnchor: timestamp('month_anchor').defaultNow().notNull(),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tool submissions
export const toolSubmissions = pgTable('va_tool_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  submitterEmail: text('submitter_email').notNull(),
  manifest: jsonb('manifest').notNull(),                       // full tool definition draft
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'needs_changes'] }).notNull().default('pending'),
  reviewerNotes: text('reviewer_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
});
```

---

## 5. Coin economy

### Wallet operations

```ts
// src/lib/wallet.ts
async function reserve(userId: string, coins: number, toolSlug: string): Promise<Reservation>
async function settle(reservationId: string): Promise<void>
async function refund(reservationId: string): Promise<void>
async function grant(userId: string, coins: number, reason: string): Promise<void>
async function redeemCoupon(userId: string, code: string): Promise<RedemptionResult>
```

### Pull lifecycle

1. User clicks lever on slot. Client posts to `/api/tools/[slug]/run` with input.
2. Server reserves coins (creates `pending` transaction).
3. If user is VIP: skip wallet reservation, increment `vip_grants.month_spent_coins` instead.
4. Dispatcher runs tool via the right adapter.
5. On success: settle transaction, increment `tools.pull_count`.
6. On failure: auto-refund within 5s (transaction → `refunded`).
7. Output streams back to client (or polled for async/streaming shapes — v1 is sync only, so it's a single response).

### Coupon redemption

- User enters code at `/coupons` or in the wallet UI.
- Server validates: active, not expired, redemption cap not hit, user hasn't already redeemed.
- Coins added to wallet. Redemption recorded.
- Optional `toolSlugRestriction` is a soft constraint at v1 (we accept the redemption, the UI hints which tool the coins were "intended" for; enforcement comes in v1.1).

### VIP behavior

- A user with `vip_grants.active = true` and `monthSpentCoins < monthlyBudgetCoins` gets pulls billed against their VIP budget instead of their wallet.
- When `monthAnchor + 30 days` rolls over: reset `monthSpentCoins` to 0.
- Operator sees per-VIP monthly summary in admin.

---

## 6. Public arcade UX

### Routes

```
/                       Marketing landing — "Insert coin"
/arcade                 The machine — slot grid + status bar + dispense tray
/arcade/[slot]          Tool detail — input form + lever + dispense panel
/coupons                Coupon redemption page
/wallet                 User's coin balance + transaction history
/auth/sign-in           Magic-link form
/submit                 Submission form (Tier 3)
/about                  Lore page (optional v1)
```

### Slot grid (homepage of `/arcade`)

The 3×3 slot grid from the design doc. Each slot renders:
- Slot code (A1, A2, ... C3)
- Glyph (SVG, large)
- Tool name (small caps)
- Price (e.g., `$0.04`)
- Hover state: bio + creator credit (subtle)
- Click → `/arcade/[slot]`

Featured slot is tangerine background; others paper.

### Lever-pull moment

`/arcade/[slot]` page:
- Top: slot identity (glyph, name, bio, price)
- Middle: input form (driven by `tool.inputSchema`, rendered as form)
- Bottom: a literal lever (CSS button, not skeumorphic) labeled "PULL"
- Below the lever: dispense tray (empty state: "Tray ready.")

On lever click:
- Lever animates (small scale + state change to "Working...")
- Coin balance ticks down with a brief animation
- ~1-5s later, output appears in the dispense tray with a hairline-bordered card

### Editorial design language

Pulled from `Design Guidelines.html`:
- Font stack: `var(--f-sans): "Inter", "Geist", system-ui` / `var(--f-mono): "JetBrains Mono", ui-monospace, monospace` / `var(--f-serif): "Source Serif Pro", Georgia, serif`
- Colors: `--paper: #faf8f3`, `--paper-2: #f3eee4`, `--ink: #1a1a1a`, `--ink-3: #6e6e6e`, `--tangerine: #d35400`, `--hairline: rgba(0,0,0,0.15)`
- Hairline rules everywhere
- Monospace metadata (slot codes, prices, dates, statuses) — uppercase, letterspaced
- Sans for body
- Italic serif for accents on display text only
- No glow, gradient, or drop-shadow

### Colin's signatures (per protocol)

- **Footer portal** — blinking cursor input, accepts a passphrase (default: `dispense intelligence`) → routes to a hidden lore page
- **Console welcome** — ASCII art (the vending machine illustration from the design doc) + greeting on dev tools open
- **One hidden interaction** — typing the Konami code on the arcade homepage swaps the slot grid into "test mode" (all symbols become emoji for 5 seconds). Light, easter-egg-grade.
- **Theme dial** — Primary (paper-ink-tangerine) wired in v1; Clean / Retro / Custom modes scaffolded as empty placeholders
- **Three-tier admin** — Content / Experience / System layers in the admin nav

---

## 7. Operator admin panel (`control.vendai.com`)

### Routes

```
/                       Dashboard — pulls today, revenue, top tools, alerts
/tools                  Tool list + create + edit
/submissions            Submission review queue
/coupons                Coupon list + create + edit
/vips                   VIP grant list + create + edit
/users                  User search + impersonate (dev only)
/wallet-ledger          Read-only ledger of all transactions
/machines               Machine list (just UNIT 014 in v1)
/settings               System settings + theme dial config
/api-keys               API key management for external automation
```

### Three-tier nav

- **Content:** Tools, Submissions, Machines
- **Experience:** Theme settings, Easter egg toggles, Footer portal codes
- **System:** Users, VIPs, Coupons, Wallet ledger, API keys, Settings

### Auth gating

- Single role for v1: `operator`. Set on the user record manually after first sign-in (or via env-driven seed: `OPERATOR_EMAIL` becomes operator on first login).
- Future: `partner` role for tool-submission reviewers, `admin` for super-admin (v1.1+).

---

## 8. Submission pipeline (Tier 3, v1 form-based)

### `/submit` form fields

- Tool name (required)
- Tool slug (slug-cased; uniqueness validated)
- Glyph (SVG paste or upload)
- Bio (1-2 sentences)
- Shape (sync only in v1; UI shows others as "Coming soon")
- Packaging (`http` or `sandbox` selectable; `native` is Colin-internal only)
- For `http`: endpoint URL + HMAC secret (will be regenerated on approval)
- For `sandbox`: zip upload (stored to Vercel Blob, manifest extracted)
- Pricing (coins per pull)
- Input schema (JSON paste — must be valid JSON Schema)
- Output schema (JSON paste — must be valid JSON Schema)
- Example input + expected output (for testing)
- Submitter email + name + creator credit string

Form posts to `/api/submissions` → creates `va_tool_submissions` row, status `pending`. Sends Colin an email notification (via Resend).

### Admin review

Submission detail page in admin: full manifest preview, "Run example" button (executes the submitted handler against the example input — for `http` packaging it calls the endpoint; for `sandbox` it would launch a microVM, but **v1 returns "Sandbox runtime not yet enabled — approve manually based on manifest review"**), Approve/Reject/Request changes buttons.

On approve: row migrates from `va_tool_submissions` to `va_tools`, slot assigned (next free slot in UNIT 014's grid), tool published.

---

## 9. Authentication

### Magic-link flow (Auth.js v5)

1. User enters email at `/auth/sign-in`.
2. Server generates verification token, stores in `va_verification_tokens`.
3. Sends email via Resend with link `https://vendai.com/api/auth/callback/email?token=...`.
4. Click → token consumed → session cookie set → redirected.
5. **Dev mode (no Resend key):** the magic link is logged to server console with prefix `[AUTH]`.

### Session model

- JWT cookie (Auth.js default).
- `session.user.id` carries through to every API route.
- `session.user.role`: `operator | user`. Operator gates admin routes via middleware.

### Protected route guards

```ts
// withAuth — requires session
// withOperator — requires operator role (admin routes)
// withWallet — wraps withAuth, attaches wallet to request context
```

---

## 10. Routing topology

### Hostname split via `src/middleware.ts`

```ts
// Pseudo-code
if (hostname === 'control.vendai.com' || (dev && pathname.startsWith('/control/'))) {
  rewrite to /(app)/...        // admin route group
} else {
  // public arcade
}
```

### Route groups

```
src/app/
├── (marketing)/         Public arcade
│   ├── page.tsx         Landing
│   ├── arcade/
│   │   ├── page.tsx     Slot grid
│   │   └── [slot]/page.tsx
│   ├── coupons/page.tsx
│   ├── wallet/page.tsx
│   ├── submit/page.tsx
│   └── auth/sign-in/page.tsx
├── (app)/               Operator admin (control.vendai.com)
│   ├── layout.tsx       Three-tier sidebar
│   ├── page.tsx         Dashboard
│   ├── tools/...
│   ├── submissions/...
│   ├── coupons/...
│   ├── vips/...
│   ├── wallet-ledger/...
│   ├── machines/...
│   ├── settings/...
│   └── api-keys/...
└── api/
    ├── auth/[...nextauth]/route.ts
    ├── tools/[slug]/run/route.ts
    ├── wallet/route.ts
    ├── coupons/redeem/route.ts
    ├── submissions/route.ts
    └── admin/...        (CRUD endpoints, operator-gated)
```

---

## 11. v1 starter tools

Two native tools, both `sync`, both calling Anthropic Claude:

### Tool 1: Editorial Rewriter
- **Slug:** `editorial-rewriter`
- **Slot:** A1
- **Glyph:** `∿`
- **Price:** 4 coins ($0.04)
- **Bio:** "Rewrites a paragraph in editorial-Swiss voice — clipped, ink-on-paper, no AI mush."
- **Input:** `{ text: string (max 1500 chars), tone?: 'crisp' | 'reportorial' | 'wry' }`
- **Output:** `{ rewritten: string }`
- **Handler:** Claude Sonnet 4.6 with a tight system prompt anchored on the design language.

### Tool 2: URL → 3 Bullets
- **Slug:** `url-bullets`
- **Slot:** A2 (featured, tangerine)
- **Glyph:** `◐`
- **Price:** 12 coins ($0.12)
- **Bio:** "Reads a URL, returns three editorial bullets. No fluff, no preamble."
- **Input:** `{ url: string }`
- **Output:** `{ bullets: [string, string, string], source_title: string }`
- **Handler:** Fetch URL → strip to text → Claude Sonnet 4.6 → structured output.

---

## 12. Deployment & environment

### Vercel

- New Vercel project linked to `worker-max/AI-Tool-Vending-Machine` (post-build, by user).
- Build = `next build`.
- `main` → production. Feature branches → preview URLs.
- Preview URL is the v1 launch URL until custom domain is wired.

### Required environment variables (4)

| Var | Purpose | If missing |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection | App fails on first DB query. Must be set. |
| `AUTH_SECRET` | Auth.js JWT signing | Generated as `npx auth secret` if absent in prod; dev defaults to a fixed dev secret. |
| `RESEND_API_KEY` | Magic-link email delivery | Falls back to console-logging the magic link in dev. Prod requires it. |
| `ANTHROPIC_API_KEY` | LLM provider for v1 tools | Tool calls return error; rest of site works. |

### Optional environment variables

| Var | Purpose |
|---|---|
| `OPERATOR_EMAIL` | Email that auto-promotes to operator role on first sign-in. |
| `RESEND_FROM` | Sender address for magic links (default `noreply@vendai.com`). |
| `STRIPE_SECRET_KEY` | Reserved for v1.1 pack-purchase wiring. |

---

## 13. Hard constraints honored

- **No tech-forward visual clichés** ([feedback-no-tech-forward-aesthetic](../../../Users/chigh/.claude/projects/C--Users-chigh/memory/feedback-no-tech-forward-aesthetic.md)).
- **No scripted/decorative fonts** ([feedback-no-scripted-fonts](../../../Users/chigh/.claude/projects/C--Users-chigh/memory/feedback-no-scripted-fonts.md)).
- **No CenterWell or Humana mentions** anywhere in copy.
- **No connection to brother's projects** — VEND/AI is its own entity.
- **Never commit to `main`** — implementation goes on `feat/v1-foundation` branch; user merges on review.
- **Vercel commit-author** = `worker@workforcewave.com` (verified team email).
- **No new external accounts** created — user wires env on return.

---

## 14. Out of scope for v1 (deferred)

- Stripe pack purchases (admin grants coins manually for v1 testing)
- HTTP packaging adapter wired to a live partner (adapter scaffolded; no partner onboarded)
- Sandbox packaging adapter wired to Vercel Sandbox (adapter scaffolded; submissions pile up unprocessed in the queue)
- Async / streaming / voice tool runtimes (contract supports; runtimes shipped in v1.1+)
- Theme dial Clean / Retro / Custom modes (Primary only; modes wired as empty placeholders)
- Custom domain (Vercel preview URL is the launch URL)
- Submission CLI (`npx vendai-tool init/test/submit`) — v1.5+
- Full developer portal — v1.5+
- Cross-site identity / agent bus — foundation extraction phase, post-v1
- ElevenLabs voice integration — v1.1 if Tool 3 is voice
- OpenRouter aggregator — wire when a non-Claude tool ships

---

## 15. Open questions for post-v1

1. When does the first **partner-submitted HTTP tool** land? (Determines when HTTP adapter gets battle-tested.)
2. When does the first **public sandbox submission** get approved? (Determines when Sandbox adapter gets first real test.)
3. **Custom domain selection:** `vendai.com`? `vend.ai`? `vend-ai.com`?
4. **Stripe wiring** — same Stripe account as ruckuscommittee, or new?
5. **VIP roster at launch** — who gets VIP grants? (You have the list; admin lets you add them on return.)
6. **Coupon strategy** — launch with a `WELCOME` code? `BETA` code for first 100 testers?
7. **The lore** — UNIT 014 implies machines 1–13 exist somewhere. Worth writing a short lore page (for /about) that acknowledges the city-of-AI-creatures frame? Could be a transmission piece on colinhighland.com instead.

---

## 16. Implementation sequence

The autonomous build executes in this order, committing after each phase:

1. **Foundation rebrand** — copy cms-template structure → `vendai/`, replace `brand.config.ts`, update `package.json`/`README`, set `.env.example`. *Commit: `feat: bootstrap from cms-template`.*
2. **Drizzle schema** — full `va_*` schema with relations, migration generated. *Commit: `feat: drizzle schema (va_ prefix)`.*
3. **Auth.js + Resend** — magic-link flow wired, dev-mode console fallback. *Commit: `feat: auth.js v5 magic-link via resend`.*
4. **Middleware** — hostname split + auth gating. *Commit: `feat: hostname split + auth middleware`.*
5. **Tool registry + Native adapter** — contract, dispatcher, registry loader. *Commit: `feat: tool registry + native adapter`.*
6. **Two starter tools** — Editorial Rewriter + URL → Bullets. *Commit: `feat: starter tools (editorial-rewriter, url-bullets)`.*
7. **Wallet & coin economy** — reserve/settle/refund, grant, ledger. *Commit: `feat: wallet + coin ledger`.*
8. **Coupons + VIP** — redemption logic, admin grant, VIP budget tracking. *Commit: `feat: coupon redemption + vip grants`.*
9. **Public arcade UX** — slot grid, tool detail, lever, dispense tray. *Commit: `feat: arcade ux (slot grid, lever, dispense)`.*
10. **Operator admin** — three-tier sidebar, CRUD pages. *Commit: `feat: operator admin panel`.*
11. **Submission pipeline** — `/submit` form + admin review. *Commit: `feat: submission pipeline (form-based)`.*
12. **Signatures** — footer portal, console welcome, hidden interaction. *Commit: `feat: footer portal + console welcome (signatures)`.*
13. **README + docs** — onboarding, env wiring, dev commands. *Commit: `docs: readme + env onboarding`.*
14. **Verify** — typecheck + build pass. *Commit: `chore: typecheck + build verified`.*
15. **Push to GitHub** — `worker-max/AI-Tool-Vending-Machine`, branch `feat/v1-foundation`.

---

**End of v1 design spec.**
