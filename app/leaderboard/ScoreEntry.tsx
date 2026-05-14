'use client';

import { useState, useTransition } from 'react';
import { upsertHoleScore } from '@/app/actions/scores';

const PAR = 4;

export default function ScoreEntry({
  foursomeId,
  holes,
  initialScores,
  canEdit,
  teamHcp,
  members,
}: {
  foursomeId: string;
  holes: number[];
  initialScores: Record<number, number>;
  canEdit: boolean;
  teamHcp: number;
  members: { id: string; name: string; handicap: number | null }[];
}) {
  const [scores, setScores] = useState<Record<number, number | null>>(
    initialScores,
  );
  const [pending, startTransition] = useTransition();

  function setScore(hole: number, raw: string) {
    const parsed = raw.trim() === '' ? null : parseInt(raw, 10);
    setScores((prev) => ({ ...prev, [hole]: parsed }));
    startTransition(async () => {
      await upsertHoleScore(foursomeId, hole, parsed);
    });
  }

  const gross = Object.values(scores).reduce<number>(
    (a, v) => a + (typeof v === 'number' && v > 0 ? v : 0),
    0,
  );
  const net = gross > 0 ? gross - teamHcp : null;

  return (
    <div className="bg-[color:var(--color-cream)] border-t border-[color:#e8e2d2] px-3 py-3">
      <p className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)] font-semibold mb-2">
        Hole-by-Hole {!canEdit && <span className="italic font-normal normal-case tracking-normal">· view only</span>}
        {pending && <span className="ml-2 italic font-normal normal-case tracking-normal">· saving…</span>}
      </p>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${holes.length}, minmax(0,1fr))` }}
      >
        {holes.map((hole) => {
          const v = scores[hole];
          const score = typeof v === 'number' && v > 0 ? v : null;
          const diff = score != null ? score - PAR : null;
          let bg = '#fff';
          let fg = '#1a3a2e';
          if (diff != null) {
            if (diff < 0) {
              bg = '#7c9885';
              fg = '#fff';
            } else if (diff === 0) {
              bg = '#fff';
            } else if (diff === 1) {
              bg = '#f0ebd8';
            } else {
              bg = '#a87c4f';
              fg = '#fff';
            }
          }
          return (
            <div key={hole} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-[color:var(--color-mute)] font-semibold">
                {hole}
              </span>
              {canEdit ? (
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={v ?? ''}
                  onChange={(e) => setScore(hole, e.target.value)}
                  className="w-full text-center text-sm font-semibold border border-[color:#e8e2d2] rounded-md py-1.5"
                  style={{ background: bg, color: fg }}
                />
              ) : (
                <div
                  className="w-full text-center text-sm font-semibold border border-[color:#e8e2d2] rounded-md py-1.5"
                  style={{ background: bg, color: fg }}
                >
                  {v ?? '—'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-[color:#e8e2d2] flex justify-around text-xs">
        <Stat label="Gross" value={gross || '—'} />
        <Stat label="− Hcp" value={teamHcp} />
        <Stat label="Net" value={net ?? '—'} highlight />
      </div>

      <div className="mt-2 pt-2 border-t border-[color:#e8e2d2]">
        <p className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)] font-semibold mb-1.5">
          Players · individual hcp
        </p>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <span
              key={m.id}
              className="text-[11px] px-2 py-0.5 bg-white border border-[color:#e8e2d2] rounded-full text-[color:#5a5a4a]"
            >
              {m.name.split(' ')[0]} · <strong className="text-[color:var(--color-ink)]">{m.handicap ?? '—'}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`text-[10px] tracking-[0.1em] font-semibold ${
          highlight ? 'text-[color:var(--color-gold)]' : 'text-[color:var(--color-mute)]'
        }`}
      >
        {label.toUpperCase()}
      </p>
      <p
        className="text-base font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
    </div>
  );
}
