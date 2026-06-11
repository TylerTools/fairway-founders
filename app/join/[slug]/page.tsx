import { notFound, redirect } from 'next/navigation';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getMyLeagueMemberships } from '@/lib/auth';
import SetIntendedLeague from './SetIntendedLeague';
import JoinExistingLeague from './JoinExistingLeague';

export const dynamic = 'force-dynamic';

/**
 * Per-league sign-in / join page at /join/[slug].
 *
 * Renders the same pine-hero + cream-signin layout as the public /
 * landing, but the headline + welcome copy carry the league's name.
 * When the visitor signs up via Clerk here, a client-mounted helper
 * stamps `ff-intended-league=slug` as a cookie so getAppUser() can
 * pick it up on the first authenticated request and create a pending
 * league_memberships row for the matching league.
 *
 * Signed-in users:
 *  - already an active member of this league → bounce to /dashboard
 *  - have a pending or declined membership for this league → show that status
 *  - signed in but no membership for this league → 'Request to join' CTA
 */
export default async function JoinLeague({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const leagueRes = await supabase
    .from('leagues')
    .select('id, name, short_name, slug, description')
    .eq('slug', slug)
    .maybeSingle();
  if (!leagueRes.data) notFound();
  const league = leagueRes.data;

  const me = await getAppUser();
  let existingStatus: 'active' | 'pending' | 'declined' | null = null;
  if (me) {
    const memberships = await getMyLeagueMemberships();
    const m = memberships.find((row) => row.league_id === league.id);
    if (m) existingStatus = m.status;
    if (existingStatus === 'active') redirect('/dashboard');
  }

  return (
    <>
      <SetIntendedLeague slug={slug} />
      <div
        className="grid lg:grid-cols-[1.15fr_1fr] min-h-screen w-full"
        style={{ background: 'var(--ff-cream)' }}
      >
        {/* LEFT — pine hero with league name */}
        <section
          className="relative overflow-hidden flex flex-col justify-between gap-7 px-6 sm:px-10 lg:px-14 py-9 sm:py-10 lg:py-11 min-h-[360px] lg:min-h-screen"
          style={{ color: 'var(--ff-cream)', isolation: 'isolate' }}
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-30"
            style={{ background: 'var(--ff-pine-deep)' }}
          />
          <video
            aria-hidden
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background: `
                linear-gradient(180deg, rgba(13,31,23,0.55) 0%, rgba(13,31,23,0.30) 38%, rgba(13,31,23,0.78) 100%),
                radial-gradient(120% 80% at 70% 20%, rgba(42,79,60,0.65), rgba(13,31,23,0) 60%)
              `,
            }}
          />

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col leading-[0.9]">
              <span
                className="font-extrabold"
                style={{
                  fontFamily: 'var(--font-sans), system-ui, sans-serif',
                  fontSize: 40,
                  letterSpacing: '0.08em',
                  color: 'var(--ff-cream)',
                }}
              >
                FAIRWAY
              </span>
              <span
                className="my-2 rounded-sm"
                style={{ width: 42, height: 3, background: 'var(--ff-gold)' }}
              />
              <span
                className="font-bold"
                style={{
                  fontFamily: 'var(--font-sans), system-ui, sans-serif',
                  fontSize: 13,
                  letterSpacing: '0.28em',
                  color: 'var(--ff-gold)',
                }}
              >
                FOUNDERS&nbsp;NETWORK
              </span>
            </div>
          </div>

          <div className="max-w-[520px]">
            <p
              className="font-bold uppercase mb-5"
              style={{
                fontSize: 11,
                letterSpacing: '0.28em',
                color: 'var(--ff-gold)',
                fontFamily: 'var(--font-sans), system-ui, sans-serif',
              }}
            >
              {league.short_name ?? league.name} · Invitation only
            </p>
            <h1
              className="m-0"
              style={{
                fontFamily: 'var(--font-display)',
                fontOpticalSizing: 'auto',
                fontSize: 'clamp(36px, 4.2vw, 54px)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                textWrap: 'balance' as React.CSSProperties['textWrap'],
              }}
            >
              Welcome to{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--ff-gold)' }}>
                {league.name}
              </em>
            </h1>
            {league.description && (
              <p
                className="mt-5 max-w-[460px]"
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'rgba(245,241,232,0.80)',
                }}
              >
                {league.description}
              </p>
            )}
          </div>

          <div />
        </section>

        {/* RIGHT — sign-in / sign-up column */}
        <section
          className="flex items-center justify-center px-6 sm:px-10 lg:px-12 py-14"
          style={{ background: 'var(--ff-cream)' }}
        >
          <div className="w-full max-w-[380px]">
            {!me ? (
              <>
                <p
                  className="font-bold uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    color: 'var(--ff-taupe)',
                  }}
                >
                  Join {league.short_name ?? league.name}
                </p>
                <h2
                  className="mt-2.5 mb-1.5 leading-none"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 34,
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    color: 'var(--ff-pine)',
                  }}
                >
                  Request access
                </h2>
                <p
                  className="mb-7"
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: 'var(--ff-ink-soft)',
                  }}
                >
                  Sign up to request a spot in {league.name}. A league admin
                  will review and approve your membership.
                </p>
                <div className="space-y-2">
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="w-full rounded-lg ff-btn ff-btn-gold bg-[color:var(--color-gold)] text-[color:var(--color-navy)] px-5 py-3 text-[12px] font-semibold tracking-[0.1em] uppercase"
                    >
                      Sign up
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="w-full rounded-lg ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] px-5 py-3 text-[12px] font-semibold tracking-[0.1em] uppercase"
                    >
                      I already have an account
                    </button>
                  </SignInButton>
                </div>
                <p
                  className="mt-7 text-[11px]"
                  style={{
                    color: 'var(--ff-taupe)',
                    fontFamily: 'var(--font-sans), system-ui, sans-serif',
                  }}
                >
                  By signing up you agree to our{' '}
                  <a
                    href="/terms"
                    className="underline hover:no-underline"
                    style={{ color: 'var(--ff-gold)' }}
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    className="underline hover:no-underline"
                    style={{ color: 'var(--ff-gold)' }}
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </>
            ) : (
              <JoinExistingLeague
                leagueId={league.id}
                leagueName={league.name}
                existingStatus={existingStatus}
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
