'use client';

import { useState } from 'react';
import ScoreEntry from './ScoreEntry';
import { fmtToPar } from '@/lib/scoring';
import { lastName } from '@/lib/schedule';

export interface LeaderboardRowData {
  foursomeId: string;
  hole: number;
  tier: 'A' | 'B' | 'C';
  hasTier: boolean;
  groupIndex: number;
  teamHcp: number;
  holesIn: number;
  net: number | null;
  toPar: number | null;
  rank: number | null;
  isMine: boolean;
  memberNames: string[];
  members: { id: string; name: string; handicap: number | null }[];
  scores: Record<number, number>;
}

export default function LeaderboardRow({
  row,
  holes,
  canEdit,
  defaultOpen,
}: {
  row: LeaderboardRowData;
  holes: number[];
  canEdit: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const showRank = row.rank != null;
  const placeColor =
    row.rank === 1 ? '#c9a961' : row.rank === 2 ? '#a8a596' : row.rank === 3 ? '#a87c4f' : '#5a5a4a';

  return (
    <div
      className={`rounded-xl overflow-hidden border bg-white mb-2 ${
        row.isMine ? 'border-[color:var(--color-gold)]' : 'border-[color:#e8e2d2]'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left flex items-center gap-3 px-4 py-3.5"
      >
        <div className="w-9 text-center shrink-0">
          {showRank ? (
            <p
              className="text-xl font-bold leading-none"
              style={{ fontFamily: 'var(--font-display)', color: placeColor }}
            >
              {row.rank}
            </p>
          ) : (
            <p className="text-[10px] font-semibold tracking-[0.1em] text-[color:var(--color-mute)]">—</p>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[color:var(--color-ink)] leading-tight">
            {row.memberNames.map((n) => lastName(n)).join(' / ')}
          </p>
          <p className="text-[10px] text-[color:var(--color-mute)] mt-0.5 tracking-[0.05em]">
            HOLE {row.hole}
            {row.hasTier ? ` · TIER ${row.tier}` : ''} · TEAM HCP {row.teamHcp}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className="text-xl font-semibold leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              color: row.toPar != null && row.toPar < 0 ? '#7c9885' : '#1a3a2e',
            }}
          >
            {row.holesIn > 0 ? fmtToPar(row.toPar) : '—'}
          </p>
          <p className="text-[10px] text-[color:var(--color-mute)] mt-0.5">
            {row.holesIn > 0 ? `thru ${row.holesIn} · net ${row.net}` : 'no scores'}
          </p>
        </div>
      </button>
      {open && (
        <ScoreEntry
          foursomeId={row.foursomeId}
          holes={holes}
          initialScores={row.scores}
          canEdit={canEdit}
          teamHcp={row.teamHcp}
          members={row.members}
        />
      )}
    </div>
  );
}
