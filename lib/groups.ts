import type { Database } from './database.types';
import { COURSE_OPTIONS, type CourseConfig } from './schedule';

type UserRow = Database['public']['Tables']['users']['Row'];

export type PairKey = `${string}-${string}`;
export const pairKey = (a: string, b: string): PairKey =>
  ([a, b].sort().join('-')) as PairKey;

export type PairingHistory = Map<PairKey, number>;

export interface HoleAssignment {
  hole: number;
  tier: 'A' | 'B' | 'C';
  hasTier: boolean;
}

export interface GeneratedFoursome {
  members: UserRow[];
  carts: { number: number; members: UserRow[] }[];
  hole: number;
  tier: 'A' | 'B' | 'C';
  hasTier: boolean;
}

export interface GenerationResult {
  foursomes: GeneratedFoursome[];
  score: number;
  sizes: number[];
}

export function partitionSizes(n: number): number[] | null {
  if (n < 2) return null;
  if (n === 2) return [2];
  if (n === 3) return [3];
  if (n === 5) return [3, 2];
  const r = n % 4;
  if (r === 0) return Array(n / 4).fill(4);
  if (r === 3) return [...Array((n - 3) / 4).fill(4), 3];
  if (r === 2) return [...Array(Math.floor(n / 4) - 1).fill(4), 3, 3];
  if (r === 1) return [...Array((n - 9) / 4).fill(4), 3, 3, 3];
  return null;
}

export function describePartition(sizes: number[]): string {
  const c: Record<number, number> = {};
  for (const s of sizes) c[s] = (c[s] ?? 0) + 1;
  const parts: string[] = [];
  if (c[4]) parts.push(`${c[4]} foursome${c[4] > 1 ? 's' : ''}`);
  if (c[3]) parts.push(`${c[3]} trio${c[3] > 1 ? 's' : ''}`);
  if (c[2]) parts.push(`${c[2]} pair${c[2] > 1 ? 's' : ''}`);
  return parts.join(' + ');
}

export function assignHoles(
  numFoursomes: number,
  courseConfig: CourseConfig = 'front',
): HoleAssignment[] {
  const available = COURSE_OPTIONS[courseConfig].holes;
  return Array.from({ length: numFoursomes }, (_, i) => {
    const tierIdx = Math.floor(i / available.length);
    const holeIdx = i % available.length;
    const tier = (['A', 'B', 'C'] as const)[tierIdx] ?? 'A';
    return { hole: available[holeIdx], tier, hasTier: tierIdx > 0 };
  });
}

function scoreGroups(groups: UserRow[][], history: PairingHistory): number {
  let score = 0;
  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        score += (history.get(pairKey(group[i].id, group[j].id)) ?? 0) * 10;
      }
    }
    const roleCount: Record<string, number> = {};
    for (const m of group) {
      const r = m.professional_role ?? 'unknown';
      roleCount[r] = (roleCount[r] ?? 0) + 1;
    }
    for (const c of Object.values(roleCount)) if (c > 1) score += (c - 1) * 15;
  }
  return score;
}

function assignCartPairs(group: UserRow[], history: PairingHistory): UserRow[][] {
  if (group.length < 2) return [group];
  if (group.length === 2) return [group];
  if (group.length === 3) return [[group[0], group[1]], [group[2]]];
  const [a, b, c, d] = group;
  const splits = [
    [[a, b], [c, d]],
    [[a, c], [b, d]],
    [[a, d], [b, c]],
  ];
  let best = splits[0];
  let bestScore = Infinity;
  for (const split of splits) {
    let s = 0;
    for (const cart of split) s += history.get(pairKey(cart[0].id, cart[1].id)) ?? 0;
    if (s < bestScore) {
      bestScore = s;
      best = split;
    }
  }
  return best;
}

export function generateGroups(
  members: UserRow[],
  history: PairingHistory,
  courseConfig: CourseConfig = 'front',
): GenerationResult | null {
  const sizes = partitionSizes(members.length);
  if (!sizes) return null;
  let bestGroups: UserRow[][] | null = null;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < 250; attempt++) {
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const groups: UserRow[][] = [];
    let offset = 0;
    for (const sz of sizes) {
      groups.push(shuffled.slice(offset, offset + sz));
      offset += sz;
    }
    const s = scoreGroups(groups, history);
    if (s < bestScore) {
      bestScore = s;
      bestGroups = groups;
    }
  }
  if (!bestGroups) return null;
  const holeAssignments = assignHoles(bestGroups.length, courseConfig);
  let cartCounter = 1;
  const foursomes: GeneratedFoursome[] = bestGroups.map((group, i) => {
    const cartPairs = assignCartPairs(group, history);
    const carts = cartPairs.map((pair) => ({ number: cartCounter++, members: pair }));
    return { members: group, carts, ...holeAssignments[i] };
  });
  return { foursomes, score: bestScore, sizes };
}
