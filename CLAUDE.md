# Fairway Founders

## What we're building

Fairway Founders is a private, weekly networking app for ~16–30 founders and operators who play a 9-hole scramble together. Members RSVP through Tuesday evening; at cutoff the system auto-builds foursomes that minimize repeat pairings and spread professions, then assigns each group a cart pairing and a starting hole for a 2:30 PM Thursday shotgun. During the round an admin posts hole-by-hole scores to a live, handicap-net leaderboard. The course pro shop gets a printable cart-label PDF and a draft confirmation email so check-in is one tap. The product feel is a quiet, editorial members club — Fraunces serif headlines on navy/gold/cream — not a spreadsheet.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind (with brand tokens for navy `#1A3A2E`, gold `#C9A961`, cream `#F5F1E8`, plus Fraunces + Inter via `next/font`)
- **DB:** Supabase Postgres
- **DB client:** `@supabase/supabase-js` (no Prisma — schema lives in Supabase migrations)
- **Auth:** Clerk
- **Email:** Resend (pro-shop confirmations, RSVP reminders later — deferred to Phase 2)
- **Hosting:** Vercel
- **Server interactions:** prefer **server actions** over API routes; only fall back to route handlers when a third party requires a webhook URL.

## Roles

Three roles drive what tabs and actions are visible. Role lives on `User.role`; Clerk handles auth, app handles authorization.

- **member** — RSVPs to upcoming events, edits own profile (bio / handicap / helps), sees own foursome + cart + hole after cutoff, browses roster, watches the live leaderboard.
- **admin** — everything member can do, plus: configure the event (course layout, fee, pro-shop email), manage the RSVP list, run the grouping algorithm, manually swap players between foursomes, enter scores, trigger cart-label print + pro-shop email.
- **course** — read-only operations view: event summary (player count, cart count, layout, total fee), hole/cart breakdown with last names only (no bios), and access to print labels + draft pro-shop email. No member profile or networking surfaces.

## Data model

Five tables in the `public` schema, snake_case columns (Supabase convention). **Pairing history is derived from past `foursome_members` rows — there is no separate history table.**

- **users** — `id`, `clerk_id`, `email`, `name`, `company`, `professional_role`, `bio`, `handicap`, `helps` (text[]), `app_role` (`member` | `admin` | `course`), `created_at`, `updated_at`.
- **events** — `id`, `date`, `opens_at`, `closes_at`, `course_config` (`front` | `back` | `both`), `fee_cents`, `pro_shop_email`, `status` (`locked` | `open` | `closed` | `past`), `created_at`, `updated_at`.
- **rsvps** — `id`, `event_id`, `user_id`, `created_at`. Unique on (`event_id`, `user_id`).
- **foursomes** — `id`, `event_id`, `hole`, `tier` (`A`/`B`/`C` for overflow), `group_index`, `score` (algorithm cost, for debugging).
- **foursome_members** — `id`, `foursome_id`, `user_id`, `cart_number`. Unique on (`foursome_id`, `user_id`). Source of truth for both group composition AND historical pairings.

Score entries (Phase 2) live on a separate `hole_scores` table keyed by (`foursome_id`, `hole`).

## Phase 1 scope

Goal: a working private event flow end-to-end for one club, no scoring yet.

1. Clerk auth + protected routes; server helper that resolves Clerk user → `user` row (auto-creates on first sign-in).
2. Supabase migrations for user / event / rsvp / foursome / foursome_members + hole_score (Phase 2 scaffold).
3. Seed data: load the 16 mock founders from the prototype; `tyler@eminence.business` flagged `app_role='admin'`.
4. RSVP flow: calendar strip, RSVP toggle, cutoff countdown, status states (locked / open / closed / past).
5. Profile editor: bio, handicap (0–54), helps tags.
6. Admin: generate groups (port `partitionSizes` / `generateGroups` / `assignCartPairs` / `assignHoles` from the prototype, swapping in real Supabase data and derived pairing history), manual player swap, course-layout + fee + pro-shop-email settings.
7. Member group reveal: starting hole, cart number, cart-mates with bios.
8. Roster: grid + detail view with past-rounds-together count (derived).

## Phase 2 scope

1. Live leaderboard: hole-by-hole score entry (admin), team handicap via USGA scramble formula (25/20/15/10%) scaled to holes played, projected-net ranking while round is in progress, viewer-only for member/course.
2. Cart label PDF print route (one cart per landscape page; matches the prototype's `@media print` layout).
3. Pro-shop confirmation email: server-side render via Resend with the same body the prototype generates.
4. Course role dashboard at `/course` — operations summary card, hole/cart breakdown without bios, print + email actions.

## Out of scope for v1

- Push notifications (web push or native)
- Stripe / payments — green fee is paid in person at the pro shop
- Photo uploads — every avatar is the silhouette SVG from the prototype
- Native mobile apps — the web app is mobile-first PWA at most

## Working agreement

- **Show diffs before committing.** I review every change. No `git commit` without me asking.
- **Stop at milestones.** After each Phase-1 numbered item lands, pause and let me drive the next step.
- **Ask before guessing UX decisions.** The prototype is the source of truth for copy, layout, and microcopy. If something is ambiguous (e.g. a state the prototype doesn't show), ask — don't invent.
- **Prefer server actions over API routes.** Use route handlers only for webhooks and third-party callbacks.
- **Don't scaffold ahead.** I want to provision Neon, Clerk, and Resend first, then we initialize the Next.js project in one shot with all env vars in place.
