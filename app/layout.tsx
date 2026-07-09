import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Fraunces, Inter } from 'next/font/google';
import { ClerkProvider, Show } from '@clerk/nextjs';
import HeaderUserButton from '@/components/HeaderUserButton';
import { getAppUser } from '@/lib/current-user';
import { supabase } from '@/lib/supabase';
import { getViewMode } from '@/lib/view-mode';
import { canAccessCourseOps, canAccessAdmin } from '@/lib/auth';
import { getCurrentLeague, getMyLeagues } from '@/lib/league-context';
import BottomNav from '@/components/BottomNav';
import HeaderNav from '@/components/HeaderNav';
import LeagueSwitcher from '@/components/LeagueSwitcher';
import ViewToggle from '@/components/ViewToggle';
import FeedbackButton from '@/components/FeedbackButton';
import PendingScreen from '@/components/PendingScreen';
import OnboardingWizard from '@/components/OnboardingWizard';
import DeniedScreen from '@/components/DeniedScreen';
import NotificationBell from '@/components/NotificationBell';
import HeaderLogo from '@/components/HeaderLogo';
import HideOnHome from '@/components/HideOnHome';
import PlayNowBall from '@/components/PlayNowBall';
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
  metadataBase: new URL('https://fairwayfounders.org'),
  title: {
    default: 'Fairway Founders Network',
    template: '%s · Fairway Founders Network',
  },
  description:
    'Where founders connect, talk shop, and build deals on the course.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/favicon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/apple-touch-icon-167x167.png', sizes: '167x167' },
      { url: '/apple-touch-icon-120x120.png', sizes: '120x120' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#1A3A2E',
      },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'Fairway Founders Network',
    title: 'Fairway Founders Network',
    description:
      'Where founders connect, talk shop, and build deals on the course.',
    url: 'https://fairwayfounders.org',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fairway Founders Network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fairway Founders Network',
    description:
      'Where founders connect, talk shop, and build deals on the course.',
    images: ['/og-image.png'],
  },
  other: {
    'msapplication-TileColor': '#1A3A2E',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A3A2E',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appUser = await getAppUser();
  const actualRole = appUser?.app_role ?? null;
  const viewRole = await getViewMode(actualRole);
  const isActuallyAdmin = actualRole === 'super_admin';
  const accessStatus = appUser?.access_status ?? null;
  const isApproved = !appUser || accessStatus === 'approved';
  const isSignedInApproved = !!appUser && accessStatus === 'approved';

  // For the PendingScreen, surface which league (if any) the user is
  // currently waiting on. Cheaper than threading through every page.
  let pendingMembershipLeagueName: string | null = null;
  let hasPendingMembership = false;
  let hasDeclinedMembership = false;
  if (appUser && accessStatus === 'pending') {
    const memRes = await supabase
      .from('league_memberships')
      .select('status, league:league_id(name)')
      .eq('user_id', appUser.id);
    for (const row of memRes.data ?? []) {
      const league = Array.isArray(row.league) ? row.league[0] : row.league;
      if (row.status === 'pending') {
        hasPendingMembership = true;
        pendingMembershipLeagueName = league?.name ?? null;
        break;
      }
      if (row.status === 'declined') hasDeclinedMembership = true;
    }
  }
  // Super admins respect the view toggle (they can preview "member" view).
  // League admins always see the admin tab (no toggle).
  const hasAdminAccess = isSignedInApproved ? await canAccessAdmin() : false;
  const showAdminChrome = isActuallyAdmin ? viewRole === 'admin' : hasAdminAccess;
  const showCourseTab = isSignedInApproved ? await canAccessCourseOps() : false;
  const currentLeague = isSignedInApproved ? await getCurrentLeague() : null;
  const myLeagues = isSignedInApproved ? await getMyLeagues() : [];
  const sidebarEvents = isSignedInApproved ? await fetchEvents() : [];
  const filteredSidebarEvents = currentLeague
    ? sidebarEvents.filter((e) => e.course?.league?.id === currentLeague.id)
    : sidebarEvents;

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          afterSignOutUrl="/"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
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
          {(() => {
            const headerEl = (
              <header className="flex items-center justify-between gap-6 border-b border-[color:var(--color-gold)]/30 px-6 py-4 sticky top-0 z-10 bg-[color:var(--color-cream)]">
                <Link
                  href="/"
                  className="flex items-center gap-2 leading-none shrink-0"
                >
                  <HeaderLogo size={appUser ? 'large' : 'small'} />
                  <span className="sr-only">Fairway Founders Network — home</span>
                </Link>
                <HeaderNav
                  signedIn={isSignedInApproved}
                  showAdmin={showAdminChrome}
                  showCourse={showCourseTab}
                />
                <div className="flex items-center gap-3 shrink-0">
                  {isSignedInApproved && currentLeague && (
                    <LeagueSwitcher
                      current={{
                        id: currentLeague.id,
                        name: currentLeague.name,
                        short_name: currentLeague.short_name,
                      }}
                      options={myLeagues.map((l) => ({
                        id: l.id,
                        name: l.name,
                        short_name: l.short_name,
                      }))}
                    />
                  )}
                  {isActuallyAdmin && isApproved && (
                    <ViewToggle current={viewRole === 'admin' ? 'admin' : 'member'} />
                  )}
                  {isSignedInApproved && <NotificationBell />}
                  <Show when="signed-in">
                    <HeaderUserButton />
                  </Show>
                </div>
              </header>
            );
            // Signed-in users always see the header (even on /) so pending /
            // denied / onboarding screens still expose the user menu +
            // sign-out. Signed-out visitors keep the immersive public homepage.
            return appUser ? headerEl : <HideOnHome>{headerEl}</HideOnHome>;
          })()}
          <div className="flex-1 lg:pb-0 pb-24 flex">
            {isSignedInApproved && (
              <HideOnHome>
                <EventSidebar events={filteredSidebarEvents} />
              </HideOnHome>
            )}
            <div className="flex-1 min-w-0">
              {!appUser || isApproved ? (
                children
              ) : accessStatus === 'denied' ? (
                <DeniedScreen />
              ) : !appUser.onboarded_at ? (
                <OnboardingWizard name={appUser.name} />
              ) : (
                <PendingScreen
                  name={appUser.name}
                  leagueName={pendingMembershipLeagueName ?? undefined}
                  pendingLeague={hasPendingMembership}
                  declinedLeague={
                    !hasPendingMembership && hasDeclinedMembership
                  }
                />
              )}
            </div>
          </div>
          {appUser && accessStatus === 'approved' && (
            <HideOnHome>
              <PlayNowBall me={appUser} />
            </HideOnHome>
          )}
          {appUser && isApproved && (
            <HideOnHome>
              <FeedbackButton />
            </HideOnHome>
          )}
          {isApproved && (
            <HideOnHome>
              <BottomNav
                signedIn={isSignedInApproved}
                showAdmin={showAdminChrome}
                showCourse={showCourseTab}
              />
            </HideOnHome>
          )}
        </ClerkProvider>
      </body>
    </html>
  );
}
