'use client';

import { useState, useTransition } from 'react';
import { saveCourseHoles, type HoleInput } from '@/app/actions/holes';

interface Existing {
  hole: number;
  par: number;
  yards: number | null;
}

/** Per-course hole editor: par (3–6) + yards for holes 1–18. Reused by
 *  every round scheduled at this course. */
export default function HolesEditor({
  courseId,
  holes,
}: {
  courseId: string;
  holes: Existing[];
}) {
  const initial: Record<number, { par: string; yards: string }> = {};
  for (let h = 1; h <= 18; h++) {
    const row = holes.find((x) => x.hole === h);
    initial[h] = {
      par: row?.par ? String(row.par) : '4',
      yards: row?.yards != null ? String(row.yards) : '',
    };
  }
  const [state, setState] = useState(initial);
  const [saving, startSave] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function setPar(h: number, par: string) {
    setState((s) => ({ ...s, [h]: { ...s[h], par } }));
  }
  function setYards(h: number, yards: string) {
    setState((s) => ({ ...s, [h]: { ...s[h], yards } }));
  }

  function onSave() {
    setMsg(null);
    setErr(null);
    const payload: HoleInput[] = [];
    for (let h = 1; h <= 18; h++) {
      const row = state[h];
      const par = parseInt(row.par, 10);
      if (!Number.isFinite(par)) continue;
      const yardsStr = row.yards.trim();
      const yards = yardsStr === '' ? null : parseInt(yardsStr, 10);
      payload.push({ hole: h, par, yards });
    }
    startSave(async () => {
      const res = await saveCourseHoles(courseId, payload);
      if (!res.ok) setErr(res.error ?? 'Could not save.');
      else setMsg('Saved.');
    });
  }

  const front = Array.from({ length: 9 }, (_, i) => i + 1);
  const back = Array.from({ length: 9 }, (_, i) => i + 10);
  const frontYards = front.reduce(
    (sum, h) => sum + (parseInt(state[h].yards, 10) || 0),
    0,
  );
  const backYards = back.reduce(
    (sum, h) => sum + (parseInt(state[h].yards, 10) || 0),
    0,
  );
  const frontPar = front.reduce(
    (sum, h) => sum + (parseInt(state[h].par, 10) || 0),
    0,
  );
  const backPar = back.reduce(
    (sum, h) => sum + (parseInt(state[h].par, 10) || 0),
    0,
  );

  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 space-y-4">
      <Nine
        label="Front 9"
        holes={front}
        state={state}
        setPar={setPar}
        setYards={setYards}
        totalPar={frontPar}
        totalYards={frontYards}
      />
      <Nine
        label="Back 9"
        holes={back}
        state={state}
        setPar={setPar}
        setYards={setYards}
        totalPar={backPar}
        totalYards={backYards}
      />
      <div className="flex items-center justify-between pt-2">
        <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          18-hole · Par {frontPar + backPar}
          {frontYards + backYards > 0
            ? ` · ${(frontYards + backYards).toLocaleString('en-US')} yds`
            : ''}
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-md ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save holes'}
        </button>
      </div>
      {err && <p className="text-xs text-[color:#a13c3c]">{err}</p>}
      {msg && !err && (
        <p className="text-xs text-[color:#5a5a4a] italic">{msg}</p>
      )}
    </div>
  );
}

function Nine({
  label,
  holes,
  state,
  setPar,
  setYards,
  totalPar,
  totalYards,
}: {
  label: string;
  holes: number[];
  state: Record<number, { par: string; yards: string }>;
  setPar: (h: number, v: string) => void;
  setYards: (h: number, v: string) => void;
  totalPar: number;
  totalYards: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          {label}
        </p>
        <p className="text-[10px] tracking-[0.08em] uppercase text-[color:var(--color-mute)]">
          Par {totalPar}
          {totalYards > 0
            ? ` · ${totalYards.toLocaleString('en-US')} yds`
            : ''}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[9px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
              <th className="text-left font-semibold py-1 pr-2">Hole</th>
              {holes.map((h) => (
                <th key={h} className="font-semibold py-1 px-1 text-center">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-mute)] py-1 pr-2">
                Par
              </td>
              {holes.map((h) => (
                <td key={h} className="p-0.5">
                  <select
                    value={state[h].par}
                    onChange={(e) => setPar(h, e.target.value)}
                    className="w-full border border-[color:#e8e2d2] rounded-md text-center py-1 bg-white text-xs focus:outline-none focus:border-[color:var(--color-gold)]"
                  >
                    {[3, 4, 5, 6].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
            <tr>
              <td className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-mute)] py-1 pr-2">
                Yards
              </td>
              {holes.map((h) => (
                <td key={h} className="p-0.5">
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={state[h].yards}
                    onChange={(e) =>
                      setYards(h, e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="—"
                    className="w-full min-w-[3.25rem] border border-[color:#e8e2d2] rounded-md text-center py-1 bg-white text-xs focus:outline-none focus:border-[color:var(--color-gold)]"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
