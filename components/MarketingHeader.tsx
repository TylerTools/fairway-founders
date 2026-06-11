'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton } from '@clerk/nextjs';

export default function MarketingHeader({
  signedInApproved,
}: {
  signedInApproved: boolean;
}) {
  const pathname = usePathname();
  if (pathname !== '/') return null;

  return (
    <header className="sticky top-0 z-20 bg-[color:var(--color-cream)]/95 backdrop-blur border-b border-[color:var(--color-gold)]/30">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-lg sm:text-xl font-semibold tracking-tight text-[color:var(--color-ink)] shrink-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Fairway Founders
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-[11px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-ink)]/80">
          <a href="#about" className="hover:text-[color:var(--color-gold)]">
            About
          </a>
          <a href="#how-it-works" className="hover:text-[color:var(--color-gold)]">
            How it works
          </a>
          <a href="#events" className="hover:text-[color:var(--color-gold)]">
            Events
          </a>
          <a href="#sponsors" className="hover:text-[color:var(--color-gold)]">
            Sponsors
          </a>
          <a href="#contact" className="hover:text-[color:var(--color-gold)]">
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {signedInApproved ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase hover:opacity-90"
            >
              Back to the course →
            </Link>
          ) : (
            <>
              <SignInButton>
                <button className="hidden sm:inline-block rounded-md border border-[color:var(--color-gold)] bg-white text-[color:var(--color-ink)] px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase hover:bg-[color:#f5f1e8]/40">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase hover:opacity-90">
                  Sign up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
