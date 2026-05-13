# Fairway Founders

## What we're building

Fairway Founders is a networking app for a small (16–30 founder) golf group that plays a weekly Thursday 2:30 PM 9-hole scramble at Legacy Golf Club. Members RSVP during a weekly window (opens Thursday 7 days prior, closes Tuesday 6 PM); at the cutoff an algorithm partitions the confirmed players into foursomes (with trios/pairs only when the count forces it), picks cart pairings, assigns starting holes for the shotgun, and reveals each member's group. During the round the leaderboard tracks live net scores using a USGA-weighted scramble team handicap. The admin can manually swap players post-generation, print cart labels, and draft a tee-time confirmation email to the pro shop.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS (with the prototype's design tokens — Fraunces serif + Inter sans, navy / gold / cream)
- **DB:** Neon Postgres (serverless)
- **ORM:** Prisma
- **Auth:** Clerk (members sign in; role stored as Clerk public metadata `role: 'member' | 'admin' | 'course'`)
- **Email:** Resend (pro shop confirmation; future transactional)
- **Hosting:** Vercel

## Roles

| Role | Tabs visible | What they can do |
|---|---|---|
| `member` | Tee Time, Leaderboard, Profile, Roster | RSVP for the open event, view their assigned group + cart + hole once groups drop, edit their own bio / helps[] / handicap, browse the roster |
| `admin` | + Admin, Course Ops | All member abilities, plus: set course layout / fee / pro-shop email, check anyone in/out, generate groups, swap players (tap A then tap B), enter scores, draft pro-shop email, print cart labels, view pairing-history table |
| `course` | Tee Time (read), Leaderboard (read), Roster, Course Ops | Operational view only: event summary, hole/cart breakdown without bios, print cart labels, view pro-shop email draft. No profile, no admin. |

Role is read from Clerk on every request; routes/server actions enforce.

## Data model

Pairing history is **derived** from past `FoursomeMember` rows, never persisted as its own table.

```
User
  id            (Clerk userId)
  name
  company
  profession    (was "role" in prototype; renamed to avoid collision with auth role)
  handicap      Float?  // 0–54, nullable
  bio           String?
  helps         String[]
  role          enum('member','admin','course')  // mirror of Clerk metadata, cached for queries
  createdAt

Event
  id
  date          // Thursday 2:30 PM local
  opensAt       // 7 days prior, 8 AM
  closesAt      // 2 days prior, 6 PM
  courseConfig  enum('front','back','both')  default 'front'
  fee           Int  default 4000  // cents
  proShopEmail  String
  roundNumber   Int

Rsvp
  eventId
  userId
  createdAt
  @@unique([eventId, userId])

Foursome
  id
  eventId
  startingHole  Int
  tier          enum('A','B','C')?     // null when no tier overflow
  index         Int                    // 0-based order within event
  score         Int                    // total penalty from grouping algorithm
  grossByHole   Int[]                  // length 9 or 18, nullable holes use 0

FoursomeMember
  foursomeId
  userId
  cartNumber    Int
  @@unique([foursomeId, userId])
```

Derived pairing-history query: count co-occurrences in `FoursomeMember` joined to itself across all past events. Surfaced as `getPairingHistory(userId?)` server util.

## Phase 1 — get to a working weekly loop

1. Clerk auth wired in; `(authed)` route group; middleware redirects unauth → sign-in
2. Prisma schema + initial migration on Neon
3. Seed script loads the 16 MOCK_MEMBERS as test users + creates the next 4 events
4. Member RSVP flow on Home tab (with countdown, status transitions locked → open → closed → past)
5. Member Profile tab with handicap, bio, helps[]
6. Admin **Groups** section: generate (port `generateGroups`/`assignCartPairs`/`assignHoles` to a server action), partition summary, manual swap, history sub-tab
7. Member group reveal on Home (Your Group card with cart pairings + bios) after `closesAt`
8. Roster grid + member detail page with past-rounds-together counts (uses derived pairing history)
9. Role switching honored — tabs filtered by Clerk role

Milestone 1 ships when an admin can RSVP a real set of users, click Generate, and members can log in and see their assigned hole + cart + groupmates.

## Phase 2 — round day + operations

1. Live leaderboard with hole-by-hole entry (admin-only edit); projected-net ranking
2. Cart label PDF print route (server-rendered HTML → print stylesheet, matches the prototype's landscape-letter page)
3. Pro-shop email draft modal → Resend send (admin clicks Send instead of mailto)
4. Course-role dashboard (operational hole/cart breakdown, no bios, print + email)

## Out of scope for v1

- Push notifications (use email for RSVP-opens / groups-dropped reminders)
- Stripe / online payment (members pay at the pro shop)
- Photo uploads (keep the silhouette `Avatar` from the prototype)
- Native mobile app (PWA-quality responsive web is enough; the prototype is mobile-first at 480px max width)

## Working agreement

- **Show diffs before committing.** I propose changes; you approve before I run `git commit`.
- **Stop at milestones.** End-of-phase, end-of-feature — confirm direction before starting the next chunk.
- **Ask before guessing UX.** The prototype at `reference/fairway-founders.jsx` is the source of truth for copy, layout, color, and the algorithm. If the spec is silent, ask — don't invent.
- **Server actions over API routes.** Prefer `'use server'` functions for mutations; route handlers only when needed (webhooks, PDFs, downloads).
- **Port don't paraphrase.** When implementing the grouping/scoring/email/print logic, translate the prototype's functions to TypeScript line-for-line first; refactor only after tests pass against the prototype's example partitions and team-handicap values.
- **Tokens, not magic values.** Lift the prototype's colors and font families into Tailwind config; reference them by name throughout.
