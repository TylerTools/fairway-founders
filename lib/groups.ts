import type { Database } from './database.types';
import { COURSE_OPTIONS, type CourseConfig } from './schedule';

type UserRow = Database['public']['Tables']['users']['Row'];

export type PairKey = `${string}-${string}`;
export const pairKey = (a: string, b: string): PairKey =>
  ([a, b].sort().join('-')) as PairKey;

export type PairingHistory = Map<PairKey, number>;

/** Per-event cart-partner requests: requester userId → requested partner userId. */
export type CartRequests = Map<string, string>;

type RequestKind = 'mutual' | 'oneway';

/**
 * Tunable weights for cart-partner requests. Costs are additive and lower is
 * better, on the same scale as the repeat-pairing (×10) and industry-clump
 * (×15) penalties. A mutual request (both members picked each other) is favored
 * strongly; a one-way request is a gentle nudge. Nothing is ever guaranteed.
 */
const CART_REQUEST = {
  // Added to the group score when a requested pair lands in DIFFERENT groups
  // (they can't share a cart unless they're in the same group first).
  MUTUAL_SPLIT_PENALTY: 50,
  ONEWAY_SPLIT_PENALTY: 12,
  // Subtracted from a within-foursome cart split that keeps the pair together.
  MUTUAL_CART_REWARD: 100,
  ONEWAY_CART_REWARD: 8,
} as const;

interface DesiredPairs {
  list: { a: string; b: string; kind: RequestKind }[];
  map: Map<PairKey, RequestKind>;
}

/** Collapse directed requests into unordered desired pairs, marking each as
 *  mutual (both directions present) or one-way. Built without splitting the
 *  pair key (UUIDs contain '-', so the key isn't safely splittable). */
function buildDesiredPairs(requests: CartRequests): DesiredPairs {
  const map = new Map<PairKey, RequestKind>();
  const list: { a: string; b: string; kind: RequestKind }[] = [];
  for (const [a, b] of requests) {
    if (!b || a === b) continue;
    const key = pairKey(a, b);
    const kind: RequestKind = requests.get(b) === a ? 'mutual' : 'oneway';
    const prev = map.get(key);
    if (prev === undefined) {
      map.set(key, kind);
      list.push({ a, b, kind });
    } else if (kind === 'mutual' && prev !== 'mutual') {
      // 'mutual' is strictly stronger — upgrade if seen from the other side.
      map.set(key, 'mutual');
      const entry = list.find((e) => pairKey(e.a, e.b) === key);
      if (entry) entry.kind = 'mutual';
    }
  }
  return { list, map };
}

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

function scoreGroups(
  groups: UserRow[][],
  history: PairingHistory,
  desired: DesiredPairs,
): number {
  let score = 0;
  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        score += (history.get(pairKey(group[i].id, group[j].id)) ?? 0) * 10;
      }
    }
    // Spread industries across the table (the networking goal). Fall back to
    // free-text role, then 'unknown', when a member hasn't set an industry.
    const industryCount: Record<string, number> = {};
    for (const m of group) {
      const key = m.industry ?? m.professional_role ?? 'unknown';
      industryCount[key] = (industryCount[key] ?? 0) + 1;
    }
    for (const c of Object.values(industryCount)) if (c > 1) score += (c - 1) * 15;
  }

  // Cart-partner requests: penalize requested pairs that land in different
  // groups — they can't share a cart unless grouped together first.
  if (desired.list.length > 0) {
    const groupOf = new Map<string, number>();
    groups.forEach((g, gi) => g.forEach((m) => groupOf.set(m.id, gi)));
    for (const { a, b, kind } of desired.list) {
      const ga = groupOf.get(a);
      const gb = groupOf.get(b);
      if (ga === undefined || gb === undefined) continue; // one isn't playing
      if (ga !== gb) {
        score +=
          kind === 'mutual'
            ? CART_REQUEST.MUTUAL_SPLIT_PENALTY
            : CART_REQUEST.ONEWAY_SPLIT_PENALTY;
      }
    }
  }
  return score;
}

function assignCartPairs(
  group: UserRow[],
  history: PairingHistory,
  desired: Map<PairKey, RequestKind>,
): UserRow[][] {
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
    for (const cart of split) {
      const key = pairKey(cart[0].id, cart[1].id);
      s += history.get(key) ?? 0;
      // Reward keeping a requested pair in the same cart.
      const want = desired.get(key);
      if (want === 'mutual') s -= CART_REQUEST.MUTUAL_CART_REWARD;
      else if (want === 'oneway') s -= CART_REQUEST.ONEWAY_CART_REWARD;
    }
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
  requests: CartRequests = new Map(),
): GenerationResult | null {
  const sizes = partitionSizes(members.length);
  if (!sizes) return null;
  const desired = buildDesiredPairs(requests);
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
    const s = scoreGroups(groups, history, desired);
    if (s < bestScore) {
      bestScore = s;
      bestGroups = groups;
    }
  }
  if (!bestGroups) return null;
  const holeAssignments = assignHoles(bestGroups.length, courseConfig);
  let cartCounter = 1;
  const foursomes: GeneratedFoursome[] = bestGroups.map((group, i) => {
    const cartPairs = assignCartPairs(group, history, desired.map);
    const carts = cartPairs.map((pair) => ({ number: cartCounter++, members: pair }));
    return { members: group, carts, ...holeAssignments[i] };
  });
  return { foursomes, score: bestScore, sizes };
}
