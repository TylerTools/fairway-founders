import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import Avatar from '@/components/Avatar';
import CountTags from '@/components/CountTags';
import AdminMemberActions from './AdminMemberActions';
import { getMemberCountsTags } from '@/app/actions/stats';
import ProfileInteractionButtons from '@/components/ProfileInteractionButtons';
import TrackProfileView from '@/components/TrackProfileView';

const ROLE_LABEL: Record<'member' | 'super_admin', string> = {
  member: 'Member',
  super_admin: 'Admin',
};

const LINK_LABEL: Record<string, string> = {
  website: 'Website',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  calendly: 'Calendly',
  other: 'Link',
};

export default async function MemberDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getAppUser();
  const isAdmin = me?.app_role === 'super_admin';
  const isSelf = me?.id === id;

  const res = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  const member = res.data;
  if (!member) notFound();

  const [linksRes, leaguesRes, counts] = await Promise.all([
    supabase
      .from('member_links')
      .select('*')
      .eq('user_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('league_memberships')
      .select('league:league_id(name, short_name)')
      .eq('user_id', id),
    getMemberCountsTags(id),
  ]);

  const links = linksRes.data ?? [];
  const leagueTags = (leaguesRes.data ?? [])
    .map((r) => {
      const l = Array.isArray(r.league) ? r.league[0] : r.league;
      return l?.short_name || l?.name || null;
    })
    .filter((x): x is string => !!x);

  // Past rounds together — derived from shared foursomes (unchanged behavior).
  let played: { other: { id: string; name: string }; count: number }[] = [];
  const myFoursomes = await supabase
    .from('foursome_members')
    .select('foursome_id')
    .eq('user_id', member.id);
  const foursomeIds = (myFoursomes.data ?? []).map((r) => r.foursome_id);
  if (foursomeIds.length) {
    const mates = await supabase
      .from('foursome_members')
      .select('user_id, users:user_id(id, name)')
      .in('foursome_id', foursomeIds)
      .neq('user_id', member.id);
    const countsMap = new Map<string, { name: string; count: number }>();
    for (const row of mates.data ?? []) {
      const u = Array.isArray(row.users) ? row.users[0] : row.users;
      if (!u) continue;
      const e = countsMap.get(u.id) ?? { name: u.name, count: 0 };
      e.count += 1;
      countsMap.set(u.id, e);
    }
    played = [...countsMap.entries()]
      .map(([oid, e]) => ({ other: { id: oid, name: e.name }, count: e.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  const showAdminActions = isAdmin && !isSelf;

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-3xl mx-auto w-full">
      <Link href="/roster" className="text-xs text-[color:var(--color-gold)]">
        ← Members
      </Link>
      {!isSelf && <TrackProfileView profileId={member.id} />}

      {/* Hero */}
      <section className="mt-4 rounded-2xl border border-[color:#e8e2d2] bg-white ff-card p-5 lg:p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar size={84} photoUrl={member.photo_url} rounded="xl" />
            {member.logo_url && (
              <span className="absolute -bottom-2 -right-2 rounded-lg border-2 border-white bg-white shadow-sm overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.logo_url}
                  alt=""
                  className="w-9 h-9 object-cover rounded-md"
                />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-2xl leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {member.name}
                {isSelf && (
                  <span className="text-[color:var(--color-gold)] text-base font-normal">
                    {' '}
                    (you)
                  </span>
                )}
              </h1>
              {member.app_role !== 'member' && (
                <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full px-2 py-0.5">
                  {ROLE_LABEL[member.app_role]}
                </span>
              )}
              {isAdmin && member.access_status !== 'approved' && (
                <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:#a13c3c] text-white rounded-full px-2 py-0.5">
                  {member.access_status}
                </span>
              )}
            </div>

            {member.tagline && (
              <p className="mt-1 text-sm text-[color:#5a5a4a] leading-snug">
                {member.tagline}
              </p>
            )}
            {(member.professional_role || member.company) && (
              <p className="mt-1 text-[13px] text-[color:var(--color-mute)]">
                {[member.professional_role, member.company]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {member.city && (
              <p className="mt-0.5 text-[11px] text-[color:var(--color-mute)]">
                {member.city}
              </p>
            )}

            {(leagueTags.length > 0 || member.handicap != null) && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                {leagueTags.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:#f0ebd8] text-[color:#5a5a4a] rounded-full px-2 py-0.5"
                  >
                    {t}
                  </span>
                ))}
                {member.handicap != null && (
                  <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full px-2 py-0.5">
                    HCP {member.handicap}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Count tags */}
        <div className="mt-5 pt-4 border-t border-[color:#f0ebd8]">
          <CountTags fours={counts.fours} links={counts.links} birdies={counts.birdies} />
        </div>

        {/* Action bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!isSelf && (
            <a
              href={`/api/vcard/${member.id}`}
              className="inline-flex items-center gap-1.5 bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase rounded-md hover:opacity-90"
            >
              Save contact
            </a>
          )}
          {member.website_url && (
            <a
              href={member.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-[color:var(--color-gold)] text-[color:var(--color-ink)] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase rounded-md hover:bg-[color:#f5f1e8]"
            >
              Website
            </a>
          )}
          {!isSelf && (
            <ProfileInteractionButtons toUserId={member.id} toName={member.name} />
          )}
        </div>
      </section>

      {/* Bio */}
      {member.bio && (
        <section className="mt-3 rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{member.bio}</p>
        </section>
      )}

      {/* Link hub */}
      {links.length > 0 && (
        <section className="mt-3 rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
          <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
            Find me
          </p>
          <div className="space-y-1.5">
            {links.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-[color:#e8e2d2] px-3.5 py-2.5 hover:border-[color:var(--color-gold)] transition-colors"
              >
                <span className="text-sm font-medium text-[color:var(--color-ink)] truncate">
                  {l.label}
                </span>
                <span className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)] shrink-0">
                  {LINK_LABEL[l.kind] ?? 'Link'}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Can help with */}
      {member.helps && member.helps.length > 0 && (
        <section className="mt-3 rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
          <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-2">
            Can help with
          </p>
          <div className="flex flex-wrap gap-1.5">
            {member.helps.map((h) => (
              <span
                key={h}
                className="text-xs px-3 py-1 bg-[color:#f0ebd8] text-[color:#5a5a4a] rounded-full"
              >
                {h}
              </span>
            ))}
          </div>
        </section>
      )}

      {showAdminActions && (
        <AdminMemberActions
          userId={member.id}
          currentRole={member.app_role}
          currentStatus={member.access_status}
          memberName={member.name}
        />
      )}

      {/* Past rounds together */}
      {played.length > 0 && (
        <section className="mt-3 rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
          <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-2">
            Past rounds together
          </p>
          {played.map(({ other, count }) => (
            <div
              key={other.id}
              className="flex justify-between py-2 border-b border-[color:#f0ebd8] last:border-b-0 text-sm"
            >
              <span>{other.name}</span>
              <span className="text-[color:var(--color-gold)] font-semibold">
                {count}×
              </span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
