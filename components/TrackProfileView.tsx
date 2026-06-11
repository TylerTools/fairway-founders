'use client';

import { useEffect } from 'react';
import { recordProfileView } from '@/app/actions/analytics';

/** Invisible: records a (deduped, self-excluded) profile view on mount. */
export default function TrackProfileView({ profileId }: { profileId: string }) {
  useEffect(() => {
    recordProfileView(profileId);
  }, [profileId]);
  return null;
}
