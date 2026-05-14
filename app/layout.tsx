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
import { getViewMode } from '@/lib/view-mode';
import BottomNav from '@/components/BottomNav';
import ViewToggle from '@/components/ViewToggle';
import FeedbackButton from '@/components/FeedbackButton';
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
  const actualRole = appUser?.app_role ?? null;
  const viewRole = await getViewMode(actualRole);
  const isActuallyAdmin = actualRole === 'admin';
  const showAdminChrome = viewRole === 'admin';

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <header className="flex items-center justify-between border-b border-[color:var(--color-gold)]/30 px-6 py-4 sticky top-0 z-10 bg-[color:var(--color-cream)]">
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
              {isActuallyAdmin && (
                <ViewToggle current={viewRole === 'admin' ? 'admin' : 'member'} />
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
          <div className="flex-1 pb-24">{children}</div>
          {appUser && <FeedbackButton />}
          <BottomNav role={showAdminChrome ? viewRole : actualRole} />
        </ClerkProvider>
      </body>
    </html>
  );
}
