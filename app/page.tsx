import { Show } from '@clerk/nextjs';

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="max-w-xl text-center">
        <p
          className="text-xs tracking-[0.2em] uppercase text-[color:var(--color-mute)]"
        >
          A private members round
        </p>
        <h1
          className="mt-4 text-5xl leading-tight tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Tee off{' '}
          <span
            className="italic text-[color:var(--color-gold)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            at half-past two
          </span>
        </h1>
        <p className="mt-6 text-base text-[color:var(--color-ink)]/80 leading-relaxed">
          Sixteen to thirty founders. One nine-hole scramble. Every Thursday.
          RSVP through Tuesday — the system builds the foursomes, picks the
          carts, and assigns the holes for a 2:30 shotgun.
        </p>
        <div className="mt-10">
          <Show when="signed-out">
            <p className="text-sm text-[color:var(--color-mute)]">
              Sign in above to RSVP for this week&rsquo;s round.
            </p>
          </Show>
          <Show when="signed-in">
            <p className="text-sm text-[color:var(--color-mute)]">
              You&rsquo;re in. RSVP flow lands in the next milestone.
            </p>
          </Show>
        </div>
      </div>
    </main>
  );
}
