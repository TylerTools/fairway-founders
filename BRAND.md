# BRAND.md — build everything on-brand

**READ THIS BEFORE YOU WRITE OR CHANGE ANY UI.** Fairway Founders has a
specific, opinionated design language. New screens and components are expected
to match it exactly — not approximately. If you are building, restyling, or
reviewing anything a member or admin sees, this file is the contract.

> **Tone test for every surface:** *would this read well letterpressed on a
> printed pairings card at a boutique country club?* Quiet, editorial, a little
> old-money — **never** a SaaS dashboard or a spreadsheet. If it feels hypey,
> bright, or busy, it's wrong.

All tokens and the reusable utility classes below live in
[`app/globals.css`](app/globals.css). **Reference the CSS variables and the
`ff-*` classes — never hard-code hexes or invent new shadows.**

---

## 1. The single most-violated rule: TACTILE DEPTH

Cards lift off the cream; buttons look raised and physically **press down** on
tap. This is not optional polish — it's the brand. Flat cards and flat buttons
are the #1 way new work reads as off-brand.

**Every card** gets `ff-card`:
```jsx
<div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">…</div>
```

**Every primary button** gets `ff-btn` + a variant (the variant carries the
shadow; `ff-btn` carries the press-down):
```jsx
{/* Pine action — gold on pine */}
<button className="rounded-lg px-4 py-3 text-sm font-semibold tracking-[0.08em] uppercase
  ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] disabled:opacity-60">…</button>

{/* Gold CTA — the brass-plaque lead action (use on the web/sign-in surface) */}
<button className="… ff-btn ff-btn-gold bg-[color:var(--color-gold)] text-[color:var(--color-navy)]">…</button>

{/* Secondary — white field, gold hairline */}
<button className="… ff-btn ff-btn-secondary bg-white text-[color:var(--color-navy)] border border-[color:var(--color-gold)]">…</button>
```

**Stays FLAT (never add `ff-card`/`ff-btn` depth):**
- **Inputs / textareas / selects** — a warm hairline border that turns **gold on
  focus**, no shadow: `rounded-md border border-[color:#e8e2d2] bg-white focus:border-[color:var(--color-gold)] focus:outline-none`
- **Pills / small inline labels / chips** (HCP, role, league tags) — flat.
- **Segmented controls / filter pills** — the active state **inverts** to a pine
  fill with gold text; no shadow.
- **Floating popovers / dropdowns / menus** — these use a bigger ambient
  `shadow-lg`/`shadow-xl` on purpose; leave them.

Available depth classes (defined in `globals.css`): `ff-card`, `ff-btn`,
`ff-btn-pine`, `ff-btn-gold`, `ff-btn-secondary`.

---

## 2. Color — one pine, one gold, warm cream

| Role | Value | Token(s) |
|---|---|---|
| **Primary — deep pine/forest green** | `#1A3A2E` | `--ff-pine`, Tailwind alias `--color-navy` *(the name "navy" is a misnomer — the value is green)*, also `--color-ink` |
| Darkest pine (hero/vignette) | `#0D1F17` | `--ff-pine-deep` |
| **Accent — antique gold** | `#C9A961` | `--ff-gold`, `--color-gold` |
| **Ground — warm cream** | `#F5F1E8` | `--ff-cream`, `--color-cream` |
| Secondary text / labels — taupe | `#8A8576` | `--ff-taupe`, `--color-mute` |
| Card surface | `#FFFFFF` | `--ff-white` |
| Sand inset / chip field | `#F0EBD8` | `--ff-sand` |
| Hairline card border | `#E8E2D2` | `--ff-border` (used as `border-[color:#e8e2d2]`) |
| Secondary ink | `#5A5A4A` | `--ff-ink-soft` |
| Gold hairline divider (30%) | `rgba(201,169,97,.30)` | `--ff-hairline` |

