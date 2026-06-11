import type { Database } from './database.types';

type InteractionKind = Database['public']['Enums']['interaction_kind'];

/**
 * Networking contribution weights. The monthly leaderboard score is the sum of
 * these over a member's *accepted* interactions in the current calendar month.
 * Tune here — this is the single source of truth (the TS leaderboard fold reads
 * it directly, so there's no SQL duplication to keep in sync).
 *
 * Credit rule (who earns the points on accept):
 *   four   → the giver only (from_user_id) — giving referrals is the prized act
 *   link   → both parties
 *   birdie → both parties
 */
export const POINT_WEIGHTS: Record<InteractionKind, number> = {
  four: 3,
  link: 5,
  birdie: 15,
};
