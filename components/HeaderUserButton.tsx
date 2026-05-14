'use client';

import { UserButton, useClerk } from '@clerk/nextjs';
import FounderProfile from './FounderProfile';

const FlagIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 22V4" />
    <path d="M4 4l14 4-4 4 4 4-14 4" />
  </svg>
);

const SignOutIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function HeaderUserButton() {
  const { signOut } = useClerk();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (e) {
      // Even if Clerk errors, we still want out.
      console.error('signOut error', e);
    }
    // Hard navigation — browser-level, cannot be intercepted by Next router
    // state or Clerk modal portals. Guarantees the user lands on the
    // marketing landing in a fresh document.
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  }

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Action
          label="Founder details"
          labelIcon={<FlagIcon />}
          open="founder"
        />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action
          label="Sign out"
          labelIcon={<SignOutIcon />}
          onClick={handleSignOut}
        />
      </UserButton.MenuItems>
      <UserButton.UserProfilePage
        label="Founder details"
        url="founder"
        labelIcon={<FlagIcon />}
      >
        <FounderProfile />
      </UserButton.UserProfilePage>
    </UserButton>
  );
}
