'use client';

import { useState, useTransition } from 'react';
import { createTestGame } from '@/app/actions/test-game';
import { saveCourseHoles, type HoleInput } from '@/app/actions/holes';

interface Course {
  id: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
  professional_role: string | null;
}

interface HoleMeta {
  hole: number;
  par: number;
  yards: number | null;
}

type HoleState = Record<number, { par: number; yards: string }>;

const PAR_CHOICES = [3, 4, 5];

export default function TestGameForm({
  courses,
  members,
  holeNumbers,
  holesByCourse,
}: {
  courses: Course[];
  members: Member[];
  holeNumbers: number[];
  holesByCourse: Record<string, HoleMeta[]>;
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [holeState, setHoleState] = useState<HoleState>(() =>
    holesFor(courses[0]?.id ?? ''),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function holesFor(cid: string): HoleState {
    const existing = holesByCourse[cid] ?? [];
    const map: HoleState = {};
    for (const h of holeNumbers) {
      const found = existing.find((e) => e.hole === h);
      map[h] = {
        par: found?.par ?? 4,
        yards: found?.yards != null ? String(found.yards) : '',
      };
    }
    return map;
  }

  function changeCourse(id: string) {
    setCourseId(id);
    setHoleState(holesFor(id));
    setSaved(null);
  }

  function setPar(hole: number, par: number) {
    setHoleState((prev) => ({ ...prev, [hole]: { ...prev[hole], par } }));
    setSaved(null);
  }

  function setYards(hole: number, yards: string) {
    setHoleState((prev) => ({ ...prev, [hole]: { ...prev[hole], yards } }));
    setSaved(null);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function holesPayload(): HoleInput[] {
    return holeNumbers.map((h) => ({
      hole: h,
      par: holeState[h]?.par ?? 4,
      yards:
        !holeState[h]?.yards || holeState[h].yards.trim() === ''
          ? null
          : parseInt(holeState[h].yards, 10),
    }));
  }

  function saveHoles() {
    setError(null);
    setSaved(null);
    if (!courseId) return setError('Pick a course.');
    startTransition(async () => {
      const res = await saveCourseHoles(courseId, holesPayload());
      if (!res.ok) setError(res.error ?? 'Could not save hole details.');
      else setSaved('Hole details saved to this course.');
    });
  }

  function start() {
    setError(null);
    setSaved(null);
    const ids = [...selected];
    if (!courseId) return setError('Pick a course.');
    if (ids.length < 2) return setError('Pick at least 2 players.');
    startTransition(async () => {
      // On success the action redirects to the leaderboard; only failures return.
      const res = await createTestGame(courseId, ids, holesPayload());
      if (res && !res.ok) setError(res.error ?? 'Something went wrong.');
    });
  }

  const count = selected.size;

  return (
    <div>
      {/* Course */}
      <label className="block">
        <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          Course
        </span>
        <select
          value={courseId}
          onChange={(e) => changeCourse(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2.5 text-sm focus:border-[color:var(--color-gold)] focus:outline-none"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {/* Holes: par + yardage */}
      <div className="mt-6">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          Holes · par &amp; yardage
        </p>
        <p className="mt-1 text-[11px] text-[color:var(--color-mute)] leading-relaxed">
          Saved to the course and reused every round. Scoring starts each hole at par.
        </p>
        <div className="mt-2 rounded-xl border border-[color:#e8e2d2] bg-white ff-card divide-y divide-[color:#f0ebd8]">
          {holeNumbers.map((h) => (
            <div key={h} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-8 text-[11px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-mute)]">
                H{h}
              </span>
              <div className="flex rounded-md overflow-hidden border border-[color:#e8e2d2]">
                {PAR_CHOICES.map((p, i) => {
                  const active = (holeState[h]?.par ?? 4) === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPar(h, p)}
                      className={`px-3 py-1.5 text-sm font-semibold ${
                        i > 0 ? 'border-l border-[color:#e8e2d2]' : ''
                      } ${
                        active
                          ? 'bg-[color:var(--color-navy)] text-[color:var(--color-gold)]'
                          : 'bg-white text-[color:var(--color-navy)]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
                par
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={holeState[h]?.yards ?? ''}
                onChange={(e) => setYards(h, e.target.value)}
                placeholder="—"
                className="ml-auto w-20 rounded-md border border-[color:#e8e2d2] bg-white px-2 py-1.5 text-sm text-right focus:border-[color:var(--color-gold)] focus:outline-none"
              />
              <span className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
                yds
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={saveHoles}
          disabled={pending || !courseId}
          className="mt-2 rounded-lg ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] px-4 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          Save hole details
        </button>
        {saved && (
          <span className="ml-3 text-[12px] text-[color:#5a5a4a]">✓ {saved}</span>
        )}
      </div>

      {/* Players */}
      <div className="mt-6">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          Players · {count} selected
        </p>
        {members.length === 0 ? (
          <p className="mt-2 text-sm text-[color:#5a5a4a]">
            No approved members to pick from yet.
          </p>
        ) : (
          <div className="mt-2 rounded-xl border border-[color:#e8e2d2] bg-white ff-card">
            <ul className="divide-y divide-[color:#f0ebd8] max-h-96 overflow-y-auto">
              {members.map((m) => {
                const checked = selected.has(m.id);
                return (
                  <li key={m.id}>
                    <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(m.id)}
                        disabled={pending}
                        className="w-4 h-4 accent-[color:var(--color-navy)] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight">
                          {m.name}
                        </p>
                        {m.professional_role && (
                          <p className="text-[11px] text-[color:var(--color-mute)]">
                            {m.professional_role}
                          </p>
                        )}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-[13px] text-[color:#a13c3c]">{error}</p>}

      <button
        type="button"
        onClick={start}
        disabled={pending || count < 2 || !courseId}
        className="mt-5 w-full rounded-lg ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-3 text-sm font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
      >
        {pending
          ? 'Building…'
          : `Start test game · ${count} player${count === 1 ? '' : 's'}`}
      </button>

      <p className="mt-3 text-[11px] text-[color:var(--color-mute)] leading-relaxed text-center">
        Eight players make two teams of four. Groups drop the moment you start.
      </p>
    </div>
  );
}
