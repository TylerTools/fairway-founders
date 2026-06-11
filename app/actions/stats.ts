'use server';

import { supabase } from '@/lib/supabase';
import type { MemberCounts } from '@/components/CountTags';

/**
 * All-time accepted-interaction counts for a member's profile tags.
 * Credit rule: a Four credits the giver only; Links and Birdies credit both
 * parties. Implemented as cheap head-only count queries.
 */
export async function getMemberCountsTags(userId: string): Promise<MemberCounts> {
  const eitherParty = `from_user_id.eq.${userId},to_user_id.eq.${userId}`;
  const [foursRes, linksRes, birdiesRes] = await Promise.all([
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'four')
      .eq('status', 'accepted')
      .eq('from_user_id', userId),
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'link')
      .eq('status', 'accepted')
      .or(eitherParty),
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'birdie')
      .eq('status', 'accepted')
      .or(eitherParty),
  ]);

  return {
    fours: foursRes.count ?? 0,
    links: linksRes.count ?? 0,
    birdies: birdiesRes.count ?? 0,
  };
}
