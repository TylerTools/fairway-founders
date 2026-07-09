import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { requireMcpAdmin, clerkUserIdFrom } from './admin';

type CourseUpdate = Database['public']['Tables']['courses']['Update'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

// ── helpers ──────────────────────────────────────────────────────────────
function text(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  if (res.data == null) throw new Error('No data returned.');
  return res.data;
}

async function requireAdmin(extra: { authInfo?: unknown }) {
  return requireMcpAdmin(clerkUserIdFrom(extra.authInfo));
}

function firstName(u: unknown): string | null {
  const rec = Array.isArray(u) ? u[0] : u;
  return (rec as { name?: string } | null)?.name ?? null;
}

const PLACEMENTS = [
  'roster_pin',
  'dashboard_strip',
  'homepage_section',
  'sponsors_page',
] as const;

/**
 * Register every admin MCP tool. Each tool re-checks admin rights via
 * requireAdmin(extra) — the OAuth layer authenticates, this authorizes.
 */
export function registerMcpTools(server: McpServer) {
  // ── Leagues (discovery) ─────────────────────────────────────────────────
  server.tool(
    'list_leagues',
    'List all leagues (chapters) with their ids, names, and slugs.',
    {},
    async (_args, extra) => {
      await requireAdmin(extra);
      const data = must(
        await supabase
          .from('leagues')
          .select('id, name, slug, short_name')
          .order('name'),
      );
      return text(data);
    },
  );

  // ── Courses & contacts ──────────────────────────────────────────────────
  server.tool(
    'list_courses',
    'List courses, optionally filtered to one league.',
    { leagueId: z.string().optional() },
    async (args, extra) => {
      await requireAdmin(extra);
      let q = supabase
        .from('courses')
        .select(
          'id, name, short_name, city, state, address, website_url, default_pro_shop_email, is_active, league_id',
        )
        .order('name');
      if (args.leagueId) q = q.eq('league_id', args.leagueId);
      return text(must(await q));
    },
  );

  server.tool(
    'create_course',
    'Create a course in a league.',
    {
      leagueId: z.string(),
      name: z.string(),
      shortName: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      address: z.string().optional(),
      websiteUrl: z.string().optional(),
      defaultProShopEmail: z.string().optional(),
    },
    async (args, extra) => {
      await requireAdmin(extra);
      const data = must(
        await supabase
          .from('courses')
          .insert({
            league_id: args.leagueId,
            name: args.name,
            short_name: args.shortName ?? null,
            city: args.city ?? null,
            state: args.state ?? null,
            address: args.address ?? null,
            website_url: args.websiteUrl ?? null,
            default_pro_shop_email: args.defaultProShopEmail ?? null,
          })
          .select('id, name, league_id')
          .single(),
      );
      return text({ created: data });
    },
  );

  server.tool(
    'update_course',
    'Update fields on a course. Only provided fields change.',
    {
      courseId: z.string(),
      name: z.string().optional(),
      shortName: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      address: z.string().optional(),
      websiteUrl: z.string().optional(),
      defaultProShopEmail: z.string().optional(),
      isActive: z.boolean().optional(),
    },
    async (args, extra) => {
      await requireAdmin(extra);
      const patch: CourseUpdate = {};
      if (args.name !== undefined) patch.name = args.name;
      if (args.shortName !== undefined) patch.short_name = args.shortName;
      if (args.city !== undefined) patch.city = args.city;
      if (args.state !== undefined) patch.state = args.state;
      if (args.address !== undefined) patch.address = args.address;
      if (args.websiteUrl !== undefined) patch.website_url = args.websiteUrl;
      if (args.defaultProShopEmail !== undefined)
        patch.default_pro_shop_email = args.defaultProShopEmail;
      if (args.isActive !== undefined) patch.is_active = args.isActive;
      const data = must(
        await supabase
          .from('courses')
          .update(patch)
          .eq('id', args.courseId)
          .select('id, name, is_active')
          .single(),
      );
      return text({ updated: data });
    },
  );

  server.tool(
    'list_course_contacts',
    'List pro-shop contacts for a course.',
    { courseId: z.string() },
    async (args, extra) => {
      await requireAdmin(extra);
      return text(
        must(
          await supabase
            .from('course_contacts')
            .select('id, name, role, email, phone, is_primary, notes')
            .eq('course_id', args.courseId)
            .order('is_primary', { ascending: false }),
        ),
      );
    },
  );

  server.tool(
    'add_course_contact',
    'Add a pro-shop contact to a course.',
    {
      courseId: z.string(),
      name: z.string(),
      role: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      isPrimary: z.boolean().optional(),
    },
    async (args, extra) => {
      await requireAdmin(extra);
      const data = must(
        await supabase
          .from('course_contacts')
          .insert({
            course_id: args.courseId,
            name: args.name,
            role: args.role ?? null,
            email: args.email ?? null,
            phone: args.phone ?? null,
            is_primary: args.isPrimary ?? false,
          })
          .select('id, name')
          .single(),
      );
      return text({ created: data });
    },
  );

  server.tool(
    'set_course_holes',
    'Set per-hole par and yardage for a course (upsert by hole). Reused by every round.',
    {
      courseId: z.string(),
      holes: z.array(
        z.object({
          hole: z.number(),
          par: z.number(),
          yards: z.number().optional(),
        }),
      ),
    },
    async (args, extra) => {
      await requireAdmin(extra);
      const now = new Date().toISOString();
      const rows = args.holes
        .filter((h) => h.hole >= 1 && h.hole <= 18)
        .map((h) => ({
          course_id: args.courseId,
          hole: h.hole,
          par: Math.max(3, Math.min(6, Math.round(h.par || 4))),
          yards: h.yards == null ? null : Math.max(0, Math.round(h.yards)),
          updated_at: now,
        }));
      must(
        await supabase
          .from('course_holes')
          .upsert(rows, { onConflict: 'course_id,hole' })
          .select('hole'),
      );
      return text({ saved: rows.length });
    },
  );

  // ── Events / rounds ─────────────────────────────────────────────────────
  server.tool(
    'list_events',
    'List events (rounds), optionally by league and/or upcoming-only.',
    { leagueId: z.string().optional(), upcomingOnly: z.boolean().optional() },
    async (args, extra) => {
      await requireAdmin(extra);
      const rows = must(
        await supabase
          .from('events')
          .select(
            'id, date, status, scoring_mode, is_test, closed_at, course_config, fee_cents, course:course_id(name, league_id)',
          )
          .order('date', { ascending: true }),
      );
      let list = rows as unknown as Array<{
        id: string;
        date: string;
        course: { name: string; league_id: string } | { name: string; league_id: string }[] | null;
        [k: string]: unknown;
      }>;
      const courseOf = (c: (typeof list)[number]['course']) =>
        Array.isArray(c) ? c[0] : c;
      if (args.leagueId)
        list = list.filter((e) => courseOf(e.course)?.league_id === args.leagueId);
      if (args.upcomingOnly)
        list = list.filter((e) => new Date(e.date).getTime() >= Date.now());
      return text(
        list.map((e) => ({
          id: e.id,
          date: e.date,
          course: courseOf(e.course)?.name ?? null,
          status: e.status,
          scoring_mode: e.scoring_mode,
          is_test: e.is_test,
          closed: !!e.closed_at,
        })),
      );
    },
  );

  server.tool(
    'create_event',
    'Schedule an event (round). Date is an ISO timestamp. RSVP window defaults to 6→2 days before.',
    {
      courseId: z.string(),
      dateIso: z.string(),
      courseConfig: z.enum(['front', 'back', 'both']).optional(),
      feeDollars: z.number().optional(),
      proShopEmail: z.string().optional(),
      scoringMode: z.enum(['gross', 'net']).optional(),
    },
    async (args, extra) => {
      await requireAdmin(extra);
      const date = new Date(args.dateIso);
      if (Number.isNaN(date.getTime())) throw new Error('Invalid dateIso.');
      const opens = new Date(date);
      opens.setUTCDate(opens.getUTCDate() - 6);
      const closes = new Date(date);
      closes.setUTCDate(closes.getUTCDate() - 2);
      const data = must(
        await supabase
          .from('events')
          .insert({
            course_id: args.courseId,
            date: date.toISOString(),
            opens_at: opens.toISOString(),
            closes_at: closes.toISOString(),
            course_config: args.courseConfig ?? 'front',
            fee_cents: Math.max(0, Math.round((args.feeDollars ?? 0) * 100)),
            pro_shop_email: args.proShopEmail ?? null,
            scoring_mode: args.scoringMode ?? 'net',
            status: 'locked',
          })
          .select('id, date')
          .single(),
      );
      return text({ created: data });
    },
  );

  server.tool(
    'update_event',
    'Update an event. Only provided fields change.',
    {
      eventId: z.string(),
      dateIso: z.string().optional(),
      courseConfig: z.enum(['front', 'back', 'both']).optional(),
      feeDollars: z.number().optional(),
      proShopEmail: z.string().optional(),
      scoringMode: z.enum(['gross', 'net']).optional(),
    },
    async (args, extra) => {
      await requireAdmin(extra);
      const patch: EventUpdate = {};
      if (args.dateIso !== undefined) {
        const d = new Date(args.dateIso);
        if (Number.isNaN(d.getTime())) throw new Error('Invalid dateIso.');
        patch.date = d.toISOString();
      }
      if (args.courseConfig !== undefined) patch.course_config = args.courseConfig;
      if (args.feeDollars !== undefined)
        patch.fee_cents = Math.max(0, Math.round(args.feeDollars * 100));
      if (args.proShopEmail !== undefined) patch.pro_shop_email = args.proShopEmail;
      if (args.scoringMode !== undefined) patch.scoring_mode = args.scoringMode;
      const data = must(
        await supabase
          .from('events')
          .update(patch)
          .eq('id', args.eventId)
          .select('id, date, scoring_mode')
          .single(),
      );
      return text({ updated: data });
    },
  );

  server.tool(
    'get_leaderboard',
    'Current standings for an event: each group with its gross total, holes played, and submitted status.',
    { eventId: z.string() },
    async (args, extra) => {
      await requireAdmin(extra);
      const foursomes = must(
        await supabase
          .from('foursomes')
          .select(
            'id, group_index, hole, submitted_at, foursome_members(user:user_id(name))',
          )
          .eq('event_id', args.eventId)
          .order('group_index'),
      );
      const ids = foursomes.map((f) => f.id);
      const scores = ids.length
        ? must(
            await supabase
              .from('hole_scores')
              .select('foursome_id, strokes')
              .in('foursome_id', ids),
          )
        : [];
      const tally: Record<string, { gross: number; thru: number }> = {};
      for (const s of scores) {
        const t = (tally[s.foursome_id] ??= { gross: 0, thru: 0 });
        t.gross += s.strokes;
        t.thru += 1;
      }
      const standings = foursomes.map((f) => ({
        group: f.group_index + 1,
        startHole: f.hole,
        players: (f.foursome_members ?? [])
          .map((m) => firstName(m.user))
          .filter(Boolean),
        gross: tally[f.id]?.gross ?? 0,
        thru: tally[f.id]?.thru ?? 0,
        submitted: !!f.submitted_at,
      }));
      standings.sort(
        (a, b) => (b.thru > 0 ? 1 : 0) - (a.thru > 0 ? 1 : 0) || a.gross - b.gross,
      );
      return text(standings);
    },
  );

  server.tool(
    'close_round',
    'Finalize an event: stamp closed_at so the leaderboard reads Final and scoring locks. Scores are kept.',
    { eventId: z.string() },
    async (args, extra) => {
      await requireAdmin(extra);
      must(
        await supabase
          .from('events')
          .update({ closed_at: new Date().toISOString() })
          .eq('id', args.eventId)
          .select('id'),
      );
      return text({ closed: args.eventId });
    },
  );

  // ── Members & access ────────────────────────────────────────────────────
  server.tool(
    'list_members',
    'List members, optionally scoped to a league. Includes role and access status.',
    { leagueId: z.string().optional() },
    async (args, extra) => {
      await requireAdmin(extra);
      if (args.leagueId) {
        const rows = must(
          await supabase
            .from('league_memberships')
            .select(
              'role, status, user:user_id(id, name, email, company, professional_role, app_role, access_status)',
            )
            .eq('league_id', args.leagueId),
        );
        return text(
          rows.map((r) => {
            const u = Array.isArray(r.user) ? r.user[0] : r.user;
            return { ...u, league_role: r.role, membership_status: r.status };
          }),
        );
      }
      return text(
        must(
          await supabase
            .from('users')
            .select(
              'id, name, email, company, professional_role, app_role, access_status',
            )
            .order('name'),
        ),
      );
    },
  );

  server.tool(
    'list_access_requests',
    'List users whose access is pending review.',
    {},
    async (_args, extra) => {
      await requireAdmin(extra);
      return text(
        must(
          await supabase
            .from('users')
            .select('id, name, email, company, professional_role, access_requested_at')
            .eq('access_status', 'pending')
            .order('access_requested_at'),
        ),
      );
    },
  );

  server.tool(
    'decide_access',
    "Approve or deny a user's platform access.",
    { userId: z.string(), decision: z.enum(['approved', 'denied']) },
    async (args, extra) => {
      const me = await requireAdmin(extra);
      const data = must(
        await supabase
          .from('users')
          .update({
            access_status: args.decision,
            access_decided_at: new Date().toISOString(),
            access_decided_by: me.id,
          })
          .eq('id', args.userId)
          .select('id, name, access_status')
          .single(),
      );
      return text({ updated: data });
    },
  );

  server.tool(
    'set_league_role',
    "Set a user's role in a league (member or admin). Activates the membership.",
    {
      leagueId: z.string(),
      userId: z.string(),
      role: z.enum(['member', 'admin']),
    },
    async (args, extra) => {
      await requireAdmin(extra);
      must(
        await supabase
          .from('league_memberships')
          .upsert(
            {
              league_id: args.leagueId,
              user_id: args.userId,
              role: args.role,
              status: 'active',
            },
            { onConflict: 'league_id,user_id' },
          )
          .select('id'),
      );
      return text({ ok: true, leagueId: args.leagueId, userId: args.userId, role: args.role });
    },
  );

  // ── Sponsorships ────────────────────────────────────────────────────────
  server.tool(
    'list_sponsorships',
    'List sponsorships, optionally by league and/or status.',
    {
      leagueId: z.string().optional(),
      status: z
        .enum(['requested', 'active', 'declined', 'expired'])
        .optional(),
    },
    async (args, extra) => {
      await requireAdmin(extra);
      let q = supabase
        .from('sponsorships')
        .select(
          'id, kind, status, amount_cents, placements, starts_at, ends_at, note, league_id, user:user_id(name, company)',
        )
        .order('requested_at', { ascending: false });
      if (args.leagueId) q = q.eq('league_id', args.leagueId);
      if (args.status) q = q.eq('status', args.status);
      return text(must(await q));
    },
  );

  server.tool(
    'decide_sponsorship',
    'Approve (activate) or decline a sponsorship request.',
    {
      sponsorshipId: z.string(),
      decision: z.enum(['active', 'declined']),
    },
    async (args, extra) => {
      const me = await requireAdmin(extra);
      const data = must(
        await supabase
          .from('sponsorships')
          .update({ status: args.decision, approved_by: me.id })
          .eq('id', args.sponsorshipId)
          .select('id, status')
          .single(),
      );
      return text({ updated: data });
    },
  );

  server.tool(
    'set_sponsor_placements',
    `Set where a sponsor appears. Valid placements: ${PLACEMENTS.join(', ')}.`,
    {
      sponsorshipId: z.string(),
      placements: z.array(z.enum(PLACEMENTS)),
    },
    async (args, extra) => {
      await requireAdmin(extra);
      const data = must(
        await supabase
          .from('sponsorships')
          .update({ placements: args.placements })
          .eq('id', args.sponsorshipId)
          .select('id, placements')
          .single(),
      );
      return text({ updated: data });
    },
  );
}
