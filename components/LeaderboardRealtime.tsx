'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '@/lib/supabase-client';

/**
 * Live-refreshes the leaderboard whenever a relevant DB change lands.
 *
 * Subscribes to:
 *   - hole_scores changes for any foursome in this event
 *   - foursomes changes for this event (so group regeneration also refreshes)
 *
 * Calls router.refresh() — the page is a Server Component, so the leaderboard
 * data + ranking re-fetches from the server and the browser diffs the DOM.
 * No client-side ranking logic, no duplicated scoring math.
 *
 * Refresh is debounced ~600ms so an admin bulk-entering scores doesn't thrash
 * everyone else's tab.
 *
 * Realtime is enabled at the DB level by adding hole_scores + foursomes to
 * the supabase_realtime publication (migration: leaderboard_realtime).
 */
export default function LeaderboardRealtime({
  eventId,
  foursomeIds,
}: {
  eventId: string;
  foursomeIds: string[];
}) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idKey = foursomeIds.join(',');

  useEffect(() => {
    function schedule() {
      if (pending.current) return;
      pending.current = setTimeout(() => {
        pending.current = null;
        router.refresh();
      }, 600);
    }

    const foursomeIdSet = new Set(idKey ? idKey.split(',') : []);

    const channel = supabase
      .channel(`leaderboard-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hole_scores' },
        (payload) => {
          // postgres_changes filter doesn't support `in.(...)`, so we
          // subscribe to all hole_scores changes and filter client-side.
          const row = (payload.new ?? payload.old) as
            | { foursome_id?: string }
            | undefined;
          if (row?.foursome_id && foursomeIdSet.has(row.foursome_id)) schedule();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foursomes',
          filter: `event_id=eq.${eventId}`,
        },
        schedule,
      )
      .subscribe();

    return () => {
      if (pending.current) {
        clearTimeout(pending.current);
        pending.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [eventId, idKey, router, supabase]);

  return null;
}
