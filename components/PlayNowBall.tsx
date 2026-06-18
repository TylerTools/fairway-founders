import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/lib/current-user';
import BackToGameBall from './BackToGameBall';

// A round is "on" from midnight on the event's day through ~6h after tee time
// (covers a shotgun round plus a buffer). The ball only appears in that window.
const ROUND_END_BUFFER_MS = 6 * 60 * 60 * 1000;

function gameIsOn(dateStr: string): boolean {
  const tee = new Date(dateStr);
  const now = Date.now();
  const dayStart = new Date(
    tee.getFullYear(),
    tee.getMonth(),
    tee.getDate(),
  ).getTime();
  return now >= dayStart && now <= tee.getTime() + ROUND_END_BUFFER_MS;
}

/**
 * The game has "started" for a player once they've been placed in a group
 * (foursome_members) for a round that's on today. When that's true we float the
 * golf ball linking back to that round's scorecard (handled by BackToGameBall,
 * which hides itself when you're already on /leaderboard).
 */
export default async function PlayNowBall({ me }: { me: AppUser }) {
  const res = await supabase
    .from('foursome_members')
    .select('foursome:foursome_id(event:event_id(id, date))')
    .eq('user_id', me.id);

  const games = (res.data ?? [])
    .map((r) => {
      const f = Array.isArray(r.foursome) ? r.foursome[0] : r.foursome;
      const e = f && (Array.isArray(f.event) ? f.event[0] : f.event);
      return (e as { id: string; date: string } | null) ?? null;
    })
    .filter((e): e is { id: string; date: string } => !!e && gameIsOn(e.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const game = games[0];
  if (!game) return null;

  return <BackToGameBall href={`/leaderboard?event=${game.id}`} />;
}
