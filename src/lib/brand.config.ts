// VEND/AI — Brand Configuration
//
// THE file that makes this site reusable. Swap this file in another clone of cms-template
// to create a new site at the same model foundation. Every brand-specific value lives here.
//
// Lineage: cms-template/docs/SITE-FOUNDATION.md (foundation seed)
// Spec:    docs/plans/2026-05-09-vendai-v1-design.md

export const brand = {
  name: "VEND/AI",
  tagline: "Dispense intelligence with precision.",
  description:
    "An editorial AI-tool arcade. Browse the slot grid, insert coins, pull the lever, and a creature dispenses an output. Far from AI slop.",
  domain: "vendai.com",
  unitNumber: "UNIT 014",

  logo: {
    full: "",
    icon: "",
    footer: "",
    mobilNav: "",
  },

  // Editorial / Swiss palette. Paper, ink, tangerine. No gradients, no glow.
  colors: {
    paper: "#faf8f3",
    paper2: "#f3eee4",
    ink: "#1a1a1a",
    ink2: "#3a3a3a",
    ink3: "#6e6e6e",
    tangerine: "#d35400",
    tangerineWash: "#fff8ec",
    hairline: "rgba(0, 0, 0, 0.15)",
    success: "#2f7a4f",
    danger: "#a83232",
  },

  // Modern sans systems only. No scripted/decorative fonts.
  fonts: {
    sans: "Inter",
    mono: "JetBrains Mono",
    serifAccent: "Source Serif Pro",
    display: "Inter",
  },

  nav: [
    { label: "Arcade", href: "/arcade" },
    { label: "Coupons", href: "/coupons" },
    { label: "Submit a tool", href: "/submit" },
    { label: "About", href: "/about" },
  ],

  cta: {
    label: "Insert coin",
    href: "/auth/sign-in",
  },

  footer: {
    columns: [
      {
        title: "ARCADE",
        links: [
          { label: "All tools", href: "/arcade" },
          { label: "Coupons", href: "/coupons" },
          { label: "Wallet", href: "/wallet" },
        ],
      },
      {
        title: "OPERATORS",
        links: [
          { label: "Submit a tool", href: "/submit" },
          { label: "Sign in", href: "/auth/sign-in" },
        ],
      },
      {
        title: "ABOUT",
        links: [
          { label: "The city", href: "/about" },
          { label: "Privacy", href: "/privacy" },
        ],
      },
    ],
    copyright: "VEND/AI · A Colin Highland project",
  },

  contact: {
    email: "",
    phone: "",
  },

  seo: {
    defaultDescription:
      "An editorial AI-tool arcade. Insert coins, pull a lever, dispense intelligence.",
    ogImage: "/images/og-default.png",
  },

  // Tier 1: every site has these signature features. Tier 2/3: AI / submission.
  features: {
    // Tier 2
    arcade: true,
    coinEconomy: true,
    coupons: true,
    vipGrants: true,
    // Tier 3
    submissions: true,
    sandboxAdapter: false, // scaffolded; not active in v1
    httpAdapter: false, // scaffolded; not active in v1
    // Tier 1 signatures
    footerPortal: true,
    consoleWelcome: true,
    themeDial: true, // Primary mode only in v1
    threeTierAdmin: true,
    // Reserved for v1.1+
    streamingTools: false,
    asyncTools: false,
    voiceTools: false,
    stripePackPurchases: false,
  },

  collections: {
    prefix: "va",
  },
} as const;

export type Brand = typeof brand;
