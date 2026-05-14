import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import AccessActions from './AccessActions';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

type AccessStatus = Database['public']['Enums']['access_status'];

const STATUS_COLOR: Record<AccessStatus, string> = {
  pending: '#c9a961',
  approved: '#7c9885',
  denied: '#a13c3c',
};

const STATUS_LABEL: Record<AccessStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

export default async function AccessInbox({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const me = await getAppUser();
  const view = await getViewMode(me?.app_role ?? null);
  if (!me) redirect('/');
  if (me.app_role !== 'admin' || view !== 'admin') redirect('/dashboard');

  const { status: statusFilter } = await searchParams;

  let q = supabase
    .from('users')
    .select(
      'id, name, email, company, professional_role, access_status, access_requested_at, access_decided_at',
    )
    .order('access_requested_at', { ascending: false, nullsFirst: false });

  if (statusFilter === 'pending' || statusFilter === 'approved' || statusFilter === 'denied') {
    q = q.eq('access_status', statusFilter as AccessStatus);
  } else {
    q = q.in('access_status', ['pending', 'denied']);
  }

  const res = await q;
  const rows = res.data ?? [];

  const countsRes = await supabase.from('users').select('access_status');
  const counts = { pending: 0, approved: 0, denied: 0 };
  for (const r of countsRes.data ?? []) {
    counts[r.access_status as AccessStatus] += 1;
  }

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <Link href="/admin" className="text-xs text-[color:var(--color-gold)]">
        ← Admin
      </Link>
      <p className="mt-4 text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        Membership
      </p>
      <h1
        className="mt-1 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Access requests
      </h1>
      <p className="text-[11px] text-[color:var(--color-mute)] mt-1">
        {counts.pending} pending · {counts.approved} approved · {counts.denied} denied
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <Chip
          label={`Open ${counts.pending + counts.denied}`}
          href="/admin/access"
          active={!statusFilter}
        />
        <Chip
          label={`Pending ${counts.pending}`}
          href="/admin/access?status=pending"
          active={statusFilter === 'pending'}
        />
        <Chip
          label={`Approved ${counts.approved}`}
          href="/admin/access?status=approved"
          active={statusFilter === 'approved'}
        />
        <Chip
          label={`Denied ${counts.denied}`}
          href="/admin/access?status=denied"
          active={statusFilter === 'denied'}
        />
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[color:var(--color-mute)] italic">
          Nothing here.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((u) => {
            const requested = u.access_requested_at
              ? new Date(u.access_requested_at)
              : null;
            return (
              <article
                key={u.id}
                className="rounded-xl border border-[color:#e8e2d2] bg-white p-4"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-base font-semibold"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {u.name}
                    </p>
                    <p className="text-xs text-[color:#5a5a4a] mt-0.5">{u.email}</p>
                    {(u.professional_role || u.company) && (
                      <p className="text-[11px] text-[color:var(--color-mute)] mt-0.5">
                        {u.professional_role}
                        {u.professional_role && u.company ? ' · ' : ''}
                        {u.company}
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
                    style={{ background: STATUS_COLOR[u.access_status] }}
                  >
                    {STATUS_LABEL[u.access_status]}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-[color:#f0ebd8]">
                  <AccessActions userId={u.id} status={u.access_status} />
                </div>
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
