'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { setLeagueContext } from '@/app/actions/league-context';

export interface LeagueSwitcherLeague {
  id: string;
  name: string;
  short_name: string | null;
}

export default function LeagueSwitcher({
  current,
  options,
  variant = 'header',
}: {
  current: LeagueSwitcherLeague;
  options: LeagueSwitcherLeague[];
  /** 'header' is the small chip in the app header; 'inline' is the larger
   *  cockpit pill (gold hairline, always visible, used on /admin landing). */
  variant?: 'header' | 'inline';
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  if (options.length <= 1) {
    // Header chip falls back to a small static label so the user still knows
    // which league they're in. Inline variant hides — the cockpit already
    // shows the league name in its headline so a non-clickable echo is noise.
    if (variant === 'inline') return null;
    return (
      <span className="hidden sm:inline-flex items-center text-[10px] tracking-[0.12em] uppercase font-semibold text-[color:var(--color-mute)]">
        {current.short_name ?? current.name}
      </span>
    );
  }

  function pick(leagueId: string) {
    setOpen(false);
    if (leagueId === current.id) return;
    startTransition(async () => {
      await setLeagueContext(leagueId);
      if (typeof window !== 'undefined') window.location.assign(window.location.pathname);
    });
  }

  const buttonClass =
    variant === 'inline'
      ? 'inline-flex items-center gap-2 rounded-full border border-[color:var(--color-gold)] bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--color-navy)] hover:bg-[color:#f5f1e8]/40 disabled:opacity-60'
      : 'inline-flex items-center gap-1.5 rounded-full border border-[color:#e8e2d2] bg-white px-3 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-[color:var(--color-ink)] hover:border-[color:var(--color-gold)] disabled:opacity-60';
  const labelPrefix = variant === 'inline' ? 'Switch league · ' : '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={buttonClass}
      >
        <span>
          {labelPrefix}
          {current.short_name ?? current.name}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 min-w-[200px] rounded-lg border border-[color:#e8e2d2] bg-white shadow-lg z-30">
          {options.map((l) => {
            const isActive = l.id === current.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => pick(l.id)}
                className={`block w-full text-left px-3 py-2 text-xs font-medium ${
                  isActive
                    ? 'bg-[color:var(--color-navy)] text-[color:var(--color-gold)]'
                    : 'text-[color:var(--color-ink)] hover:bg-[color:#f5f1e8]/40'
                }`}
              >
                {l.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
