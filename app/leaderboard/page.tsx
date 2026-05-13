export default function LeaderboardPage() {
  return (
    <main className="px-6 py-12 max-w-md mx-auto w-full text-center">
      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        Leaderboard
      </p>
      <h1
        className="mt-2 text-3xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Lands in Phase 2
      </h1>
      <p className="mt-3 text-sm text-[color:#5a5a4a]">
        Hole-by-hole net scoring with USGA scramble handicap. Coming up after
        the RSVP / group flow is solid.
      </p>
    </main>
  );
}
