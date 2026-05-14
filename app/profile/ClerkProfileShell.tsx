'use client';

import { UserProfile } from '@clerk/nextjs';
import FounderProfile from '@/components/FounderProfile';

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

export default function ClerkProfileShell() {
  return (
    <UserProfile path="/profile" routing="path">
      <UserProfile.Page
        label="Founder details"
        url="founder"
        labelIcon={<FlagIcon />}
      >
        <FounderProfile />
      </UserProfile.Page>
    </UserProfile>
  );
}
