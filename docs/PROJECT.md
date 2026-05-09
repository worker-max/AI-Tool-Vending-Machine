# VEND/AI — Site Build

> **Note:** Notion MCP wasn't connected in this build session. This file is the Notion-equivalent reference you can copy into Notion on return (or just keep using as the local source of truth). Format mirrors the standard project page from the `site-template-protocol` skill.

**Status:** Brainstorm complete · Autonomous build in progress · v1 ships when foundation+code committed
**Last updated:** 2026-05-09
**Lineage:** First citizen of the city of AI creatures.
**Foundation seed:** [cms-template/docs/SITE-FOUNDATION.md](../../claude-projects/cms-template/docs/SITE-FOUNDATION.md)
**Spec:** [docs/plans/2026-05-09-vendai-v1-design.md](plans/2026-05-09-vendai-v1-design.md)
**GitHub:** [worker-max/AI-Tool-Vending-Machine](https://github.com/worker-max/AI-Tool-Vending-Machine)

---

## Vision

City of AI creatures. VEND/AI is the first citizen — an editorial AI-tool arcade where each slot holds a creature with a name, glyph, voice, and personality. Visitors insert coins, pull a lever, and the creature dispenses an output. Editorial-Swiss aesthetic (paper, ink, tangerine), arcade *energy* (not arcade *visuals*). Far from AI slop.

---

## Locked decisions (15)

| # | Decision | Choice |
|---|---|---|
| 01 | Foundation | Clone cms-template, rewrite brand.config.ts, hard separation from WFW |
| 02 | Spec scope | VEND/AI first; foundation extracted post-launch |
| 03 | Vision frame | City of AI creatures; first citizen; tools = creatures |
| 04 | Aesthetic | Editorial / Swiss. Paper, ink, tangerine, hairlines. Arcade energy not visuals |
| 05 | Tool runtime | Shape-agnostic contract: sync / async / streaming / voice. v1 ships sync only |
| 06 | Tool packaging | Hybrid: native + http + sandbox. v1 ships native fully wired |
| 07 | Coin economy | Tool-specific flat price. 1 coin = $0.01. Auto-refund on failure |
| 08 | Submission | Form-based v1 at /submit. CLI/portal post-v1 |
| 09 | Machines | 1 at launch, "UNIT 014". Schema supports n |
| 10 | Identity | Auth.js v5 magic-link via Resend |
| 11 | Persona | Per-tool record. No separate creatures table |
| 12 | Admin | CRUD per resource on cms-template scaffold |
| 13 | LLM provider v1 | Anthropic SDK direct (Claude Sonnet 4.6) |
| 14 | Stripe | Not in v1. Admin grants coins manually |
| 15 | Domain | Vercel preview URL for v1; pick custom on return |

---

## Build phases (this is the de-facto task board)

- [ ] 1. Foundation rebrand
- [ ] 2. Drizzle schema (va_ prefix)
- [ ] 3. Auth.js + Resend magic-link
- [ ] 4. Middleware (hostname split + auth gating)
- [ ] 5. Tool registry + Native adapter
- [ ] 6. Starter tools (Editorial Rewriter + URL → 3 Bullets)
- [ ] 7. Wallet & coin ledger
- [ ] 8. Coupons + VIP grants
- [ ] 9. Public arcade UX (slot grid + lever + dispense)
- [ ] 10. Operator admin panel
- [ ] 11. Submission pipeline (form-based)
- [ ] 12. Colin's signatures (footer portal, console welcome, hidden interaction)
- [ ] 13. README + env onboarding
- [ ] 14. Typecheck + build verify
- [ ] 15. Git init + commit + push

(Each box gets checked as the corresponding commit lands.)

---

## What you need to do on return

1. **Provision 4 environment variables:**
   - `DATABASE_URL` — Neon Postgres connection string
   - `AUTH_SECRET` — Auth.js JWT signing (run `npx auth secret` to generate)
   - `RESEND_API_KEY` — for magic-link email delivery
   - `ANTHROPIC_API_KEY` — for the v1 starter tools (Claude Sonnet 4.6)
2. **Connect Vercel project** to GitHub repo `worker-max/AI-Tool-Vending-Machine`
3. **Run db migrations** against the Neon DB (`npm run db:push` or `npm run db:migrate`)
4. **Review the feature branch** (`feat/v1-foundation`), then merge to main
5. **Optional:** pick a custom domain (vendai.com? vend.ai? vend-ai.com?)
6. **Optional:** reconnect Notion MCP and copy this page into the workspace

---

## Out of scope for v1 (deferred)

- Stripe wiring (wallet UI works, payment doesn't)
- HTTP and Sandbox tool packaging adapters (Native fully wired only)
- Async / streaming / voice tool shapes (Sync only)
- Theme dial Clean / Retro / Custom modes (Primary only)
- ElevenLabs voice integration
- OpenRouter aggregator
- Submission CLI / full developer portal
- Cross-site identity / agent bus
- Custom domain wiring

---

## Open questions for post-v1

- When does the first **partner HTTP tool** land?
- When does the first **public sandbox submission** get approved?
- **Custom domain pick:** vendai.com / vend.ai / vend-ai.com?
- **Stripe:** same account as ruckuscommittee or new?
- **VIP roster at launch?**
- **Launch coupon:** WELCOME / BETA?
- **Lore page** acknowledging the city-of-AI-creatures frame on `/about`?

---

## References

| Resource | Path / URL |
|---|---|
| Design spec | `C:/Users/chigh/vendai/docs/plans/2026-05-09-vendai-v1-design.md` |
| Foundation seed | `C:/Users/chigh/claude-projects/cms-template/docs/SITE-FOUNDATION.md` |
| Design guidelines | `C:/Users/chigh/Downloads/Design Guidelines.html` |
| Local code | `C:/Users/chigh/vendai/` |
| GitHub repo | `github.com/worker-max/AI-Tool-Vending-Machine` |
| `/new-site` skill | `C:/Users/chigh/.claude/skills/site-template-protocol/SKILL.md` |
