'use client';

import { useState, useTransition } from 'react';
import { createTestGame } from '@/app/actions/test-game';

interface Course {
  id: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
  professional_role: string | null;
}

export default function TestGameForm({
  courses,
  members,
}: {
  courses: Course[];
  members: Member[];
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function start() {
    setError(null);
    const ids = [...selected];
    if (!courseId) return setError('Pick a course.');
    if (ids.length < 2) return setError('Pick at least 2 players.');
    startTransition(async () => {
      // On success the action redirects to the leaderboard; only failures return.
      const res = await createTestGame(courseId, ids);
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
          onChange={(e) => setCourseId(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2.5 text-sm focus:border-[color:var(--color-gold)] focus:outline-none"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

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

      {error && (
        <p className="mt-4 text-[13px] text-[color:#a13c3c]">{error}</p>
      )}

      <button
        type="button"
        onClick={start}
        disabled={pending || count < 2 || !courseId}
        className="mt-5 w-full rounded-lg ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-3 text-sm font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
      >
        {pending ? 'Building…' : `Start test game · ${count} player${count === 1 ? '' : 's'}`}
      </button>

      <p className="mt-3 text-[11px] text-[color:var(--color-mute)] leading-relaxed text-center">
        Eight players make two teams of four. Groups drop the moment you start.
      </p>
    </div>
  );
}
