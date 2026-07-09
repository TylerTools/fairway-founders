'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { upsertHoleScore } from '@/app/actions/scores';
import { setScorecardSubmitted } from '@/app/actions/round';

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

/** Colored pip tint mirroring how holes read on a paper card. */
function tintFor(diff: number | null): { bg: string; fg: string } {
  if (diff == null) return { bg: '#fff', fg: '#5a5a4a' };
  if (diff < 0) return { bg: '#7c9885', fg: '#fff' };
  if (diff === 0) return { bg: '#f5f1e8', fg: '#1a3a2e' };
  if (diff === 1) return { bg: '#f0ebd8', fg: '#1a3a2e' };
  return { bg: '#a87c4f', fg: '#fff' };
}

export default function ScoreEntry({
  foursomeId,
  holes,
  pars,
  yards,
  initialScores,
  canEdit,
  submitted = false,
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
  submitted?: boolean;
  showHandicap?: boolean;
  teamHcp: number;
  members: { id: string; name: string; handicap: number | null }[];
}) {
  const [scores, setScores] = useState<Record<number, number | null>>(
    initialScores,
  );
  const parFor = (hole: number) => pars[hole] ?? DEFAULT_PAR;

  // The focused hole. Start at the first hole that hasn't been scored yet —
  // if the whole card is filled, land on the first hole so admins can review.
  const initialIdx = useMemo(() => {
    for (let i = 0; i < holes.length; i++) {
      if (initialScores[holes[i]] == null) return i;
    }
    return 0;
    // We intentionally only re-derive on mount — later state lives in `idx`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [idx, setIdx] = useState(initialIdx);
  const [pending, startTransition] = useTransition();
  const [showPlayers, setShowPlayers] = useState(false);

  const editable = canEdit && !submitted;
  const currentHole = holes[idx];
  const curValue = scores[currentHole] ?? null;
  const curPar = parFor(currentHole);
  const curYards = yards[currentHole] ?? null;
  const scoreShown = curValue ?? curPar;
  const diff = scoreShown - curPar;

  function commit(hole: number, value: number | null) {
    setScores((prev) => ({ ...prev, [hole]: value }));
    startTransition(async () => {
      await upsertHoleScore(foursomeId, hole, value);
    });
  }

  function ensureStarted() {
    if (!editable) return;
    if (curValue == null) commit(currentHole, curPar);
  }
  function adjust(delta: number) {
    if (!editable) return;
    const cur = scores[currentHole] ?? curPar;
    commit(currentHole, clampStrokes(cur + delta));
  }
  function clearHole() {
    if (!editable) return;
    commit(currentHole, null);
  }
  function goto(nextIdx: number) {
    const clamped = Math.max(0, Math.min(holes.length - 1, nextIdx));
    setIdx(clamped);
  }
  function setSubmitted(value: boolean) {
    startTransition(async () => {
      await setScorecardSubmitted(foursomeId, value);
    });
  }

  // Touch swipe left/right → next/prev hole. Threshold ~40px.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    swipe.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) goto(idx + 1);
    else goto(idx - 1);
  }

  // Keyboard arrows for admin desktop review.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') goto(idx - 1);
      else if (e.key === 'ArrowRight') goto(idx + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, holes.length]);

  const gross = Object.values(scores).reduce<number>(
    (a, v) => a + (typeof v === 'number' && v > 0 ? v : 0),
    0,
  );
  const net = gross > 0 ? gross - teamHcp : null;
  const holesIn = Object.values(scores).filter(
    (v) => typeof v === 'number' && v > 0,
  ).length;

  return (
    <div className="bg-[color:var(--color-cream)] border-t border-[color:#e8e2d2] px-4 py-4">
      {/* Focused hole card */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="rounded-xl bg-white border border-[color:#e8e2d2] ff-card p-5 select-none"
      >
        <div className="flex items-baseline justify-between">
          <p
            className="text-3xl leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Hole {currentHole}
          </p>
          <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
            {idx + 1} / {holes.length}
          </p>
        </div>
        <p className="mt-1 text-[11px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
          Par {curPar}
          {curYards != null ? ` · ${curYards.toLocaleString('en-US')} yds` : ''}
        </p>

        <div className="mt-5 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => adjust(-1)}
            disabled={!editable}
            aria-label="One stroke under"
            className="ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] w-14 h-14 rounded-full text-3xl leading-none font-semibold disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            onClick={ensureStarted}
            disabled={!editable && curValue == null}
            className="text-center disabled:cursor-default"
          >
            <p
              className="text-6xl leading-none min-w-[2ch]"
              style={{
                fontFamily: 'var(--font-display)',
                color: curValue != null ? '#1a3a2e' : '#a8a596',
              }}
            >
              {curValue ?? (editable ? curPar : '—')}
            </p>
          </button>
          <button
            type="button"
            onClick={() => adjust(1)}
            disabled={!editable}
            aria-label="One stroke over"
            className="ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] w-14 h-14 rounded-full text-3xl leading-none font-semibold disabled:opacity-40"
          >
            +
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4">
          <span className="text-[11px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-mute)]">
            {curValue != null ? relationLabel(diff) : editable ? 'Tap to start' : '—'}
          </span>
          {editable && curValue != null && (
            <button
              type="button"
              onClick={clearHole}
              className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)] underline hover:text-[color:var(--color-navy)]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => goto(idx - 1)}
            disabled={idx === 0}
            className="rounded-lg border border-[color:#e8e2d2] bg-white py-2.5 text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-navy)] disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => goto(idx + 1)}
            disabled={idx === holes.length - 1}
            className="rounded-lg ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-2.5 text-[11px] tracking-[0.08em] uppercase font-semibold disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Hole progress strip — small pips reflecting the card so far. */}
      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {holes.map((hole, i) => {
          const v = scores[hole];
          const scored = typeof v === 'number' && v > 0;
          const tint = tintFor(scored ? (v as number) - parFor(hole) : null);
          const active = i === idx;
          return (
            <button
              key={hole}
              type="button"
              onClick={() => goto(i)}
              aria-label={`Go to hole ${hole}`}
              className={`min-w-[2rem] rounded-md border py-1 text-[11px] font-semibold ${
                active
                  ? 'border-[color:var(--color-gold)] ring-2 ring-[color:var(--color-gold)]'
                  : 'border-[color:#e8e2d2]'
              }`}
              style={{ background: tint.bg, color: tint.fg }}
            >
              {scored ? v : hole}
            </button>
          );
        })}
      </div>

      {/* Totals + submit chrome */}
      <div className="mt-4 pt-3 border-t border-[color:#e8e2d2]">
        {showHandicap ? (
          <div className="flex justify-around text-xs">
            <Stat label="Thru" value={holesIn || '—'} />
            <Stat label="Gross" value={gross || '—'} />
            <Stat label="− Hcp" value={teamHcp} />
            <Stat label="Net" value={net ?? '—'} highlight />
          </div>
        ) : (
          <div className="flex justify-around text-xs">
            <Stat label="Thru" value={holesIn || '—'} />
            <Stat label="Total" value={gross || '—'} highlight />
          </div>
        )}
      </div>

      {(pending || submitted || (!canEdit && !submitted)) && (
        <p className="mt-2 text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)] font-semibold text-center italic">
          {submitted
            ? 'submitted'
            : pending
              ? 'saving…'
              : !canEdit
                ? 'view only'
                : ''}
        </p>
      )}

      {showHandicap && members.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPlayers((s) => !s)}
            className="text-[10px] tracking-[0.12em] uppercase font-semibold text-[color:var(--color-gold)]"
          >
            {showPlayers ? '▾ Hide players' : '▸ Show players'}
          </button>
          {showPlayers && (
            <div className="mt-2 flex flex-wrap gap-1.5">
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
          )}
        </div>
      )}

      {canEdit && (
        <div className="mt-3 pt-3 border-t border-[color:#e8e2d2]">
          {submitted ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-gold)]">
                ✓ Scorecard submitted
              </span>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                disabled={pending}
                className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)] underline hover:text-[color:var(--color-navy)]"
              >
                Reopen to edit
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={pending}
              className="w-full rounded-lg ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
            >
              Submit scorecard
            </button>
          )}
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
