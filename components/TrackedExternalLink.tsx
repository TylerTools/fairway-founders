'use client';

import { recordLinkClick } from '@/app/actions/analytics';
import type { Database } from '@/lib/database.types';

type Target = Database['public']['Enums']['link_click_target'];

/**
 * An external link that records an outbound click (fire-and-forget, deduped,
 * self-excluded) before the browser follows it. Opens in a new tab so the
 * recording completes without racing the navigation.
 */
export default function TrackedExternalLink({
  profileId,
  target,
  memberLinkId,
  href,
  className,
  children,
}: {
  profileId: string;
  target: Target;
  memberLinkId?: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        void recordLinkClick(profileId, target, memberLinkId);
      }}
    >
      {children}
    </a>
  );
}
