import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { COURSE_OPTIONS } from '@/lib/schedule';
import {
  buildLeaderboard,
  fmtToPar,
  type FoursomeForScoring,
} from '@/lib/scoring';
import LeaderboardRow, { type LeaderboardRowData } from './LeaderboardRow';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const me = await getAppUser();
  const canEdit = me?.app_role === 'admin';

  const eventRes = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();
  const event = eventRes.data;

  if (!event) {
    return (
      <main className="px-6 py-12 max-w-md mx-auto text-center">
        <p className="text-sm text-[color:#5a5a4a]">No event scheduled yet.</p>
      </main>
    );
  }

  const cfg = COURSE_OPTIONS[event.course_config];
  const holes = cfg.holes;
  const par = holes.length === 9 ? 36 : 72;

  const foursomeRes = await supabase
    .from('foursomes')
    .select(
      'id, hole, tier, group_index, foursome_members(user:user_id(id, name, handicap))',
    )
    .eq('event_id', event.id)
    .order('group_index');

  const foursomeRows = foursomeRes.data ?? [];

  const foursomeIds = foursomeRows.map((f) => f.id);
  const scoresByFoursome: Record<string, Record<number, number>> = {};
  if (foursomeIds.length) {
    const scoreRes = await supabase
      .from('hole_scores')
      .select('foursome_id, hole, strokes')
      .in('foursome_id', foursomeIds);
    for (const s of scoreRes.data ?? []) {
      const map = scoresByFoursome[s.foursome_id] ?? {};
      map[s.hole] = s.strokes;
      scoresByFoursome[s.foursome_id] = map;
    }
  }

  const foursomes: FoursomeForScoring[] = foursomeRows.map((f) => ({
    id: f.id,
    hole: f.hole,
    tier: f.tier,
    groupIndex: f.group_index,
    members: (f.foursome_members ?? [])
      .map((m) => {
        const u = Array.isArray(m.user) ? m.user[0] : m.user;
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          handicap: u.handicap != null ? Number(u.handicap) : null,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null),
    scores: scoresByFoursome[f.id] ?? {},
  }));

  const ranked = buildLeaderboard(foursomes, holes.length);

  const rows: LeaderboardRowData[] = ranked.map((r) => ({
    foursomeId: r.foursome.id,
    hole: r.foursome.hole,
    tier: r.foursome.tier,
    hasTier: r.foursome.tier !== 'A',
    groupIndex: r.foursome.groupIndex,
    teamHcp: r.teamHcp,
    holesIn: r.holesIn,
    net: r.net,
    toPar: r.toPar,
    rank: r.rank,
    isMine: me ? r.foursome.members.some((m) => m.id === me.id) : false,
    memberNames: r.foursome.members.map((m) => m.name),
    members: r.foursome.members,
    scores: r.foursome.scores,
  }));

  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const anyScores = rows.some((r) => r.holesIn > 0);
  const myRow = rows.find((r) => r.isMine);

  if (foursomes.length === 0) {
    return (
      <main className="px-6 py-12 max-w-md mx-auto text-center">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
          Leaderboard
        </p>
        <h1
          className="mt-2 text-2xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Leaderboard not yet live
        </h1>
        <p className="mt-3 text-sm text-[color:#5a5a4a]">
          Once admin generates groups and scoring opens, results post here in real time.
        </p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        Leaderboard · Live
      </p>
      <h1
        className="mt-1 text-2xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {dateStr}
      </h1>
      <p className="text-xs text-[color:var(--color-mute)] mt-1">
        {cfg.label} · Par {par} · scramble · net scoring
      </p>

      {myRow && (
        <div className="mt-4 rounded-xl border border-[color:var(--color-gold)] bg-[color:var(--color-navy)] text-[color:var(--color-cream)] p-4">
          <p className="text-[10px] font-bold tracking-[0.15em] text-[color:var(--color-gold)]">
            YOUR GROUP
          </p>
          <div className="flex justify-between items-center mt-1">
            <p
              className="text-base"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Hole {myRow.hole} · thru {myRow.holesIn}
            </p>
            <div className="text-right">
              <p
                className="text-xl font-semibold leading-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {myRow.holesIn > 0 ? fmtToPar(myRow.toPar) : '—'}
              </p>
              <p className="text-[10px] text-[color:#a8a596] mt-0.5">
                net · hcp {myRow.teamHcp}
              </p>
            </div>
          </div>
        </div>
      )}

      {!anyScores && (
        <div className="mt-4 rounded-xl bg-[#fff8e8] p-4 text-center">
          <span className="inline-block w-2 h-2 rounded-full bg-[color:var(--color-gold)] mr-2 animate-pulse" />
          <span className="text-xs text-[color:#5a5a4a] align-middle">
            Waiting for first scores ·{' '}
            {canEdit ? 'tap any group to enter' : 'admin will post during the round'}
          </span>
        </div>
      )}

      <div className="mt-4">
        {rows.map((row, i) => (
          <LeaderboardRow
            key={row.foursomeId}
            row={row}
            holes={holes}
            canEdit={canEdit}
            defaultOpen={i === 0 && canEdit}
          />
        ))}
      </div>

      <p className="mt-5 text-[10px] text-[color:var(--color-mute)] italic text-center leading-relaxed">
        Net = team gross − team handicap.
        <br />
        Team handicap uses USGA scramble formula (25/20/15/10%) scaled to {holes.length} holes.
      </p>
    </main>
  );
}
