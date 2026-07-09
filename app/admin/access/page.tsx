import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import { canAccessAdmin } from '@/lib/auth';
import { getCurrentLeague } from '@/lib/league-context';
import { getInviteLeaderboard } from '@/app/actions/referrals';
import InviteLeaderboard from '@/components/InviteLeaderboard';
import AccessActions from './AccessActions';
import OrphanAccessActions from './OrphanAccessActions';

export const dynamic = 'force-dynamic';

const STATUS_COLOR = {
  pending: '#c9a961',
  active: '#7c9885',
  declined: '#a13c3c',
} as const;
const STATUS_LABEL = {
  pending: 'Pending',
  active: 'Active',
  declined: 'Declined',
} as const;

type Status = keyof typeof STATUS_LABEL;

/**
 * League access queue. Shows pending / active / declined memberships
 * for the current league. League admin sees only their league; GLN
 * admins switch leagues via the header LeagueSwitcher.
 */
export default async function AccessInbox({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const me = await getAppUser();
  if (!me) redirect('/');
  const view = await getViewMode(me.app_role);
  if (view !== 'admin' || !(await canAccessAdmin())) redirect('/dashboard');

  const league = await getCurrentLeague();
  if (!league) {
    return (
      <main className="px-6 py-12 max-w-md lg:max-w-3xl mx-auto text-center">
        <p className="text-sm text-[color:#5a5a4a]">
          No league context — pick a league from the switcher first.
        </p>
      </main>
    );
  }

  const { status: statusFilter } = await searchParams;

  // Counts for the chips (always all three for current league).
  const allRes = await supabase
    .from('league_memberships')
    .select('status')
    .eq('league_id', league.id);
  const counts = { pending: 0, active: 0, declined: 0 };
  for (const r of allRes.data ?? []) {
    counts[r.status as Status] += 1;
  }

  // Filtered rows (default to pending).
  const activeFilter: Status =
    statusFilter === 'active' || statusFilter === 'declined'
      ? statusFilter
      : 'pending';

  const rowsRes = await supabase
    .from('league_memberships')
    .select(
      'id, status, role, joined_at, user:user_id(id, name, email, company, professional_role, access_status, access_requested_at)',
    )
    .eq('league_id', league.id)
    .eq('status', activeFilter)
    .order('joined_at', { ascending: false });

  // Orphan requests: users who signed up without going through /join/[slug]
  // and never got a league_memberships row. Not tied to a league — surface
  // them so any league admin can rescue them by attaching to their league.
  // Filter: access_status='pending' AND no membership rows at all.
  const orphanUsersRes = await supabase
    .from('users')
    .select(
      'id, name, email, company, professional_role, access_requested_at, league_memberships(id)',
    )
    .eq('access_status', 'pending')
    .order('access_requested_at', { ascending: false });
  const orphans = (orphanUsersRes.data ?? [])
    .filter((u) => (u.league_memberships ?? []).length === 0)
    .map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      company: u.company,
      professionalRole: u.professional_role,
      requestedAt: u.access_requested_at,
    }));

  const inviters = await getInviteLeaderboard(league.id);

  const rows = (rowsRes.data ?? []).flatMap((row) => {
    const u = Array.isArray(row.user) ? row.user[0] : row.user;
    if (!u) return [];
    return [
      {
        membershipId: row.id,
        status: row.status as Status,
        role: row.role as 'member' | 'admin',
        joinedAt: row.joined_at,
        userId: u.id,
        name: u.name,
        email: u.email,
        company: u.company,
        professionalRole: u.professional_role,
        accessStatus: u.access_status,
        requestedAt: u.access_requested_at,
      },
    ];
  });

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-3xl mx-auto w-full">
      <Link href="/admin" className="text-xs text-[color:var(--color-gold)]">
        ← Admin
      </Link>
      <p className="mt-4 text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        {league.short_name ?? league.name} · Membership
      </p>
      <h1
        className="mt-1 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Access requests
      </h1>
      <p className="text-[11px] text-[color:var(--color-mute)] mt-1">
        {counts.pending} pending · {counts.active} active · {counts.declined}{' '}
        declined
      </p>

      {inviters.length > 0 && (
        <section className="mt-6">
          <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
            Top inviters · {league.short_name ?? league.name}
          </p>
          <InviteLeaderboard entries={inviters} meId={me.id} />
        </section>
      )}

      {orphans.length > 0 && (
        <section className="mt-6">
          <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-2">
            Waiting for a league · {orphans.length}
          </p>
          <p className="text-[11px] text-[color:var(--color-mute)] italic mb-3 leading-relaxed">
            These members signed up but never picked a league. Attaching them
            here adds them to <strong>{league.short_name ?? league.name}</strong>{' '}
            and approves them in one step.
          </p>
          <div className="space-y-3">
            {orphans.map((o) => {
              const requested = o.requestedAt ? new Date(o.requestedAt) : null;
              return (
                <article
                  key={o.userId}
                  className="rounded-xl border border-[color:var(--color-gold)]/40 bg-white ff-card p-4"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p
                        className="text-base font-semibold"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {o.name}
                      </p>
                      <p className="text-xs text-[color:#5a5a4a] mt-0.5">
                        {o.email}
                      </p>
                      {(o.professionalRole || o.company) && (
                        <p className="text-[11px] text-[color:var(--color-mute)] mt-0.5">
                          {o.professionalRole}
                          {o.professionalRole && o.company ? ' · ' : ''}
                          {o.company}
                        </p>
                      )}
                      {requested && (
                        <p className="text-[10px] text-[color:var(--color-mute)] mt-1">
                          Requested{' '}
                          {requested.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {requested.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] tracking-[0.1em] uppercase font-bold rounded-full px-2 py-0.5 text-white shrink-0 bg-[color:#c9a961]">
                      Unattached
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[color:#f0ebd8]">
                    <OrphanAccessActions
                      userId={o.userId}
                      leagueId={league.id}
                      leagueLabel={league.short_name ?? league.name}
                      canDeny={me.app_role === 'super_admin'}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-1.5">
        <Chip
          label={`Pending ${counts.pending}`}
          href="/admin/access"
          active={activeFilter === 'pending'}
        />
        <Chip
          label={`Active ${counts.active}`}
          href="/admin/access?status=active"
          active={activeFilter === 'active'}
        />
        <Chip
          label={`Declined ${counts.declined}`}
          href="/admin/access?status=declined"
          active={activeFilter === 'declined'}
        />
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[color:var(--color-mute)] italic">
          {activeFilter === 'pending'
            ? 'No pending requests for this league.'
            : `No ${activeFilter} members.`}
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((r) => {
            const requested = r.requestedAt ? new Date(r.requestedAt) : null;
            return (
              <article
                key={r.membershipId}
                className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-base font-semibold"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {r.name}
                    </p>
                    <p className="text-xs text-[color:#5a5a4a] mt-0.5">
                      {r.email}
                    </p>
                    {(r.professionalRole || r.company) && (
                      <p className="text-[11px] text-[color:var(--color-mute)] mt-0.5">
                        {r.professionalRole}
                        {r.professionalRole && r.company ? ' · ' : ''}
                        {r.company}
                      </p>
                    )}
                    {requested && (
                      <p className="text-[10px] text-[color:var(--color-mute)] mt-1">
                        Requested{' '}
                        {requested.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {requested.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-[9px] tracking-[0.1em] uppercase font-bold rounded-full px-2 py-0.5 text-white shrink-0"
                    style={{ background: STATUS_COLOR[r.status] }}
                  >
                    {STATUS_LABEL[r.status]}
                    {r.role === 'admin' ? ' · Admin' : ''}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-[color:#f0ebd8]">
                    <AccessActions membershipId={r.membershipId} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Chip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-[10px] tracking-[0.08em] uppercase font-semibold rounded-full px-2.5 py-1 border ${
        active
          ? 'bg-[color:var(--color-navy)] text-[color:var(--color-gold)] border-[color:var(--color-navy)]'
          : 'bg-white text-[color:#5a5a4a] border-[color:#e8e2d2]'
      }`}
    >
      {label}
    </Link>
  );
}
