import { supabase } from './supabase';

export interface HoleMeta {
  hole: number;
  par: number;
  yards: number | null;
}

/** Par used for any hole that hasn't been configured on the course yet. */
export const DEFAULT_PAR = 4;

/** Per-course hole pars/yardages, ordered by hole number. */
export async function getCourseHoles(courseId: string): Promise<HoleMeta[]> {
  const res = await supabase
    .from('course_holes')
    .select('hole, par, yards')
    .eq('course_id', courseId)
    .order('hole');
  return res.data ?? [];
}

/** Map hole number → par (falling back to DEFAULT_PAR). */
export function parByHole(holes: HoleMeta[]): Record<number, number> {
  const m: Record<number, number> = {};
  for (const h of holes) m[h.hole] = h.par;
  return m;
}

/** Total par across the given holes, using DEFAULT_PAR for unconfigured ones. */
export function totalPar(pars: Record<number, number>, holes: number[]): number {
  return holes.reduce((sum, h) => sum + (pars[h] ?? DEFAULT_PAR), 0);
}
