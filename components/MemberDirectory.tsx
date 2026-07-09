'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import MemberCard, { type DirectoryMember } from './MemberCard';
import { attachOrphanToLeague } from '@/app/actions/access';

export default function MemberDirectory({
  members,
  leagues,
  isAdmin,
  currentLeagueId,
  currentLeagueLabel,
}: {
  members: DirectoryMember[];
  leagues: { slug: string; label: string }[];
  isAdmin: boolean;
  currentLeagueId?: string | null;
  currentLeagueLabel?: string | null;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [league, setLeague] = useState<string>('all');
  const [industry, setIndustry] = useState<string>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [, startApprove] = useTransition();

  const approveLabel = currentLeagueLabel
    ? `Approve into ${currentLeagueLabel}`
    : 'Approve';

  function onApprove(userId: string) {
    if (!currentLeagueId) {
      setApproveError('Pick a league from the switcher first.');
      return;
    }
    setApproveError(null);
    setApprovingId(userId);
    startApprove(async () => {
      const res = await attachOrphanToLeague(userId, currentLeagueId);
      if (!res.ok) setApproveError(res.error ?? 'Could not approve.');
      setApprovingId(null);
      router.refresh();
    });
  }

  const industries = useMemo(
    () =>
      [...new Set(members.map((m) => m.industry).filter((x): x is string => !!x))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [members],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members.filter((m) => {
      if (league !== 'all' && !m.leagues.some((l) => l.slug === league)) return false;
      if (industry !== 'all' && m.industry !== industry) return false;
      if (!term) return true;
      return [m.name, m.company, m.professional_role, m.tagline, m.industry]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(term));
    });
  }, [members, q, league, industry]);

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, company, or role…"
          className="flex-1 min-w-0 rounded-md px-3 py-2.5 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
        />
        {industries.length > 1 && (
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="shrink-0 max-w-[42%] rounded-md px-2.5 py-2.5 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
          >
            <option value="all">All industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        )}
      </div>

      {leagues.length > 1 && (
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          <Chip active={league === 'all'} onClick={() => setLeague('all')}>
            All
          </Chip>
          {leagues.map((l) => (
            <Chip
              key={l.slug}
              active={league === l.slug}
              onClick={() => setLeague(l.slug)}
            >
              {l.label}
            </Chip>
          ))}
        </div>
      )}

      {approveError && (
        <p className="mt-3 text-xs text-[color:#a13c3c]">{approveError}</p>
      )}

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm italic text-[color:var(--color-mute)]">
          No members match{q ? ` “${q}”` : ' that filter'}.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {filtered.map((m) => (
            <MemberCard
              key={m.id}
              m={m}
              isAdmin={isAdmin}
              onApprove={isAdmin && currentLeagueId ? onApprove : undefined}
              approving={approvingId === m.id}
              approveLabel={approveLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 text-[10px] tracking-[0.12em] uppercase font-bold rounded-full px-3 py-1.5 transition-colors ${
        active
          ? 'bg-[color:var(--color-navy)] text-[color:var(--color-gold)]'
          : 'bg-[color:#f0ebd8] text-[color:#5a5a4a] hover:bg-[color:#e8e2d2]'
      }`}
    >
      {children}
    </button>
  );
}
