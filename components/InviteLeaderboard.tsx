import Link from 'next/link';
import Avatar from './Avatar';
import type { InviteLeaderboardEntry } from '@/app/actions/referrals';

/**
 * All-time "most invites" board. Distinct from the monthly networking Givers
 * board — this counts founders a member has brought into the club.
 */
export default function InviteLeaderboard({
  entries,
  meId,
}: {
  entries: InviteLeaderboardEntry[];
  meId: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm italic text-[color:var(--color-mute)]">
        No invites yet — share your link from your profile to get on the board.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card overflow-hidden">
      {entries.map((e, i) => (
        <Link
          key={e.userId}
          href={`/roster/${e.userId}`}
          className={`flex items-center gap-3 px-4 py-3 border-b border-[color:#f0ebd8] last:border-b-0 hover:bg-[color:#f5f1e8]/40 ${
            e.userId === meId ? 'bg-[color:#fdf9ee]' : ''
          }`}
        >
          <span className="w-5 text-center text-sm font-bold text-[color:var(--color-gold)]">
            {i + 1}
          </span>
          <Avatar size={36} photoUrl={e.photo_url} rounded="xl" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {e.name}
              {e.userId === meId && (
                <span className="text-[color:var(--color-gold)] font-normal"> (you)</span>
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-[color:var(--color-mute)]">
              {e.invites} invited
            </p>
          </div>
          <span
            className="text-lg font-semibold text-[color:var(--color-ink)] leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {e.invites}
          </span>
        </Link>
      ))}
    </div>
  );
}
