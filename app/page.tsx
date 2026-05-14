import Image from 'next/image';
import { redirect } from 'next/navigation';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { getAppUser } from '@/lib/current-user';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const me = await getAppUser();

  // Approved signed-in users belong on the dashboard.
  // Pending/denied users still land here; layout intercepts with the
  // PendingScreen / DeniedScreen.
  if (me && me.access_status === 'approved') {
    redirect('/dashboard');
  }

  return (
    <main className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden min-h-[calc(100vh-73px-100px)]">
      {/* Video backdrop */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
      >
        <source src="/hero.mp4" type="video/mp4" />
        <source src="/hero.webm" type="video/webm" />
      </video>

      {/* Soft fade so content stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-cream)]/60 via-[color:var(--color-cream)]/20 to-[color:var(--color-cream)]/80 pointer-events-none" />

      {/* Foreground */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg py-12">
        <Image
          src="/logo.png"
          alt="Fairway Founders Network"
          width={1024}
          height={1024}
          priority
          className="w-64 sm:w-80 md:w-96 h-auto drop-shadow-[0_8px_24px_rgba(26,58,46,0.25)]"
        />

        <p
          className="mt-2 text-base sm:text-lg italic text-[color:var(--color-ink)]/80"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Tee off at half-past two.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 w-full max-w-sm">
          <SignUpButton>
            <button className="rounded-lg bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-4 text-sm font-semibold tracking-[0.1em] uppercase shadow-lg shadow-[color:var(--color-navy)]/25 hover:opacity-90">
              Sign up
            </button>
          </SignUpButton>
          <SignInButton>
            <button className="rounded-lg border border-[color:var(--color-gold)] bg-white text-[color:var(--color-ink)] py-4 text-sm font-semibold tracking-[0.1em] uppercase shadow-md hover:bg-[color:#f5f1e8]/40">
              Sign in
            </button>
          </SignInButton>
        </div>
        <p className="mt-4 text-[11px] text-[color:var(--color-ink)]/70 italic">
          New here? Sign up — an admin will approve your request before you can RSVP.
        </p>
      </div>
    </main>
  );
}
