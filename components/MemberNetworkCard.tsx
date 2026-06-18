import CountTags from './CountTags';
import type { MemberNetworkStats } from '@/app/actions/stats';

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * Promoted networking summary for a member's profile — referrals/1:1s/closed
 * business they've been part of, total business $ closed, contact saves, and an
 * "active this month" badge. The reputation half of the digital business card.
 */
export default function MemberNetworkCard({ stats }: { stats: MemberNetworkStats }) {
  const showFooter = stats.businessCents > 0 || stats.saves > 0;

  return (
    <section className="mt-3 rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
          Networking
        </p>
        {stats.activeThisMonth && (
          <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-gold)] text-[color:var(--color-navy)] rounded-full px-2 py-0.5">
            Active this month
          </span>
        )}
      </div>

      <div className="mt-3">
        <CountTags fours={stats.fours} links={stats.links} birdies={stats.birdies} />
      </div>

      {showFooter && (
        <div className="mt-3 pt-3 border-t border-[color:#f0ebd8] flex flex-wrap gap-x-5 gap-y-1 text-xs text-[color:#5a5a4a]">
          {stats.businessCents > 0 && (
            <span>
              <strong className="text-[color:var(--color-ink)] font-semibold">
                {money(stats.businessCents)}
              </strong>{' '}
              business closed
            </span>
          )}
          {stats.saves > 0 && (
            <span>
              <strong className="text-[color:var(--color-ink)] font-semibold">
                {stats.saves}
              </strong>{' '}
              contact {stats.saves === 1 ? 'save' : 'saves'}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
