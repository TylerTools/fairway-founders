# Agent Coordination

Async board for AI agents working this repo in parallel. A committed file (not a
live chat) is the source of truth for "who's touching what," because agents
aren't reliably on the same channel.

> Every agent: at session START, read the *Active claims* table + the *Recent
> log* (newest-first — you only need ~the last 2 weeks). Update it when you
> start/finish a chunk. You do NOT need the archived history under
> docs/agent-log/ unless chasing something specific.

## How to use
1. Before editing, scan Active claims. If your work overlaps a claim, pick
   non-overlapping work or coordinate in the log (relayed via your human
   operator if agents can't message each other directly).
2. Claim your area — add/maintain a row in Active claims.
3. Release when you pause/finish — remove your row or note it in the log.
4. Write terse — fewest words possible. Log entries are 1–2 sentences max: state
   the decision/claim/hand-off and stop. No reasoning, recap, or paragraphs —
   verbosity here is the #1 way this always-loaded file bloats context. Newest
   first; every entry MUST begin with its date YYYY-MM-DD (load-bearing — makes
   "recent vs. archive" a mechanical date cut). @name a peer.
5. Self-maintain on read. You already pull this file at session start — so on
   the way through, move any Recent-log entry older than ~2 weeks into
   docs/agent-log/<YYYY-MM>.md (grouped by the entry's month; create if missing).
   The read you already do IS the cleanup — no script, no cron. The archive is
   read on-demand only.

## Active claims
| Agent | Area / files | Status |
|---|---|---|
| @claude-members | Members/networking: `app/network/*`, `app/me/*`, `app/roster/*`, `app/actions/{interactions,analytics,stats,profile}.ts`, `app/api/vcard/*`, networking `components/*` (MemberCard, MemberDirectory, CountTags, InteractionIcons, ProfileInteractionButtons, ProfileAnalytics, NetworkLeaderboard, Track*) | wrapping up — M1–M5 + sponsor/club value reports shipped |
| @claude-design | Design system (`BRAND.md`, `ff-card`/`ff-btn` in `app/globals.css`), admin cockpit (`app/admin/*`), sponsorship placements (`lib/sponsorship-placements.ts`, `/sponsors`) | ongoing |
| @claude-gameplay | Gameplay/scoring: `app/leaderboard/*`, `lib/{scoring,course-holes}.ts`, `app/actions/{scores,groups,test-game,holes,round}.ts`, `app/admin/test/*`, `components/{PlayNowBall,BackToGameBall}.tsx` | active — live test-game flow |
| @claude-mcp | Admin MCP server (Claude connector): `app/api/mcp/*`, `app/.well-known/*`, `lib/mcp/*`; deps `mcp-handler`+`@clerk/mcp-tools`; 1-line `proxy.ts` public-route add | shipped — needs Clerk OAuth app + claude.ai connector setup by Tyler |
| @claude-onboarding | Sign-up onboarding + `industry`/`seeking`/`goals` surfacing: `components/OnboardingWizard.tsx`, `app/actions/onboarding.ts`, `lib/onboarding-options.ts`, `onboarded_at` gate in `app/layout.tsx` | Phase 1 + 2 shipped (wizard, /me edit, MemberCard/Directory, industry pairing). Roster query + profile-page display edits sit on disk in `roster/*` — preserve when you commit referrals. |
| @claude-referrals | Friend referrals + cart-partner requests: `app/actions/{referrals,rsvp}.ts`, `lib/{current-user,groups,notify}.ts`, `components/{InviteFriend,InviteCard,InviteLeaderboard,CartPartnerPicker}.tsx`, `/join/[slug]`; additive surfacing on `/me`,`/roster`,`/network`,`/admin/access`,`/dashboard` | done — on a branch + PR, not main |

## Recent log
_(last ~2 weeks, newest first — older entries rotate to docs/agent-log/<YYYY-MM>.md)_

- **2026-08-23 — @claude-routine (builder-worker, dev item cms6xr0hm001dl504r2j52ozj):** Payment/order ledger schema. Additive migrations `add_payment_orders_schema` + `add_order_linkage_to_rsvps_and_sponsorships`: new `orders`/`order_audit_events` tables (NMI refs, idempotency, refunds, receipts, insert-only audit trail), nullable `order_id` on `rsvps`/`sponsorships`. RLS enabled, zero client policies (service-role only, matches repo convention) — no PAN/CVV/card data columns. `lib/database.types.ts` regenerated. Rotated stale (>2wk) Recent-log entries to `docs/agent-log/2026-06.md` / `2026-07.md`.

---

# Building UI? Read BRAND.md first

Before writing or changing any member- or admin-facing UI, read
[`BRAND.md`](BRAND.md) and follow it exactly — and see `CLAUDE.md` for the full
project guide. Quiet, editorial members-club design. The most common mistake is
flat UI: **every card uses `ff-card`; every primary button uses `ff-btn` +
`ff-btn-pine`/`ff-btn-gold`/`ff-btn-secondary`** (defined in `app/globals.css`).
One brand green `#1A3A2E` (never `#2E5D3A`); no emoji or decorative glyphs (only
`✓`, `←`, `→`); no photography in the app.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
