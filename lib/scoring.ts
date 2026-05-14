/** USGA scramble team handicap: 25/20/15/10% of low/2nd/3rd/4th handicap, summed. */
export function teamHandicap(handicaps: (number | null)[], holesPlayed: number): number {
  if (!handicaps.length) return 0;
  const sorted = handicaps.map((h) => h ?? 0).sort((a, b) => a - b);
  const weights = [0.25, 0.2, 0.15, 0.1];
  let sum = 0;
  for (let i = 0; i < sorted.length; i++) sum += sorted[i] * (weights[i] ?? 0);
  if (sorted.length < 4) {
    const usedWeight = weights.slice(0, sorted.length).reduce((a, b) => a + b, 0);
    sum = (sum / usedWeight) * 0.7;
  }
  return Math.round(sum * (holesPlayed / 18));
}

export interface FoursomeForScoring {
  id: string;
  hole: number;
  tier: 'A' | 'B' | 'C';
  groupIndex: number;
  members: { id: string; name: string; handicap: number | null }[];
  /** Map of hole number → strokes. */
  scores: Record<number, number>;
}

export interface LeaderboardRow {
  foursome: FoursomeForScoring;
  teamHcp: number;
  holesIn: number;
  gross: number;
  net: number | null;
  projectedNet: number | null;
  toPar: number | null;
  rank: number | null;
}

export function buildLeaderboard(
  foursomes: FoursomeForScoring[],
  holesPlayed: number,
): LeaderboardRow[] {
  const par = holesPlayed === 9 ? 36 : 72;
  const rows: LeaderboardRow[] = foursomes.map((f) => {
    const hcp = teamHandicap(f.members.map((m) => m.handicap), holesPlayed);
    const strokes = Object.values(f.scores).filter((v) => typeof v === 'number' && v > 0);
    const gross = strokes.reduce((a, h) => a + h, 0);
    const holesIn = strokes.length;
    const projectedGross =
      holesIn > 0 ? Math.round((gross * holesPlayed) / holesIn) : null;
    const net = gross > 0 ? gross - hcp : null;
    const projectedNet = projectedGross != null ? projectedGross - hcp : null;
    const toPar = net != null ? net - par : null;
    return {
      foursome: f,
      teamHcp: hcp,
      holesIn,
      gross,
      net,
      projectedNet,
      toPar,
      rank: null,
    };
  });

  rows.sort((a, b) => {
    if (a.holesIn === 0 && b.holesIn === 0) return a.foursome.groupIndex - b.foursome.groupIndex;
    if (a.holesIn === 0) return 1;
    if (b.holesIn === 0) return -1;
    return (a.projectedNet ?? 9999) - (b.projectedNet ?? 9999);
  });

  let r = 1;
  for (const row of rows) {
    if (row.holesIn > 0) {
      row.rank = r++;
    }
  }
  return rows;
}

export function fmtToPar(toPar: number | null): string {
  if (toPar == null) return '—';
  if (toPar === 0) return 'E';
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
}
