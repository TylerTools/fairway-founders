import { redirect } from 'next/navigation';
import { getAppUser } from '@/lib/current-user';
import { getCurrentLeague, getCurrentLeagueId } from '@/lib/league-context';
import { getMyPendingRequests } from '@/app/actions/interactions';
import { getNetworkLeaderboard } from '@/app/actions/stats';
import { getInviteLeaderboard } from '@/app/actions/referrals';
import RequestsInbox from './RequestsInbox';
import LogInteraction from './LogInteraction';
import NetworkLeaderboard from '@/components/NetworkLeaderboard';
import InviteLeaderboard from '@/components/InviteLeaderboard';
import InviteCard from '@/components/InviteCard';
import SponsorStrip from '@/components/SponsorStrip';

export default async function NetworkPage() {
  const me = await getAppUser();
  if (!me) redirect('/');

  // Network is per-league: each league has its own networking instance.
  // Both queries scope to the current league; pre-rebuild interactions with
  // league_id IS NULL fall through and show in every league context.
  const leagueId = await getCurrentLeagueId();
  const league = await getCurrentLeague();
  const [pending, leaders, inviters] = await Promise.all([
    getMyPendingRequests(leagueId),
    getNetworkLeaderboard(leagueId),
    getInviteLeaderboard(leagueId),
  ]);
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long' });

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-2xl mx-auto w-full">
      {league && (
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          {league.short_name ?? league.name} · Network
        </p>
      )}
      <h1 className="text-2xl mt-1" style={{ fontFamily: 'var(--font-display)' }}>
        Network
      </h1>
      <p className="mt-1 text-xs text-[color:var(--color-mute)] leading-relaxed">
        Track the business you give and get inside {league?.short_name ?? 'your league'}. Throw a{' '}
        <strong>Four</strong> (a referral), log a <strong>Link</strong> (a 1:1), or a{' '}
        <strong>Birdie</strong> (closed business). The other person confirms it, and it counts
        on both your profiles.
      </p>

      <SponsorStrip placement="dashboard_strip" leagueId={leagueId ?? undefined} />

      <section className="mt-6">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
          Pending for you
          {pending.length > 0 && (
            <span className="text-[color:var(--color-gold)]"> · {pending.length}</span>
          )}
        </p>
        <RequestsInbox initial={pending} />
      </section>

      <section className="mt-7">
        <LogInteraction />
      </section>

      <section className="mt-7">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
            Givers · {monthLabel}
          </p>
          <span className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
            Resets monthly
          </span>
        </div>
        <NetworkLeaderboard entries={leaders} meId={me.id} />
      </section>

      <section className="mt-7">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
            Founders' Circle · most invites
          </p>
          <span className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
            All-time
          </span>
        </div>
        <div className="mb-3">
          <InviteCard />
        </div>
        <InviteLeaderboard entries={inviters} meId={me.id} />
      </section>
    </main>
  );
}
