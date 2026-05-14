'use client';

import { UserButton } from '@clerk/nextjs';
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

export default function HeaderUserButton() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Action
          label="Founder details"
          labelIcon={<FlagIcon />}
          open="founder"
        />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
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
