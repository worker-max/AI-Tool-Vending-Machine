// VEND/AI — Drizzle schema
//
// Table prefix: `va_`
// Spec: docs/plans/2026-05-09-vendai-v1-design.md (section 4)

import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ── Enums ───────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("va_user_role", ["user", "operator"]);
export const transactionKindEnum = pgEnum("va_transaction_kind", [
  "pull",
  "refund",
  "grant",
  "redemption",
  "pack_purchase",
  "vip_pull",
]);
export const transactionStatusEnum = pgEnum("va_transaction_status", [
  "pending",
  "settled",
  "refunded",
  "failed",
]);
export const toolShapeEnum = pgEnum("va_tool_shape", [
  "sync",
  "async",
  "streaming",
  "voice",
]);
export const toolPackagingEnum = pgEnum("va_tool_packaging", [
  "native",
  "http",
  "sandbox",
]);
export const submissionStatusEnum = pgEnum("va_submission_status", [
  "pending",
  "approved",
  "rejected",
  "needs_changes",
]);

// ── Users + sessions (custom, no Auth.js) ───────────────────────────────

export const users = pgTable(
  "va_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    role: userRoleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("va_users_email_idx").on(t.email)]
);

export const magicLinkTokens = pgTable(
  "va_magic_link_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("va_magic_link_email_idx").on(t.email),
    uniqueIndex("va_magic_link_hash_idx").on(t.tokenHash),
  ]
);

// ── Wallet & ledger ─────────────────────────────────────────────────────

export const wallets = pgTable(
  "va_wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    balanceCoins: integer("balance_coins").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("va_wallets_user_idx").on(t.userId)]
);

export const transactions = pgTable(
  "va_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id")
      .references(() => wallets.id, { onDelete: "cascade" })
      .notNull(),
    kind: transactionKindEnum("kind").notNull(),
    coins: integer("coins").notNull(), // signed: + grants/purchases, - pulls
    status: transactionStatusEnum("status").notNull(),
    toolSlug: text("tool_slug"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("va_tx_wallet_idx").on(t.walletId),
    index("va_tx_status_idx").on(t.status),
  ]
);

// ── Machines & tools ────────────────────────────────────────────────────

export const machines = pgTable(
  "va_machines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitNumber: text("unit_number").notNull(),
    displayName: text("display_name").notNull(),
    online: boolean("online").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("va_machines_unit_idx").on(t.unitNumber)]
);

export const tools = pgTable(
  "va_tools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    machineId: uuid("machine_id")
      .references(() => machines.id, { onDelete: "cascade" })
      .notNull(),
    slotCode: text("slot_code").notNull(), // 'A1' .. 'C3'
    slug: text("slug").notNull(),
    shape: toolShapeEnum("shape").notNull(),
    packaging: toolPackagingEnum("packaging").notNull(),
    priceCoins: integer("price_coins").notNull(),
    // Persona (the creature)
    name: text("name").notNull(),
    glyph: text("glyph").notNull(),
    bio: text("bio").notNull(),
    accentColor: text("accent_color"),
    voiceProfile: text("voice_profile"),
    creatorCredit: text("creator_credit").notNull(),
    // Adapter config (HTTP endpoint, sandbox manifest ref, etc.)
    config: jsonb("config").$type<Record<string, unknown>>(),
    // State
    published: boolean("published").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    pullCount: integer("pull_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("va_tools_slug_idx").on(t.slug),
    uniqueIndex("va_tools_machine_slot_idx").on(t.machineId, t.slotCode),
    index("va_tools_published_idx").on(t.published),
  ]
);

// ── Coupons ─────────────────────────────────────────────────────────────

export const coupons = pgTable(
  "va_coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    grantCoins: integer("grant_coins").notNull(),
    toolSlugRestriction: text("tool_slug_restriction"),
    redemptionCap: integer("redemption_cap"),
    redemptionCount: integer("redemption_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("va_coupons_code_idx").on(t.code)]
);

export const couponRedemptions = pgTable(
  "va_coupon_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .references(() => coupons.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("va_redemption_coupon_user_idx").on(t.couponId, t.userId),
  ]
);

// ── VIP grants ──────────────────────────────────────────────────────────

export const vipGrants = pgTable(
  "va_vip_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    monthlyBudgetCoins: integer("monthly_budget_coins").notNull(),
    monthSpentCoins: integer("month_spent_coins").notNull().default(0),
    monthAnchor: timestamp("month_anchor", { withTimezone: true })
      .defaultNow()
      .notNull(),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("va_vip_user_idx").on(t.userId)]
);

// ── Tool submissions (Tier 3, form-based) ───────────────────────────────

export const toolSubmissions = pgTable(
  "va_tool_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submitterEmail: text("submitter_email").notNull(),
    submitterName: text("submitter_name"),
    proposedSlug: text("proposed_slug").notNull(),
    proposedName: text("proposed_name").notNull(),
    manifest: jsonb("manifest").notNull().$type<Record<string, unknown>>(),
    status: submissionStatusEnum("status").notNull().default("pending"),
    reviewerNotes: text("reviewer_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [index("va_submissions_status_idx").on(t.status)]
);

// ── API keys (for external automation, v1.1+) ───────────────────────────

export const apiKeys = pgTable(
  "va_api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    keyHash: text("key_hash").notNull(),
    keyPreview: text("key_preview").notNull(), // first 8 chars for display
    createdByUserId: uuid("created_by_user_id").references(() => users.id),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("va_api_keys_hash_idx").on(t.keyHash)]
);

// ── Type exports ────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Machine = typeof machines.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;
export type VipGrant = typeof vipGrants.$inferSelect;
export type ToolSubmission = typeof toolSubmissions.$inferSelect;
