# Fairway Founders

## Building UI — read BRAND.md FIRST (required)

**Before writing or changing ANY member- or admin-facing UI, read
[`BRAND.md`](BRAND.md) and follow it exactly.** The brand is opinionated and easy
to violate — flat cards and flat buttons are the most common off-brand mistake.
Non-negotiables (full rules + copy-paste recipes + a pre-flight checklist in `BRAND.md`):

- **Tactile depth:** every card uses `ff-card`; every primary button uses `ff-btn`
  plus `ff-btn-pine` / `ff-btn-gold` / `ff-btn-secondary` (all defined in
  [`app/globals.css`](app/globals.css)). Inputs, pills, and segmented controls stay flat.
- **One brand green** `#1A3A2E` (the `--color-navy` token *is* green — never `#2E5D3A`).
  No bright colors; no gradients on content.
- **Type:** Fraunces (`--font-display`) for headlines/numerals; UPPERCASE wide-tracked
  taupe labels; the middot `·` separates metadata.
- **No emoji or decorative glyphs** — only `✓`, `←`, `→`. No photography in the app
  (silhouette avatars); golden-hour photo/video is allowed **only** on the public sign-in page.

## What we're building

Fairway Founders is a private, weekly networking app for ~16–30 founders and operators who play a 9-hole scramble together. Members RSVP through Tuesday evening; at cutoff the system auto-builds foursomes that minimize repeat pairings and spread professions, then assigns each group a cart pairing and a starting hole for a 2:30 PM Thursday shotgun. During the round an admin posts hole-by-hole scores to a live, handicap-net leaderboard. The course pro shop gets a printable cart-label PDF and a draft confirmation email so check-in is one tap. The product feel is a quiet, editorial members club — Fraunces serif headlines on navy/gold/cream — not a spreadsheet.

The app is multi-league: a **league** (regional chapter, e.g. Lakewood Ranch, Sarasota, Bradenton) contains **courses**, each course hosts **events/rounds**, each event has its own **RSVPs**, **foursomes**, and **scores**. Members belong to one or more leagues.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind v4 (with brand tokens for navy `#1A3A2E`, gold `#C9A961`, cream `#F5F1E8`, plus Fraunces + Inter via `next/font`)
- **DB:** Supabase Postgres
- **DB client:** `@supabase/supabase-js` (no Prisma — schema lives in Supabase migrations applied via MCP)
- **Auth:** Clerk
- **Email:** Resend (transactional + reminders + admin blasts). Send is gated on `RESEND_API_KEY`; without the key the worker queues into `email_log` and no-ops the send.
- **Storage:** Supabase Storage (member photos + business logos — added in the Members Redesign work). Writes go through a server-only service-role client (`lib/supabase-admin.ts`); reads use the publishable key.
- **Hosting:** Vercel
- **Server interactions:** prefer **server actions** over API routes; only fall back to route handlers when a third party requires a webhook URL or when you need to set arbitrary response headers (e.g. `Content-Disposition` for downloads).

## Permission model

Three layers, composed:

- **Global `users.app_role`** enum (`member | super_admin`). Super admin can do anything in any league; regular members start as `member`.
- **Per-league role** on `league_memberships.role` (`member | admin`). Lets non-super-admins manage a specific league's courses, events, and member roster.
- **Per-course staff** on `course_contacts.user_id` — when a contact row has a linked user, that user gets the read-only course-ops view (`/course`) for events at that course only.

The helpers in `lib/auth.ts` (`isSuperAdmin`, `isLeagueAdmin`, `isCourseStaff`, `canAccessAdmin`, `canAccessCourseOps`) are the canonical guards. Don't read `app_role` directly in route guards — go through the helpers so the per-league/per-course paths stay coherent.

Tyler (`tyler@eminence.business`) is the sole `super_admin`.

## Data model

Tables in the `public` schema, snake_case columns. **Pairing history is derived from past `foursome_members` rows — there is no separate history table.**

Structural:
- **leagues** — `id`, `name`, `slug` (unique), `short_name`, `description`, timestamps.
- **courses** — `id`, `league_id` fk, `name`, `short_name`, `address`, `city`, `state`, `website_url`, `default_pro_shop_email`, `notes`, `is_active`, timestamps.
- **course_contacts** — `id`, `course_id` fk, `user_id` fk (nullable; if set, this user is course staff), `name`, `role`, `email`, `phone`, `is_primary` (partial unique per course), `notes`, timestamps.
- **league_memberships** — `id`, `league_id` fk, `user_id` fk, `role` (`member | admin`), `joined_at`. Unique on (`league_id`, `user_id`).

Core:
- **users** — `id`, `clerk_id`, `email`, `name`, `company`, `professional_role`, `bio`, `handicap`, `helps` (text[]), `app_role` (`member | super_admin`), `access_status` (`pending | approved | denied`), `access_requested_at`, `access_decided_at`, `access_decided_by`, timestamps. The Members Redesign work adds: `photo_url`, `logo_url`, `tagline`, `phone`, `website_url`, `city`, `leaderboard_opt_out`.
- **events** — `id`, `course_id` fk (NOT NULL), `date`, `opens_at`, `closes_at`, `course_config` (`front | back | both`), `fee_cents`, `pro_shop_email` (per-event override of `course.default_pro_shop_email`), `status` (`locked | open | closed | past`), timestamps.
- **rsvps** — `id`, `event_id`, `user_id`, `created_at`. Unique on (`event_id`, `user_id`).
- **foursomes** — `id`, `event_id`, `hole`, `tier` (`A | B | C` for overflow), `group_index`, `score` (algorithm cost, for debugging).
- **foursome_members** — `id`, `foursome_id`, `user_id`, `cart_number`. Unique on (`foursome_id`, `user_id`). Source of truth for both group composition AND historical pairings.
- **hole_scores** — `id`, `foursome_id`, `hole`, `strokes`, timestamps. Unique on (`foursome_id`, `hole`).

