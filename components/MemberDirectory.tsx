'use client';

import { useMemo, useState } from 'react';
import MemberCard, { type DirectoryMember } from './MemberCard';

export default function MemberDirectory({
  members,
  leagues,
  isAdmin,
}: {
  members: DirectoryMember[];
  leagues: { slug: string; label: string }[];
  isAdmin: boolean;
}) {
  const [q, setQ] = useState('');
  const [league, setLeague] = useState<string>('all');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members.filter((m) => {
      if (league !== 'all' && !m.leagues.some((l) => l.slug === league)) return false;
      if (!term) return true;
      return [m.name, m.company, m.professional_role, m.tagline]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(term));
    });
  }, [members, q, league]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, company, or role…"
        className="w-full rounded-md px-3 py-2.5 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
      />

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

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm italic text-[color:var(--color-mute)]">
          No members match{q ? ` “${q}”` : ' that filter'}.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {filtered.map((m) => (
            <MemberCard key={m.id} m={m} isAdmin={isAdmin} />
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