Support colors, used **sparingly** (never bright): sage `#7C9885` (positive /
under-par / open), clay `#A87C4F` (caution / bronze), brick `#A13C3C` (error /
over-paired).

**Hard rules:**
- There is **one** brand green: `#1A3A2E`. **Never use `#2E5D3A`** (retired
  legacy value — it only survives in some favicon artwork).
- **No bright colors. No gradients on content.** The only sanctioned gradient is
  the pine scrim over the hero video on the public sign-in page.

---

## 3. Type

- **Fraunces** (high-contrast serif) for **headlines, numerals, and stat
  figures** — `style={{ fontFamily: 'var(--font-display)' }}`. Sentence case,
  often with a soft *italic-gold* turn of phrase.
- **Inter** for body, controls, fine print — `var(--font-sans)` (the default).
- **UI labels / eyebrows are the signature:** Inter, **UPPERCASE**, wide tracking
  `0.1–0.15em`, 9–11px, taupe:
  ```jsx
  <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">Your group</p>
  ```
- Buttons are uppercase too (`tracking-[0.08em] uppercase`).

**Radii:** `4px` score cells · `rounded-md` (6px) inputs/small chips ·
`rounded-lg` (10px) buttons/calendar chips · `rounded-xl`/`rounded-2xl` (12/16px)
cards · `rounded-full` pills/avatars/dots.

---

## 4. Copy & voice — a gracious club host

Warm, literate, understated, never hypey. Speaks **to** the member ("**You're
in**", "**Your group**") and **as** the club in outbound copy ("our Fairway
Founders group").

- **Numerals & money** plain and confident: `$40 per player`, `Round 23 · 12 in`,
  `thru 9 · net 33`, `HCP 14`.
- **The middot `·` is the house separator** in almost every metadata line.
- **Microcopy is dry and specific**, never cute: *"Groups drop at cutoff."*
- **Golf vocabulary is load-bearing:** scramble, shotgun, foursome, trio, cart,
  starting hole, handicap, net, gross, to-par.
- **No emoji. No exclamation-point energy. No growth-hacking verbs.**

---

## 5. Iconography & imagery — deliberately minimal

- **Icon-light by design.** No icon font, no Lucide/Heroicons dependency. Type
  and small-caps labels do the work. The bottom nav is text-only.
- **The only glyphs allowed as "icons":** the check `✓` (confirmation copy only)
  and arrows `←` `→` (back/forward). **No other emoji or decorative glyphs**
  (no `★ ⚡ ●` etc.).
- **No photography in the app.** Members are **silhouette avatars**
  (`components/Avatar.tsx`). The single permitted illustration is the pin-and-flag
  glyph (`components/GolfFlagIcon.tsx`), used as a brand/empty-state mark.
- **Exception — the public web surface only** (`/` sign-in): warm, golden-hour
  course photography/video is permitted, behind a pine scrim.

---

## 6. Pre-flight checklist (tick before you finish any UI)

- [ ] Every card has `ff-card`. Every primary button has `ff-btn` + a variant.
- [ ] Inputs, pills, and segmented controls are **flat** (no depth added).
- [ ] Colors come from tokens. No `#2E5D3A`. No bright colors, no content gradients.
- [ ] Headlines/numerals use `var(--font-display)`; labels are UPPERCASE + wide-tracked taupe.
- [ ] Separators use the middot `·`. Money/scores read plainly.
- [ ] No emoji or decorative glyphs (only `✓`, `←`, `→`). No photos in app surfaces.
- [ ] It passes the tone test in the header.

---

## Going deeper

The full design system (specimen cards, component prompts, UI kits, the GLN
relationship, the web-surface register) was exported from Claude Design. Ask the
owner for the `fairway-founders-design-system` bundle, or install its `SKILL.md`
as a Claude Code skill, if you need more than this file. For live examples, read
`app/page.tsx` (web hero), `app/dashboard/page.tsx`, and `components/RsvpToggle.tsx`.
