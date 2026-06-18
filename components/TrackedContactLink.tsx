'use client';

import { recordLinkClick } from '@/app/actions/analytics';
import type { Database } from '@/lib/database.types';

type Target = Database['public']['Enums']['link_click_target'];

/**
 * A tel: / sms: / mailto: contact link that records the tap (deduped,
 * self-excluded) before the browser hands off to the dialer / messages / mail
 * app. No target="_blank" — these schemes open a native handler in place.
 */
export default function TrackedContactLink({
  profileId,
  target,
  href,
  className,
  children,
}: {
  profileId: string;
  target: Target;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        void recordLinkClick(profileId, target);
      }}
    >
      {children}
    </a>
  );
}
