import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public surfaces that a signed-out visitor is allowed to reach. Everything
// else (the whole app) bounces to the homepage `/` when not signed in.
//  - `/join(.*)`  — referral / league-join links land signed-out invitees here
//  - `/api(.*)`   — cron + vCard + webhooks + MCP self-guard; never redirect them
//  - `/.well-known(.*)` — OAuth discovery for the admin MCP server; Claude fetches
//    these unauthenticated, so they must never bounce to `/`
const isPublicRoute = createRouteMatcher([
  '/',
  '/privacy',
  '/terms',
  '/join(.*)',
  '/api(.*)',
  '/.well-known(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
