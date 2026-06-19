import { getAppUser } from '@/lib/current-user';
import { getCurrentLeague } from '@/lib/league-context';
import {
  getOrCreateMyReferralCode,
  getReferralCount,
} from '@/app/actions/referrals';
import InviteFriend from './InviteFriend';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

/**
 * "Invite founders" card for the signed-in member: their running invite count,
 * their personal share button, and the raw link. Friends who sign up through
 * the link are credited to them and walk straight in (auto-approved).
 */
export default async function InviteCard() {
  const me = await getAppUser();
  if (!me) return null;

  const [code, count, league] = await Promise.all([
    getOrCreateMyReferralCode(),
    getReferralCount(me.id),
    getCurrentLeague(),
  ]);
  const slug = league?.slug ?? null;
  const url = code && slug ? `${SITE_URL}/join/${slug}?ref=${code}` : null;

  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
            Invite founders
          </p>
          <p className="mt-1.5 leading-none">
            <span
              className="text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {count}
            </span>
            <span className="ml-2 text-xs text-[color:var(--color-mute)]">
              founder{count === 1 ? '' : 's'} invited
            </span>
          </p>
        </div>
        <InviteFriend
          inviterName={me.name}
          referralCode={code}
          leagueSlug={slug}
          leagueName={league?.name ?? null}
        />
      </div>
      <p className="mt-3 text-xs text-[color:#5a5a4a] leading-relaxed">
        Share your personal invite. Friends who sign up through your link are
        credited to you and skip the waitlist.
      </p>
      {url && (
        <p className="mt-2 text-[11px] text-[color:var(--color-mute)] break-all font-mono">
          {url}
        </p>
      )}
    </div>
  );
}
