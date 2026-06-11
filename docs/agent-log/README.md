# Agent log archive

Older entries from the AGENTS.md Recent log, rotated here by month (2026-05.md,
…) once they pass the ~2-week window. Nothing reads these by default — they
exist for on-demand digging only, keeping AGENTS.md (loaded every session) at a
fixed small size. Rotation isn't a script: an agent reads AGENTS.md at session
start and moves stale entries here on the way through. The ISO date prefix makes
that a mechanical sort.
