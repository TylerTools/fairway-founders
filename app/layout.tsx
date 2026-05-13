import type { Metadata } from 'next';
import Link from 'next/link';
import { Fraunces, Inter } from 'next/font/google';
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import { getAppUser } from '@/lib/current-user';
import './globals.css';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fairway Founders',
  description: 'A private weekly networking round for founders and operators.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appUser = await getAppUser();
  const isAdmin = appUser?.app_role === 'admin';
  const isCourse = appUser?.app_role === 'course';

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <header className="flex items-center justify-between border-b border-[color:var(--color-gold)]/30 px-6 py-4">
            <Link href="/" className="leading-none">
              <div
                className="text-xl font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Fairway
              </div>
              <div
                className="text-xl italic text-[color:var(--color-gold)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Founders
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-xs font-semibold tracking-[0.15em] uppercase text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/60 rounded-full px-3 py-1.5 hover:bg-[color:var(--color-gold)]/10"
                >
                  Admin
                </Link>
              )}
              {isCourse && (
                <Link
                  href="/course"
                  className="text-xs font-semibold tracking-[0.15em] uppercase text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/60 rounded-full px-3 py-1.5 hover:bg-[color:var(--color-gold)]/10"
                >
                  Course Ops
                </Link>
              )}
              <Show when="signed-out">
                <SignInButton>
                  <button className="text-sm font-medium tracking-wide uppercase text-[color:var(--color-ink)] hover:text-[color:var(--color-gold)] cursor-pointer">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full text-sm font-semibold tracking-wide uppercase px-5 py-2 cursor-pointer hover:opacity-90">
                    Sign up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
