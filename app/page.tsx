import { Show } from '@clerk/nextjs';
import { getAppUser } from '@/lib/current-user';

export default async function Home() {
  const appUser = await getAppUser();
  const isAdmin = appUser?.app_role === 'admin';

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="max-w-xl text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--color-mute)]">
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
        <div className="mt-10 space-y-2">
          <Show when="signed-out">
            <p className="text-sm text-[color:var(--color-mute)]">
              Sign in above to RSVP for this week&rsquo;s round.
            </p>
          </Show>
          <Show when="signed-in">
            {appUser ? (
              <>
                <p
                  className="text-base"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Welcome back, {appUser.name.split(' ')[0]}.
                </p>
                <p className="text-sm text-[color:var(--color-mute)]">
                  Role: <strong className="text-[color:var(--color-ink)]">{appUser.app_role}</strong>
                  {isAdmin && ' — admin tabs unlocked above.'}
                </p>
              </>
            ) : (
              <p className="text-sm text-[color:var(--color-mute)]">
                Signed in — your profile is loading.
              </p>
            )}
          </Show>
        </div>
      </div>
    </main>
  );
}
