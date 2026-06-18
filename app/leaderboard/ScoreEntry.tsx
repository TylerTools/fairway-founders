'use client';

import { useState, useTransition } from 'react';
import { upsertHoleScore } from '@/app/actions/scores';

const DEFAULT_PAR = 4;

function clampStrokes(v: number): number {
  return Math.max(1, Math.min(15, v));
}

/** Golf vocabulary for a score relative to par. */
function relationLabel(diff: number): string {
  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double bogey';
  return `+${diff}`;
}

export default function ScoreEntry({
  foursomeId,
  holes,
  pars,
  yards,
  initialScores,
  canEdit,
  showHandicap = true,
  teamHcp,
  members,
}: {
  foursomeId: string;
  holes: number[];
  pars: Record<number, number>;
  yards: Record<number, number | null>;
  initialScores: Record<number, number>;
  canEdit: boolean;
  showHandicap?: boolean;
  teamHcp: number;
  members: { id: string; name: string; handicap: number | null }[];
}) {
  const [scores, setScores] = useState<Record<number, number | null>>(
    initialScores,
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const parFor = (hole: number) => pars[hole] ?? DEFAULT_PAR;

  function commit(hole: number, value: number | null) {
    setScores((prev) => ({ ...prev, [hole]: value }));
    startTransition(async () => {
      await upsertHoleScore(foursomeId, hole, value);
    });
  }

  function selectHole(hole: number) {
    if (!canEdit) return;
    setSelected(hole);
    // First tap on a blank hole starts it at par.
    if (scores[hole] == null) commit(hole, parFor(hole));
  }

  function adjust(delta: number) {
    if (selected == null) return;
    const cur = scores[selected] ?? parFor(selected);
    commit(selected, clampStrokes(cur + delta));
  }

  function clearHole() {
    if (selected == null) return;
    commit(selected, null);
  }

  const gross = Object.values(scores).reduce<number>(
    (a, v) => a + (typeof v === 'number' && v > 0 ? v : 0),
    0,
  );
  const net = gross > 0 ? gross - teamHcp : null;

  const selPar = selected != null ? parFor(selected) : DEFAULT_PAR;
  const selValue = selected != null ? scores[selected] ?? null : null;
  const selYards = selected != null ? yards[selected] ?? null : null;

  return (
    <div className="bg-[color:var(--color-cream)] border-t border-[color:#e8e2d2] px-3 py-3">
      <p className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)] font-semibold mb-2">
        Hole-by-Hole{' '}
        {!canEdit && (
          <span className="italic font-normal normal-case tracking-normal">
            · view only
          </span>
        )}
        {pending && (
          <span className="ml-2 italic font-normal normal-case tracking-normal">
            · saving…
          </span>
        )}
      </p>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${holes.length}, minmax(0,1fr))` }}
      >
        {holes.map((hole) => {
          const v = scores[hole];
          const score = typeof v === 'number' && v > 0 ? v : null;
          const diff = score != null ? score - parFor(hole) : null;
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
          const isSel = selected === hole;
          const boxClass = `w-full text-center text-sm font-semibold border rounded-md py-1.5 ${
            isSel
              ? 'border-[color:var(--color-gold)] ring-2 ring-[color:var(--color-gold)]'
              : 'border-[color:#e8e2d2]'
          }`;
          return (
            <div key={hole} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-[color:var(--color-mute)] font-semibold">
                {hole}
              </span>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => selectHole(hole)}
                  className={boxClass}
                  style={{ background: bg, color: fg }}
                >
                  {v ?? ''}
                </button>
              ) : (
                <div className={boxClass} style={{ background: bg, color: fg }}>
                  {v ?? '—'}
                </div>
              )}
              <span className="text-[8px] text-[color:var(--color-mute)]">
                {parFor(hole)}
              </span>
            </div>
          );
        })}
      </div>

      {canEdit &&
        (selected == null ? (
          <p className="mt-3 text-center text-[11px] text-[color:var(--color-mute)] italic">
            Tap a hole — it starts at par, then adjust with − / +.
          </p>
        ) : (
          <div className="mt-3 rounded-lg border border-[color:var(--color-gold)] bg-white p-3">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold text-center">
              Hole {selected} · Par {selPar}
              {selYards != null ? ` · ${selYards} yds` : ''}
            </p>
            <div className="mt-2 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => adjust(-1)}
                aria-label="One stroke under"
                className="ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] w-12 h-12 rounded-full text-2xl leading-none font-semibold"
              >
                −
              </button>
              <p
                className="text-4xl leading-none min-w-[2ch] text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {selValue ?? selPar}
              </p>
              <button
                type="button"
                onClick={() => adjust(1)}
                aria-label="One stroke over"
                className="ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] w-12 h-12 rounded-full text-2xl leading-none font-semibold"
              >
                +
              </button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)] font-semibold">
                {relationLabel((selValue ?? selPar) - selPar)}
              </span>
              {selValue != null && (
                <button
                  type="button"
                  onClick={clearHole}
                  className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)] underline hover:text-[color:var(--color-navy)]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        ))}

      {showHandicap ? (
        <div className="mt-3 pt-2 border-t border-[color:#e8e2d2] flex justify-around text-xs">
          <Stat label="Gross" value={gross || '—'} />
          <Stat label="− Hcp" value={teamHcp} />
          <Stat label="Net" value={net ?? '—'} highlight />
        </div>
      ) : (
        <div className="mt-3 pt-2 border-t border-[color:#e8e2d2] flex justify-around text-xs">
          <Stat label="Total" value={gross || '—'} highlight />
        </div>
      )}

      {showHandicap && (
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
                {m.name.split(' ')[0]} ·{' '}
                <strong className="text-[color:var(--color-ink)]">
                  {m.handicap ?? '—'}
                </strong>
              </span>
            ))}
          </div>
        </div>
      )}
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
