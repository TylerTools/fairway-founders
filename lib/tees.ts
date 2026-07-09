import { supabase } from './supabase';

export interface CourseTee {
  id: string;
  name: string;
  sortOrder: number;
  /** hole number → yards */
  yardages: Record<number, number>;
}

/** Round-level pin-placement overrides: teeId → hole → yards. */
export type RoundYardages = Record<string, Record<number, number>>;

function parseHoleMap(j: unknown): Record<number, number> {
  const out: Record<number, number> = {};
  if (j && typeof j === 'object' && !Array.isArray(j)) {
    for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
      const hole = Number(k);
      const yards = Number(v);
      if (Number.isFinite(hole) && Number.isFinite(yards)) out[hole] = yards;
    }
  }
  return out;
}

export function parseRoundYardages(j: unknown): RoundYardages {
  const out: RoundYardages = {};
  if (j && typeof j === 'object' && !Array.isArray(j)) {
    for (const [teeId, holes] of Object.entries(j as Record<string, unknown>)) {
      out[teeId] = parseHoleMap(holes);
    }
  }
  return out;
}

/** All tees defined on a course, with their base yardages. */
export async function getCourseTees(courseId: string): Promise<CourseTee[]> {
  const res = await supabase
    .from('course_tees')
    .select('id, name, sort_order, yardages')
    .eq('course_id', courseId)
    .order('sort_order')
    .order('name');
  return (res.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    sortOrder: t.sort_order,
    yardages: parseHoleMap(t.yardages),
  }));
}

/**
 * The yardage a group actually plays on a hole:
 *   round pin-placement override → tee base yardage → course_holes fallback → null
 */
export function resolveYardage(opts: {
  teeId: string | null;
  hole: number;
  tees: CourseTee[];
  roundYardages: RoundYardages;
  fallback?: number | null;
}): number | null {
  const { teeId, hole, tees, roundYardages, fallback } = opts;
  if (teeId) {
    const override = roundYardages[teeId]?.[hole];
    if (override != null) return override;
    const base = tees.find((t) => t.id === teeId)?.yardages[hole];
    if (base != null) return base;
  }
  return fallback ?? null;
}

export function teeName(teeId: string | null, tees: CourseTee[]): string | null {
  return teeId ? tees.find((t) => t.id === teeId)?.name ?? null : null;
}