Cross-cutting:
- **notifications** — `id`, `user_id`, `created_by`, `kind` (`broadcast | access_request | feedback | …Members-Redesign-adds-more`), `title`, `body`, `link`, `read_at`, timestamps. Backed by `NotificationBell` polling every 60s.
- **feedback** — `id`, `user_id`, `kind` (`feedback | issue`), `status` (`new | in_review | resolved | wontfix`), `subject`, `body`, `admin_notes`, timestamps.
- **email_log** — `id`, `kind`, `status` (`queued | sent | failed | cancelled`), `audience`, `to_email`, `to_user_id`, `subject`, `body`, `event_id`, `sent_by`, `blast_id`, `resend_id`, `error`, `sent_at`, timestamps. The queue is drained by `/api/cron/send-emails`.

Members Redesign adds: `member_links`, `interactions`, `profile_views`, `link_clicks`, `sponsorships`, and several new enums. See `.claude/plans/` for the source of truth on those when the work lands.

## URL surfaces

Public / marketing: `/` (signed-out landing), `/privacy`, `/terms`.

Member surfaces (after approval):
- `/dashboard` — Tee Time view for the currently-selected event
- `/leaderboard` — golf round leaderboard, live during play
- `/roster` (becoming `/members` post-Members-Redesign) — directory
- `/roster/[id]` — member profile / homepage
- `/me` (Members Redesign) — profile editor; `/profile/[[...rest]]` stays Clerk-owned
- `/network` (Members Redesign) — networking leaderboard
- `/course` — read-only ops view (super_admin / league admin / course staff only)

Admin (`canAccessAdmin()`):
- `/admin` — overview + event management for the current league's selected event
- `/admin/courses`, `/admin/courses/[id]` — manage courses + contacts
- `/admin/access`, `/admin/feedback` — inboxes
- `/admin/email` — pro-shop draft + admin blasts (queues into `email_log`)
- `/admin/sponsorships` (Members Redesign)

Super-admin-only:
- `/admin/leagues`, `/admin/leagues/[id]` — manage leagues + memberships
- League-scoped capability is in `league_memberships`, but creating/deleting leagues is super-admin only

API / route handlers:
- `/api/cron/keep-alive` — daily ping to prevent Supabase free-tier auto-pause
- `/api/cron/send-emails` — daily queue drain (no-ops without `RESEND_API_KEY`)
- `/api/cron/rsvp-reminders` — daily; route checks if today (in ET) is Monday or Tuesday and queues the appropriate reminder; otherwise no-op
- `/api/vcard/[id]` (Members Redesign) — vCard download

## Email infrastructure

- `lib/resend.ts` — Resend SDK wrapper; returns null if `RESEND_API_KEY` is unset.
- `lib/email-queue.ts` — `queueEmail()` inserts a row; `drainEmailQueue()` pulls up to 25 queued rows and delivers each.
- Transactional hooks live next to the action that triggers them: `app/actions/access.ts` queues approve/deny emails, `app/actions/groups.ts` queues a per-player foursome reveal after `runGroupGeneration`, `/admin/email` queues a `pro_shop_confirmation`.
- Vercel cron `vercel.json` is on daily schedules (hobby tier). `?mode=monday` / `?mode=tuesday` query params force-run RSVP reminders for testing.
- Env vars: `RESEND_API_KEY` (required), `RESEND_FROM` (optional, defaults `Fairway Founders <noreply@fairwayfounders.org>`), `NEXT_PUBLIC_SITE_URL` (optional).

## Out of scope for v1

- Push notifications (web push or native)
- Stripe / payments — green fee is paid in person at the pro shop
- Native mobile apps — the web app is mobile-first PWA at most
- RLS — currently disabled; trust boundary is the server-action guard layer. Hardening (RLS + Clerk → Supabase JWT) is a separate effort.
- Public league discovery / signup-to-league flows — super_admin assigns memberships today

**Note (reversal of an earlier decision):** The Members Redesign explicitly adds photo uploads (member photos + business logos via Supabase Storage). Earlier wording in this file ("no photo uploads in v1") is obsolete.

## Working agreement

- **Show diffs before committing.** I review every change. No `git commit` without me asking.
- **Stop at milestones.** After each numbered item lands, pause and let me drive the next step.
- **Ask before guessing UX decisions.** The prototype is the source of truth for copy, layout, and microcopy. If something is ambiguous (e.g. a state the prototype doesn't show), ask — don't invent.
- **Prefer server actions over API routes.** Use route handlers only for webhooks, third-party callbacks, or download responses that need `Content-Disposition`.
- **Capability helpers, not role strings.** Use `lib/auth.ts` (`canAccessAdmin`, `canAccessCourseOps`, `isLeagueAdmin`, `isSuperAdmin`) in guards. Don't read `users.app_role` directly.
- **Regenerate `lib/database.types.ts` via MCP after schema changes.** Don't hand-edit table types; the `Relationships: [...]` arrays are load-bearing for Supabase join inference and easy to break.

## Operational notes

- Supabase free tier auto-pauses after 7 days of inactivity. The keep-alive cron prevents this; if the project goes `INACTIVE`, restore via MCP `restore_project`.
- Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) bypasses every RLS rule. It's used by `lib/supabase-admin.ts` for Storage writes (member photo/logo uploads). **Never import this client into anything that runs client-side.**
- Windows PowerShell is the local shell, but Bash is available via the harness. CRLF warnings on git add are noise — `.gitattributes` would silence them.
