import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Fraunces, Inter } from 'next/font/google';
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
} from '@clerk/nextjs';
import HeaderUserButton from '@/components/HeaderUserButton';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import BottomNav from '@/components/BottomNav';
import ViewToggle from '@/components/ViewToggle';
import FeedbackButton from '@/components/FeedbackButton';
import PendingScreen from '@/components/PendingScreen';
import DeniedScreen from '@/components/DeniedScreen';
import EventSidebar from '@/components/EventSidebar';
import { fetchEvents } from '@/lib/events';
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
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appUser = await getAppUser();
  const actualRole = appUser?.app_role ?? null;
  const viewRole = await getViewMode(actualRole);
  const isActuallyAdmin = actualRole === 'admin';
  const showAdminChrome = viewRole === 'admin';
  const accessStatus = appUser?.access_status ?? null;
  const isApproved = !appUser || accessStatus === 'approved';
  const isSignedInApproved = !!appUser && accessStatus === 'approved';
  const sidebarEvents = isSignedInApproved ? await fetchEvents() : [];

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          afterSignOutUrl="/"
          appearance={{
            variables: {
              colorPrimary: '#1a3a2e',
              colorText: '#1a3a2e',
              colorTextOnPrimaryBackground: '#c9a961',
              colorBackground: '#f5f1e8',
              colorInputBackground: '#ffffff',
              colorInputText: '#1a3a2e',
              fontFamily:
                "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
              borderRadius: '10px',
            },
            elements: {
              card: 'shadow-xl border border-[#e8e2d2]',
              headerTitle:
                "text-[color:#1a3a2e] [font-family:'Fraunces',Georgia,serif] font-semibold",
              headerSubtitle: 'text-[color:#5a5a4a]',
              socialButtonsBlockButton:
                'border border-[#e8e2d2] hover:bg-[#f5f1e8]/40',
              formButtonPrimary:
                'bg-[#1a3a2e] hover:opacity-90 text-[#c9a961] tracking-[0.08em] uppercase text-xs',
              footerActionLink: 'text-[#c9a961] hover:text-[#1a3a2e]',
              logoBox: 'h-10',
            },
          }}
        >
          <header className="flex items-center justify-between border-b border-[color:var(--color-gold)]/30 px-6 py-4 sticky top-0 z-10 bg-[color:var(--color-cream)]">
            <Link href="/" className="flex items-center gap-2 leading-none">
              <Image
                src="/logo.png"
                alt="Fairway Founders Network"
                width={160}
                height={160}
                priority
                className="h-10 sm:h-12 w-auto"
              />
              <span className="sr-only">Fairway Founders Network</span>
            </Link>
            <div className="flex items-center gap-3">
              {isActuallyAdmin && isApproved && (
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
                    Request access
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <HeaderUserButton />
              </Show>
            </div>
          </header>
          <div className="flex-1 pb-24 flex">
            {isSignedInApproved && <EventSidebar events={sidebarEvents} />}
            <div className="flex-1 min-w-0">
              {!appUser || isApproved ? (
                children
              ) : accessStatus === 'denied' ? (
                <DeniedScreen />
              ) : (
                <PendingScreen name={appUser.name} />
              )}
            </div>
          </div>
          {appUser && isApproved && <FeedbackButton />}
          {isApproved && (
            <BottomNav role={showAdminChrome ? viewRole : actualRole} />
          )}
        </ClerkProvider>
      </body>
    </html>
  );
}
