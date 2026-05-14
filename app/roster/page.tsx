import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import Avatar from '@/components/Avatar';
import InviteFriend from '@/components/InviteFriend';
import type { Database } from '@/lib/database.types';

type AppRole = Database['public']['Enums']['app_role'];
type AccessStatus = Database['public']['Enums']['access_status'];

const ROLE_LABEL: Record<AppRole, string> = {
  member: 'Member',
  admin: 'Admin',
  course: 'Course',
};

export default async function RosterPage() {
  const me = await getAppUser();
  const canInvite = !!me && me.access_status === 'approved';
  const isAdmin = me?.app_role === 'admin';

  let q = supabase
    .from('users')
    .select('id, name, professional_role, company, handicap, app_role, access_status')
    .order('name', { ascending: true });
  if (!isAdmin) q = q.eq('access_status', 'approved');
  const res = await q;
  const members = res.data ?? [];

  const approvedCount = members.filter((m) => m.access_status === 'approved').length;

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
          Roster · {approvedCount} member{approvedCount === 1 ? '' : 's'}
          {isAdmin && members.length > approvedCount && (
            <span className="text-[color:var(--color-gold)]">
              {' '}
              · {members.length - approvedCount} other
            </span>
          )}
        </p>
        {canInvite && <InviteFriend inviterName={me.name} />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {members.map((m) => {
          const role = m.app_role as AppRole;
          const status = m.access_status as AccessStatus;
          const showRoleChip = role !== 'member';
          const showStatusChip = isAdmin && status !== 'approved';
          return (
            <Link
              key={m.id}
              href={`/roster/${m.id}`}
              className={`bg-white border rounded-xl p-3.5 hover:border-[color:var(--color-gold)] ${
                showStatusChip
                  ? 'border-[color:#a13c3c]/40'
                  : 'border-[color:#e8e2d2]'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <Avatar size={40} />
                {m.handicap != null && (
                  <span className="text-[9px] bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-md px-1.5 py-0.5 font-bold tracking-wide">
                    HCP {m.handicap}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-semibold leading-tight">
                {m.name}
                {me && me.id === m.id && (
                  <span className="text-[color:var(--color-gold)] font-normal"> (you)</span>
                )}
              </p>
              <p className="text-[11px] text-[color:var(--color-mute)] mt-0.5">
                {m.professional_role}
              </p>
              {(showRoleChip || showStatusChip) && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {showRoleChip && (
                    <span className="text-[8px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full px-1.5 py-0.5">
                      {ROLE_LABEL[role]}
                    </span>
                  )}
                  {showStatusChip && (
                    <span className="text-[8px] tracking-[0.12em] uppercase font-bold bg-[color:#a13c3c] text-white rounded-full px-1.5 py-0.5">
                      {status}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
