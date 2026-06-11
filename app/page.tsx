import Image from 'next/image';
import { redirect } from 'next/navigation';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { getAppUser } from '@/lib/current-user';
import SponsorsSection from '@/components/SponsorsSection';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const me = await getAppUser();
  if (me && me.access_status === 'approved') redirect('/dashboard');

  return (
    <>
    <div
      className="grid lg:grid-cols-[1.15fr_1fr] min-h-screen w-full"
      style={{ background: 'var(--ff-cream)' }}
    >
      {/* LEFT — Pine photographic hero */}
      <section
        className="relative overflow-hidden flex flex-col justify-between gap-7 px-6 sm:px-10 lg:px-14 py-9 sm:py-10 lg:py-11 min-h-[360px] lg:min-h-screen"
        style={{
          color: 'var(--ff-cream)',
          isolation: 'isolate',
        }}
      >
        {/* Solid pine fallback — shows while the video loads or if it fails */}
        <div
          aria-hidden
          className="absolute inset-0 -z-30"
          style={{
            background: 'var(--ff-pine-deep)',
          }}
        />

        {/* Background video — golden-hour course footage behind the scrim */}
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

        {/* Pine scrim over the video — keeps the cream text legible */}
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

        {/* Faint flag watermark, bottom-right */}
        <svg
          aria-hidden
          viewBox="0 0 120 120"
          className="absolute -right-10 -bottom-8 w-[280px] lg:w-[360px] opacity-[0.12] pointer-events-none -z-10"
        >
          <ellipse cx="60" cy="98" rx="50" ry="9" fill="#f5f1e8" />
          <line
            x1="74"
            y1="98"
            x2="74"
            y2="22"
            stroke="#f5f1e8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 74 24 Q 90 30 100 26 Q 92 38 100 50 Q 90 46 74 50 Z"
            fill="#f5f1e8"
          />
          <circle cx="48" cy="96" r="4.5" fill="#f5f1e8" />
        </svg>

        {/* Top — wordmark + nav */}
        <div className="flex items-start justify-between gap-6">
          {/* Brand badge — full-color logo on an ivory crest plate */}
          <div
            className="inline-flex flex-col items-center rounded-2xl px-6 py-3 sm:px-7 sm:py-3.5"
            style={{
              background: 'rgba(245, 241, 232, 0.85)',
              border: '1px solid rgba(232, 226, 210, 0.6)',
              boxShadow: 'var(--shadow-raised)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
            }}
          >
            <Image
              src="/logo-hero.png"
              alt="Fairway Founders Network"
              width={1727}
              height={1008}
              priority
              className="h-auto w-44 sm:w-56"
            />
            <div
              className="mt-3 flex w-full items-center justify-center gap-2.5 pt-2.5"
              style={{ borderTop: '1px solid var(--ff-hairline)' }}
            >
              <Image
                src="/gln-mark.png"
                alt="Golf Links Network"
                width={313}
                height={192}
                className="h-7 w-auto"
              />
              <div className="text-left leading-tight">
                <p
                  className="m-0 font-bold uppercase"
                  style={{
                    fontSize: 8,
                    letterSpacing: '0.18em',
                    color: 'var(--ff-taupe)',
                    fontFamily: 'var(--font-sans), system-ui, sans-serif',
                  }}
                >
                  Powered by
                </p>
                <p
                  className="m-0 font-semibold"
                  style={{
                    fontSize: 11,
                    color: 'var(--ff-ink-soft)',
                    fontFamily: 'var(--font-sans), system-ui, sans-serif',
                  }}
                >
                  Golf Links Network
                </p>
              </div>
            </div>
          </div>

          <nav className="hidden sm:flex gap-7">
            {['The Club', 'Membership', 'The Round'].map((label) => (
              <a
                key={label}
                href="#"
                className="text-[11px] font-semibold uppercase pb-1 border-b border-transparent hover:border-[color:var(--ff-gold)] transition-colors"
                style={{
                  letterSpacing: '0.16em',
                  color: 'rgba(245,241,232,0.82)',
                  fontFamily: 'var(--font-sans), system-ui, sans-serif',
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Middle — eyebrow + headline + sub */}
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
            Invitation Only · Est. 2024
          </p>
          <h1
            className="m-0"
            style={{
              fontFamily: 'var(--font-display)',
              fontOpticalSizing: 'auto',
              fontSize: 'clamp(38px, 4.4vw, 58px)',
              fontWeight: 400,
              lineHeight: 1.03,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as React.CSSProperties['textWrap'],
            }}
          >
            Where deals are made{' '}
            <em
              style={{
                fontStyle: 'italic',
                color: 'var(--ff-gold)',
              }}
            >
              between the tee and the green.
            </em>
          </h1>
          <p
            className="mt-5 max-w-[440px]"
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: 'rgba(245,241,232,0.80)',
            }}
          >
            A private circle of founders and operators. Nine holes, one
            shotgun, every Thursday at half-past two &mdash; the foursomes do
            the networking for you.
          </p>
        </div>

        {/* Bottom — quote */}
        <figure className="flex gap-4 items-start max-w-[460px] m-0">
          <div
            className="self-stretch shrink-0"
            style={{
              width: 2,
              background: 'var(--ff-gold)',
              opacity: 0.7,
            }}
            aria-hidden
          />
          <div>
            <blockquote
              className="m-0"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 17,
                lineHeight: 1.5,
                color: 'rgba(245,241,232,0.92)',
              }}
            >
              &ldquo;Two rounds in, I&rsquo;d closed a build, found my CPA, and
              made a friend. The course does what a conference never could.&rdquo;
            </blockquote>
            <figcaption
              className="mt-3 font-bold uppercase"
              style={{
                fontFamily: 'var(--font-sans), system-ui, sans-serif',
                fontSize: 10,
                letterSpacing: '0.18em',
                color: 'var(--ff-gold)',
                fontStyle: 'normal',
              }}
            >
              &mdash; Founding Member, Round 6
            </figcaption>
          </div>
        </figure>
      </section>

      {/* RIGHT — Sign-in column */}
      <section
        className="flex items-center justify-center px-6 sm:px-10 lg:px-12 py-14"
        style={{ background: 'var(--ff-cream)' }}
      >
        <div className="w-full max-w-[380px]">
          <p
            className="font-bold uppercase"
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: 'var(--ff-taupe)',
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
            }}
          >
            Members
          </p>
          <h2
            className="mt-2.5 mb-1.5 leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontOpticalSizing: 'auto',
              fontSize: 34,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--ff-pine)',
            }}
          >
            Welcome back
          </h2>
          <p
            className="mb-7"
            style={{
              fontSize: 14,
              color: 'var(--ff-ink-soft)',
              lineHeight: 1.55,
            }}
          >
            Sign in to RSVP for Thursday&rsquo;s round, see your foursome, and
            follow the live net leaderboard.
          </p>

          {/* Email + password (decorative — Clerk modal handles real auth) */}
          <div className="mb-[18px]">
            <FieldLabel>Email</FieldLabel>
            <Field type="email" placeholder="you@company.com" name="email" />
          </div>
          <div className="mb-[18px]">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="font-semibold uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  color: 'var(--ff-taupe)',
                  fontFamily: 'var(--font-sans), system-ui, sans-serif',
                }}
              >
                Password
              </span>
              <SignInButton>
                <button
                  type="button"
                  className="font-semibold hover:underline"
                  style={{
                    fontSize: 11,
                    color: 'var(--ff-gold)',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  Forgot?
                </button>
              </SignInButton>
            </div>
            <Field type="password" placeholder="••••••••" name="password" />
          </div>

          <div className="mt-2">
            <SignInButton>
              <GoldButton>Sign In to the Club</GoldButton>
            </SignInButton>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3.5 my-7">
            <span
              className="flex-1 h-px"
              style={{ background: 'var(--ff-hairline)' }}
            />
            <span
              className="font-bold uppercase"
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                color: 'var(--ff-taupe)',
                fontFamily: 'var(--font-sans), system-ui, sans-serif',
              }}
            >
              Not a member yet
            </span>
            <span
              className="flex-1 h-px"
              style={{ background: 'var(--ff-hairline)' }}
            />
          </div>

          {/* Invite card */}
          <div
            className="text-center"
            style={{
              border: '1px solid var(--ff-border)',
              borderRadius: 12,
              background: 'var(--ff-white)',
              boxShadow: 'var(--shadow-card)',
              padding: '18px 20px',
            }}
          >
            <p
              className="m-0"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 500,
                color: 'var(--ff-pine)',
              }}
            >
              Membership is by invitation
            </p>
            <p
              className="my-1 mb-3.5"
              style={{
                fontSize: 12,
                color: 'var(--ff-taupe)',
                lineHeight: 1.5,
              }}
            >
              New seats open between seasons. Request an introduction and
              we&rsquo;ll be in touch before the next round.
            </p>
            <SignUpButton>
              <SecondaryButton>Request an Invitation</SecondaryButton>
            </SignUpButton>
          </div>

          <div className="mt-9 flex items-center justify-between">
            <p
              className="font-semibold uppercase m-0"
              style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                color: 'var(--ff-taupe)',
                fontFamily: 'var(--font-sans), system-ui, sans-serif',
              }}
            >
              Powered by{' '}
              <strong style={{ color: 'var(--ff-ink-soft)' }}>
                Golf Links Network
              </strong>
            </p>
          </div>

          {/* Legal microcopy */}
          <p
            className="mt-4 text-center"
            style={{
              fontSize: 10,
              color: 'var(--ff-taupe)',
              lineHeight: 1.5,
            }}
          >
            By signing in you agree to our{' '}
            <a
              href="/terms"
              className="underline hover:no-underline"
              style={{ color: 'var(--ff-gold)' }}
            >
              Terms
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
        </div>
      </section>
    </div>
    <SponsorsSection />
    </>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-semibold uppercase mb-1.5"
      style={{
        fontSize: 10,
        color: 'var(--ff-taupe)',
        letterSpacing: '0.1em',
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  );
}

function Field({
  type,
  placeholder,
  name,
}: {
  type: string;
  placeholder: string;
  name: string;
}) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      autoComplete="off"
      className="w-full focus:outline-none"
      style={{
        border: '1px solid var(--ff-border)',
        borderRadius: 6,
        padding: '9px 10px',
        fontSize: 13,
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
        color: 'var(--ff-pine)',
        background: 'var(--ff-white)',
      }}
    />
  );
}

function GoldButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="w-full font-semibold uppercase transition-transform active:translate-y-px"
      style={{
        background: 'var(--ff-gold)',
        color: 'var(--ff-pine)',
        border: '1px solid #bd9a4f',
        borderRadius: 10,
        padding: '14px 20px',
        fontSize: 14,
        letterSpacing: '0.08em',
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
        boxShadow: 'var(--shadow-btn-gold)',
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="w-full font-semibold uppercase transition-transform active:translate-y-px"
      style={{
        background: 'var(--ff-white)',
        color: 'var(--ff-pine)',
        border: '1px solid var(--ff-gold)',
        borderRadius: 10,
        padding: '12px 18px',
        fontSize: 12,
        letterSpacing: '0.08em',
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
        boxShadow: 'var(--shadow-btn-secondary)',
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
