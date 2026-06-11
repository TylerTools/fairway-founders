import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getMyLeagues } from '@/lib/league-context';
import InviteFriend from '@/components/InviteFriend';
import MemberDirectory from '@/components/MemberDirectory';
import type { DirectoryMember } from '@/components/MemberCard';

export default async function RosterPage() {
  const me = await getAppUser();
  const isApproved = !!me && me.access_status === 'approved';
  const isAdmin = me?.app_role === 'super_admin';

  let q = supabase
    .from('users')
    .select(
      'id, name, professional_role, company, tagline, photo_url, handicap, app_role, access_status',
    )
    .order('name', { ascending: true });
  if (!isAdmin) q = q.eq('access_status', 'approved');
  const res = await q;
  const members = res.data ?? [];

  // League tags per member (one query, folded).
  const lmRes = await supabase
    .from('league_memberships')
    .select('user_id, league:league_id(name, short_name, slug)');
  const leagueByUser = new Map<string, { slug: string; label: string }[]>();
  for (const row of lmRes.data ?? []) {
    const l = Array.isArray(row.league) ? row.league[0] : row.league;
    if (!l) continue;
    const arr = leagueByUser.get(row.user_id) ?? [];
    arr.push({ slug: l.slug, label: l.short_name || l.name });
    leagueByUser.set(row.user_id, arr);
  }

  // Accepted-interaction counts for every member (one query, folded).
  const intRes = await supabase
    .from('interactions')
    .select('kind, from_user_id, to_user_id')
    .eq('status', 'accepted');
  const counts = new Map<string, { fours: number; links: number; birdies: number }>();
  const bump = (uid: string, k: 'fours' | 'links' | 'birdies') => {
    const c = counts.get(uid) ?? { fours: 0, links: 0, birdies: 0 };
    c[k] += 1;
    counts.set(uid, c);
  };
  for (const r of intRes.data ?? []) {
    if (r.kind === 'four') bump(r.from_user_id, 'fours');
    else if (r.kind === 'link') {
      bump(r.from_user_id, 'links');
      bump(r.to_user_id, 'links');
    } else if (r.kind === 'birdie') {
      bump(r.from_user_id, 'birdies');
      bump(r.to_user_id, 'birdies');
    }
  }

  const enriched: DirectoryMember[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    professional_role: m.professional_role,
    company: m.company,
    tagline: m.tagline,
    photo_url: m.photo_url,
    handicap: m.handicap,
    app_role: m.app_role,
    access_status: m.access_status,
    leagues: leagueByUser.get(m.id) ?? [],
    counts: counts.get(m.id) ?? { fours: 0, links: 0, birdies: 0 },
    isMe: me?.id === m.id,
  }));

  const approvedCount = enriched.filter((m) => m.access_status === 'approved').length;

  const leagues = await getMyLeagues();
  const leagueFilters = leagues.map((l) => ({
    slug: l.slug,
    label: l.short_name || l.name,
  }));

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
          Members · {approvedCount} member{approvedCount === 1 ? '' : 's'}
          {isAdmin && enriched.length > approvedCount && (
            <span className="text-[color:var(--color-gold)]">
              {' '}
              · {enriched.length - approvedCount} other
            </span>
          )}
        </p>
        {isApproved && me && (
          <div className="flex items-center gap-3">
            <Link
              href="/me"
              className="text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-gold)] whitespace-nowrap"
            >
              Edit my profile
            </Link>
            <InviteFriend inviterName={me.name} />
          </div>
        )}
      </div>

      <MemberDirectory members={enriched} leagues={leagueFilters} isAdmin={isAdmin} />
    </main>
  );
}
