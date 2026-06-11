import Image from 'next/image';
import Link from 'next/link';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { getAppUser } from '@/lib/current-user';
import { supabase } from '@/lib/supabase';
import { COURSE_OPTIONS } from '@/lib/schedule';
import type { EventRow } from '@/lib/events';
import HowItWorksStep from '@/components/HowItWorksStep';

export const dynamic = 'force-dynamic';

const SPONSORS: { name: string; logo?: string; href?: string }[] = [
  { name: 'Sponsor One' },
  { name: 'Sponsor Two' },
  { name: 'Sponsor Three' },
  { name: 'Sponsor Four' },
  { name: 'Sponsor Five' },
  { name: 'Sponsor Six' },
];

const SOCIAL_LINKS: { label: string; href: string; icon: 'instagram' | 'x' | 'linkedin' }[] = [
  { label: 'Instagram', href: '#', icon: 'instagram' },
  { label: 'X', href: '#', icon: 'x' },
  { label: 'LinkedIn', href: '#', icon: 'linkedin' },
];

export default async function Home() {
  const me = await getAppUser();
  const isSignedInApproved = !!me && me.access_status === 'approved';

  const eventsRes = await supabase
    .from('events')
    .select('*, course:course_id(id, name, short_name, city, state)')
    .gte('date', new Date().toISOString().slice(0, 10))
    .order('date', { ascending: true })
    .limit(3);
  const upcoming = (eventsRes.data ?? []) as (EventRow & {
    course: { id: string; name: string; short_name: string | null; city: string | null; state: string | null } | null;
  })[];

  return (
    <main className="flex-1">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
        >
          <source src="/hero.mp4" type="video/mp4" />
          <source src="/hero.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-cream)]/60 via-[color:var(--color-cream)]/30 to-[color:var(--color-cream)]/85 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 lg:py-32 text-center lg:text-left">
          <div className="max-w-2xl mx-auto lg:mx-0">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-mute)] font-semibold">
              The weekly meetup
            </p>
            <h1
              className="mt-4 text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-[color:var(--color-ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Where business meets{' '}
              <span className="italic text-[color:var(--color-gold)]">the fairway.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-[color:#3a3a30] max-w-xl mx-auto lg:mx-0">
              A Thursday-afternoon meetup of founders and operators who&rsquo;d
              rather build relationships in nine holes than across a conference
              table.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              {isSignedInApproved ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-7 py-4 text-center text-sm font-semibold tracking-[0.1em] uppercase shadow-lg shadow-[color:var(--color-navy)]/25 hover:opacity-90"
                >
                  Back to the course →
                </Link>
              ) : (
                <>
                  <SignInButton>
                    <button className="rounded-lg bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-7 py-4 text-sm font-semibold tracking-[0.1em] uppercase shadow-lg shadow-[color:var(--color-navy)]/25 hover:opacity-90">
                      Book a tee time
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="rounded-lg border border-[color:var(--color-gold)] bg-white/80 text-[color:var(--color-ink)] px-7 py-4 text-sm font-semibold tracking-[0.1em] uppercase shadow-md hover:bg-white">
                      Join the network
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>

            {isSignedInApproved ? (
              <p className="mt-4 text-[11px] text-[color:var(--color-ink)]/70 italic text-center lg:text-left">
                Welcome back, {me!.name.split(' ')[0]}.
              </p>
            ) : (
              <p className="mt-4 text-[10px] text-[color:var(--color-ink)]/60 text-center lg:text-left">
                By joining, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-[color:var(--color-gold)]">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-[color:var(--color-gold)]">
                  Privacy Policy
                </Link>
                . An admin reviews every new member.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-16 md:py-20 max-w-3xl mx-auto text-center scroll-mt-20">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-mute)]">
          The weekly meetup
        </p>
        <h2
          className="mt-3 text-3xl md:text-4xl leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          A round of golf,{' '}
          <span className="italic text-[color:var(--color-gold)]">a room full of founders.</span>
        </h2>
        <p className="mt-5 text-[15px] leading-relaxed text-[color:#5a5a4a]">
          Fairway Founders is a recurring Thursday-afternoon meetup of founders
          and operators who'd rather build relationships in nine holes than
          across a conference table. Every week, the algorithm pairs you with
          three people you haven't played with — spread across professions, so
          every cart is a new conversation.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-4 md:gap-8">
          <Stat label="Weekly" value="Thursdays" sub="2:30 PM shotgun" />
          <Stat label="Format" value="Scramble" sub="9-hole, handicapped" />
          <Stat label="Group" value="16–30" sub="Founders & operators" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[color:#f5f1e8]/60 px-6 py-16 md:py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-mute)] text-center font-semibold">
            How it works
          </p>
          <h2
            className="mt-3 text-2xl md:text-3xl text-center"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Four steps. No spreadsheet required.
          </h2>

          {/* Mobile + tablet: stacked grid, no chevrons */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:hidden gap-5">
            <HowItWorksStep
              n="1"
              title="Join"
              body="Apply to the network; an admin reviews every request."
              icon={<JoinIcon />}
            />
            <HowItWorksStep
              n="2"
              title="Book"
              body="RSVP by Tuesday for the next Thursday round."
              icon={<BookIcon />}
            />
            <HowItWorksStep
              n="3"
              title="Connect"
              body="The algorithm pairs you with three new people, spread across professions."
              icon={<ConnectIcon />}
            />
            <HowItWorksStep
              n="4"
              title="Grow"
              body="Build relationships in nine holes that pay off off the course."
              icon={<GrowIcon />}
            />
          </div>

          {/* Desktop: 4-up row with chevrons between cards */}
          <div className="hidden lg:flex items-stretch gap-3 mt-10">
            <HowItWorksStep
              n="1"
              title="Join"
              body="Apply to the network; an admin reviews every request."
              icon={<JoinIcon />}
            />
            <ChevronGap />
            <HowItWorksStep
              n="2"
              title="Book"
              body="RSVP by Tuesday for the next Thursday round."
              icon={<BookIcon />}
            />
            <ChevronGap />
            <HowItWorksStep
              n="3"
              title="Connect"
              body="The algorithm pairs you with three new people, spread across professions."
              icon={<ConnectIcon />}
            />
            <ChevronGap />
            <HowItWorksStep
              n="4"
              title="Grow"
              body="Build relationships in nine holes that pay off off the course."
              icon={<GrowIcon />}
            />
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS + SIDE CTA */}
      <section id="events" className="px-6 py-16 md:py-20 max-w-6xl mx-auto scroll-mt-20">
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-10">
          {/* LEFT: events */}
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-mute)] font-semibold">
              Upcoming events
            </p>
            <h2
              className="mt-2 text-2xl md:text-3xl leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The next few Thursdays
            </h2>

            {upcoming.length === 0 ? (
              <p className="mt-8 text-sm text-[color:var(--color-mute)] italic">
                New schedule drops soon. Sign up to be the first to RSVP.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {upcoming.map((e) => {
                  const d = new Date(e.date);
                  const monthShort = d
                    .toLocaleDateString('en-US', { month: 'short' })
                    .toUpperCase();
                  const day = d.toLocaleDateString('en-US', { day: 'numeric' });
                  const weekday = d.toLocaleDateString('en-US', {
                    weekday: 'long',
                  });
                  const courseName = e.course?.name ?? 'Legacy Golf Club';
                  return (
                    <article
                      key={e.id}
                      className="rounded-xl border border-[color:#e8e2d2] bg-white overflow-hidden flex flex-col sm:flex-row hover:border-[color:var(--color-gold)] transition-colors"
                    >
                      <div className="sm:w-40 shrink-0 bg-[color:#e8e9d8] aspect-[5/3] sm:aspect-auto flex items-center justify-center">
                        <CourseIllustration />
                      </div>
                      <div className="flex-1 flex items-stretch">
                        <div className="px-4 py-4 text-center border-r border-[color:#f0ebd8] flex flex-col justify-center min-w-[64px]">
                          <p className="text-[10px] tracking-[0.15em] uppercase font-bold text-[color:var(--color-gold)]">
                            {monthShort}
                          </p>
                          <p
                            className="text-2xl leading-none text-[color:var(--color-ink)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {day}
                          </p>
                        </div>
                        <div className="px-5 py-4 flex-1 min-w-0 flex flex-col justify-center">
                          <p
                            className="text-base leading-tight text-[color:var(--color-ink)] truncate"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {courseName}
                          </p>
                          <p className="mt-1 text-xs text-[color:#5a5a4a]">
                            {weekday} · 2:30 PM shotgun ·{' '}
                            {COURSE_OPTIONS[e.course_config].label}
                          </p>
                          <p className="mt-2 text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-gold)]">
                            View event →
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <SignInButton>
                <button className="rounded-md border border-[color:var(--color-gold)] bg-white text-[color:var(--color-ink)] px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase hover:bg-[color:#f5f1e8]/40">
                  Sign in to RSVP
                </button>
              </SignInButton>
              <p className="mt-3 text-[11px] text-[color:var(--color-mute)]">
                RSVPs open Sunday · close Tuesday at 8 PM.
              </p>
            </div>
          </div>

          {/* RIGHT: elevate-your-network CTA */}
          <aside className="rounded-xl bg-[color:var(--color-navy)] text-[color:var(--color-cream)] p-7 lg:p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[color:var(--color-gold)]/10 pointer-events-none"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col items-center w-full">
              <CrownIcon />
              <h3
                className="mt-4 text-2xl md:text-3xl leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Ready to elevate your network?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[color:#d8d3bf] max-w-xs">
                Join Fairway Founders and start building connections that
                actually move the ball.
              </p>
              {isSignedInApproved ? (
                <Link
                  href="/dashboard"
                  className="mt-6 w-full max-w-[220px] rounded-lg bg-[color:var(--color-gold)] text-[color:var(--color-navy)] px-6 py-3 text-center text-[11px] font-bold tracking-[0.12em] uppercase hover:opacity-90"
                >
                  Back to the course →
                </Link>
              ) : (
                <SignUpButton>
                  <button className="mt-6 w-full max-w-[220px] rounded-lg bg-[color:var(--color-gold)] text-[color:var(--color-navy)] px-6 py-3 text-[11px] font-bold tracking-[0.12em] uppercase hover:opacity-90">
                    Join now
                  </button>
                </SignUpButton>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* VIDEO PLACEHOLDER */}
      <section className="bg-[color:var(--color-navy)] px-6 py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-gold)]">
            See it in action
          </p>
          <h2
            className="mt-3 text-2xl md:text-3xl text-[color:var(--color-cream)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            What a Thursday looks like
          </h2>
          <p className="mt-3 text-sm text-[color:#a8a596]">
            A short reel of what the round, the carts, and the after-round
            conversation actually look like.
          </p>
          <div className="mt-8 aspect-video w-full rounded-xl border border-[color:var(--color-gold)]/30 bg-black/40 flex items-center justify-center overflow-hidden">
            <div className="text-center px-6">
              <PlayIcon />
              <p className="mt-3 text-[10px] tracking-[0.2em] uppercase text-[color:var(--color-gold)] font-semibold">
                Video coming soon
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SPONSORS */}
      <section id="sponsors" className="px-6 py-16 md:py-20 max-w-5xl mx-auto scroll-mt-20">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-mute)] text-center">
          In partnership with
        </p>
        <h2
          className="mt-3 text-2xl md:text-3xl text-center"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Our sponsors
        </h2>
        <p className="mt-3 text-center text-sm text-[color:#5a5a4a]">
          The companies who help keep the green fee low and the cart drinks cold.
        </p>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {SPONSORS.map((s) => {
            const Card = (
              <div className="aspect-square rounded-xl border border-[color:#e8e2d2] bg-white flex items-center justify-center p-4 hover:border-[color:var(--color-gold)] transition-colors">
                {s.logo ? (
                  <Image
                    src={s.logo}
                    alt={s.name}
                    width={120}
                    height={120}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-[10px] tracking-[0.12em] uppercase text-[color:var(--color-mute)] font-semibold">
                      Your logo
                    </p>
                    <p className="mt-1 text-xs text-[color:#5a5a4a]">{s.name}</p>
                  </div>
                )}
              </div>
            );
            return s.href ? (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {Card}
              </a>
            ) : (
              <div key={s.name}>{Card}</div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-[color:var(--color-mute)] italic">
          Want to sponsor a Thursday? Reach out at hello@fairwayfounders.org.
        </p>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="border-t border-[color:#e8e2d2] bg-[color:var(--color-cream)] px-6 py-10 scroll-mt-20">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[color:#e8e2d2] bg-white text-[color:var(--color-ink)] hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)]"
              >
                <SocialIcon kind={s.icon} />
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[color:var(--color-mute)]">
            <Link href="/" className="hover:text-[color:var(--color-gold)]">
              Home
            </Link>
            <span>·</span>
            <SignInButton>
              <button className="hover:text-[color:var(--color-gold)]">Sign in</button>
            </SignInButton>
            <span>·</span>
            <SignUpButton>
              <button className="hover:text-[color:var(--color-gold)]">Request access</button>
            </SignUpButton>
            <span>·</span>
            <Link href="/terms" className="hover:text-[color:var(--color-gold)]">
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[color:var(--color-gold)]">
              Privacy
            </Link>
            <span>·</span>
            <a
              href="mailto:hello@fairwayfounders.org"
              className="hover:text-[color:var(--color-gold)]"
            >
              hello@fairwayfounders.org
            </a>
          </div>

          <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
            © {new Date().getFullYear()} Fairway Founders Network · Operated by Golf Links Network LLC
          </p>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
        {label}
      </p>
      <p
        className="mt-1 text-xl md:text-2xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p className="text-[11px] text-[color:#5a5a4a] mt-0.5">{sub}</p>
    </div>
  );
}

function CourseIllustration() {
  return (
    <svg
      viewBox="0 0 160 96"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className="block"
    >
      <rect width="160" height="96" fill="#dbe3c8" />
      {/* horizon trees */}
      <ellipse cx="20" cy="44" rx="14" ry="10" fill="#7c9885" />
      <ellipse cx="36" cy="42" rx="12" ry="8" fill="#5e8169" />
      <ellipse cx="124" cy="44" rx="16" ry="11" fill="#7c9885" />
      <ellipse cx="146" cy="42" rx="10" ry="8" fill="#5e8169" />
      {/* fairway */}
      <path d="M 0 96 L 0 70 Q 80 50 160 70 L 160 96 Z" fill="#a8c08a" />
      <path d="M 0 96 L 0 80 Q 80 64 160 80 L 160 96 Z" fill="#8fae72" />
      {/* green */}
      <ellipse cx="100" cy="72" rx="34" ry="6" fill="#5e8169" />
      <ellipse cx="100" cy="70" rx="34" ry="6" fill="#7c9885" />
      {/* hole */}
      <ellipse cx="108" cy="68" rx="2.5" ry="1" fill="#1a3a2e" />
      {/* flagstick */}
      <line
        x1="108"
        y1="68"
        x2="108"
        y2="34"
        stroke="#1a3a2e"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* flag */}
      <path d="M 108 34 L 120 38 L 108 42 Z" fill="#c9a961" />
      {/* sky tint */}
      <rect width="160" height="42" fill="#f5f1e8" fillOpacity="0.55" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#c9a961"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 18 L4 8 L8 12 L12 6 L16 12 L20 8 L22 18 Z" fill="#c9a961" fillOpacity="0.18" />
      <line x1="2" y1="21" x2="22" y2="21" />
      <circle cx="4" cy="7" r="1" fill="#c9a961" />
      <circle cx="20" cy="7" r="1" fill="#c9a961" />
      <circle cx="12" cy="5" r="1" fill="#c9a961" />
    </svg>
  );
}

function ChevronGap() {
  return (
    <div className="flex items-center justify-center shrink-0 w-6 text-[color:var(--color-gold)]">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

function JoinIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function GrowIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#c9a961"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mx-auto"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="#c9a961" />
    </svg>
  );
}

function SocialIcon({ kind }: { kind: 'instagram' | 'x' | 'linkedin' }) {
  if (kind === 'instagram') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (kind === 'x') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2H21l-6.523 7.453L22 22h-6.79l-4.79-6.27L4.8 22H2.04l6.98-7.97L2 2h6.91l4.32 5.74L18.244 2zm-1.19 18h1.83L7.07 4H5.18l11.874 16z" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
