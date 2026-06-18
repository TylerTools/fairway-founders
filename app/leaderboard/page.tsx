import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';
import { selectEvent } from '@/lib/events';
import { COURSE_OPTIONS } from '@/lib/schedule';
import {
  buildLeaderboard,
  type FoursomeForScoring,
} from '@/lib/scoring';
import { getCourseHoles, parByHole, totalPar } from '@/lib/course-holes';
import LeaderboardRow, { type LeaderboardRowData } from './LeaderboardRow';
import CloseRoundButton from './CloseRoundButton';
import CalendarStrip from '@/components/CalendarStrip';
import LeaderboardRealtime from '@/components/LeaderboardRealtime';
import SponsorStrip from '@/components/SponsorStrip';
import { getCurrentLeagueId } from '@/lib/league-context';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const me = await getAppUser();
  const isAdmin = await canAccessAdmin();
  const leagueId = await getCurrentLeagueId();

  const { event: requestedId } = await searchParams;
  const { event, events } = await selectEvent(requestedId);

  if (!event) {
    return (
      <main className="px-6 py-12 max-w-md lg:max-w-3xl mx-auto text-center">
        <p className="text-sm text-[color:#5a5a4a]">No event scheduled yet.</p>
      </main>
    );
  }

  const cfg = COURSE_OPTIONS[event.course_config];
  const holes = cfg.holes;
  const isGross = event.scoring_mode === 'gross';
  const closed = !!event.closed_at;

  // Per-hole par/yardage for this event's course (falls back to par 4/hole).
  const courseHoles = await getCourseHoles(event.course_id);
  const pars = parByHole(courseHoles);
  const yards: Record<number, number | null> = {};
  for (const h of courseHoles) yards[h.hole] = h.yards;
  const par = totalPar(pars, holes);

  const foursomeRes = await supabase
    .from('foursomes')
    .select(
      'id, hole, tier, group_index, submitted_at, foursome_members(user:user_id(id, name, handicap))',
    )
    .eq('event_id', event.id)
    .order('group_index');

  const foursomeRows = foursomeRes.data ?? [];
  const submittedById: Record<string, boolean> = {};
  for (const f of foursomeRows) submittedById[f.id] = !!f.submitted_at;

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

  const ranked = buildLeaderboard(
    foursomes,
    holes.length,
    event.scoring_mode,
    par,
  );

  const rows: LeaderboardRowData[] = ranked.map((r) => ({
    foursomeId: r.foursome.id,
    hole: r.foursome.hole,
    tier: r.foursome.tier,
    hasTier: r.foursome.tier !== 'A',
    groupIndex: r.foursome.groupIndex,
    teamHcp: r.teamHcp,
    holesIn: r.holesIn,
    gross: r.gross,
    net: r.net,
    toPar: r.toPar,
    rank: r.rank,
    showHcp: !isGross,
    submitted: submittedById[r.foursome.id] ?? false,
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
  const submittedCount = rows.filter((r) => r.submitted).length;

  if (foursomes.length === 0) {
    return (
      <main className="px-6 py-12 max-w-md lg:max-w-3xl mx-auto text-center">
        <CalendarStrip events={events} selectedId={event.id} />
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
    <main className="px-6 py-8 max-w-md lg:max-w-3xl mx-auto w-full">
      <LeaderboardRealtime
        eventId={event.id}
        foursomeIds={foursomes.map((f) => f.id)}
      />
      <CalendarStrip events={events} selectedId={event.id} />
      <SponsorStrip placement="dashboard_strip" leagueId={leagueId ?? undefined} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
          Leaderboard · {closed ? 'Final' : 'Live'}
        </p>
        {isAdmin && !closed && (
          <CloseRoundButton eventId={event.id} isTest={event.is_test} />
        )}
      </div>
      <h1
        className="mt-1 text-2xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {dateStr}
      </h1>
      <p className="text-xs text-[color:var(--color-mute)] mt-1">
        {cfg.label} · Par {par} · scramble · {isGross ? 'gross' : 'net'} scoring
      </p>
      <p className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)] mt-1">
        {submittedCount} of {rows.length} cards in{closed ? ' · round closed' : ''}
      </p>

      {myRow && (
        <section className="mt-5">
          <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
            Your scorecard
          </p>
          <div className="mt-2">
            <LeaderboardRow
              row={myRow}
              holes={holes}
              pars={pars}
              yards={yards}
              canEdit={!closed}
              defaultOpen
            />
          </div>
        </section>
      )}

      {!anyScores && (
        <div className="mt-4 rounded-xl bg-[#fff8e8] p-4 text-center">
          <span className="inline-block w-2 h-2 rounded-full bg-[color:var(--color-gold)] mr-2 animate-pulse" />
          <span className="text-xs text-[color:#5a5a4a] align-middle">
            Waiting for first scores ·{' '}
            {isAdmin
              ? 'tap any group to enter'
              : myRow
                ? 'tap your group to enter your team’s score'
                : 'scores post here during the round'}
          </span>
        </div>
      )}

      <section className="mt-6">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          Leaderboard
        </p>
        <div className="mt-2">
          {rows.map((row) => {
            // Editing your own card happens in "Your scorecard" up top. In the
            // list, only admins edit other groups; everyone else is read-only.
            const rowCanEdit = !closed && isAdmin && !row.isMine;
            return (
              <LeaderboardRow
                key={row.foursomeId}
                row={row}
                holes={holes}
                pars={pars}
                yards={yards}
                canEdit={rowCanEdit}
                defaultOpen={false}
              />
            );
          })}
        </div>
      </section>

      {!isGross && (
        <p className="mt-5 text-[10px] text-[color:var(--color-mute)] italic text-center leading-relaxed">
          Net = team gross − team handicap.
          <br />
          Team handicap uses USGA scramble formula (25/20/15/10%) scaled to {holes.length} holes.
        </p>
      )}
    </main>
  );
}
