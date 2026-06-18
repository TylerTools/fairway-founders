import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getMyAppProfile } from '@/app/actions/profile';
import { getMySponsorship } from '@/app/actions/sponsorships';
import { getMyTraffic } from '@/app/actions/analytics';
import ProfileEditor from './ProfileEditor';
import MyLeagues, { type MyLeagueRow } from './MyLeagues';
import SponsorshipRequest from '@/components/SponsorshipRequest';
import ProfileAnalytics from '@/components/ProfileAnalytics';

export default async function MePage() {
  const me = await getAppUser();
  if (!me) redirect('/');
  const profile = await getMyAppProfile();
  if (!profile) redirect('/');
  const sponsorship = await getMySponsorship();
  const traffic = await getMyTraffic();
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long' });

  // "Your leagues" — every league_memberships row this user has, with status
  // pill. Built from a single query that joins through to leagues.
  const myMemRes = await supabase
    .from('league_memberships')
    .select('id, role, status, league:league_id(id, name, short_name, slug)')
    .eq('user_id', me.id);
  const myLeagueRows: MyLeagueRow[] = [];
  for (const r of myMemRes.data ?? []) {
    const l = Array.isArray(r.league) ? r.league[0] : r.league;
    if (!l) continue;
    myLeagueRows.push({
      membershipId: r.id,
      role: r.role,
      status: r.status,
      leagueId: l.id,
      name: l.name,
      shortName: l.short_name,
      slug: l.slug,
    });
  }
  // Active first, then pending, then declined; alphabetical within each group.
  const statusOrder = { active: 0, pending: 1, declined: 2 } as const;
  myLeagueRows.sort(
    (a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      a.name.localeCompare(b.name),
  );

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
          Your profile
        </h1>
        <Link
          href={`/roster/${me.id}`}
          className="text-xs text-[color:var(--color-gold)] font-semibold"
        >
          View public →
        </Link>
      </div>
      <p className="mt-1 text-xs text-[color:var(--color-mute)]">
        Your member homepage — what others see in the directory and on your card.
      </p>

      <div className="mt-5">
        <ProfileAnalytics traffic={traffic} monthLabel={monthLabel} />
      </div>

      <ProfileEditor
        profile={profile}
        email={me.email}
        photoUrl={profile.photo_url}
        logoUrl={profile.logo_url}
      />

      <div className="mt-3">
        <MyLeagues leagues={myLeagueRows} />
      </div>

      <div className="mt-3">
        <SponsorshipRequest current={sponsorship} />
      </div>
    </main>
  );
}
