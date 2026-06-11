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
