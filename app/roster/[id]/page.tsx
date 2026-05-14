import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import Avatar from '@/components/Avatar';
import AdminMemberActions from './AdminMemberActions';

const ROLE_LABEL: Record<'member' | 'admin' | 'course', string> = {
  member: 'Member',
  admin: 'Admin',
  course: 'Course',
};

export default async function MemberDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getAppUser();
  const isCourse = me?.app_role === 'course';
  const isAdmin = me?.app_role === 'admin';

  const res = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  const member = res.data;
  if (!member) notFound();

  const showAdminActions = isAdmin && me.id !== member.id;

  // Past rounds together (only for non-course roles)
  let played: { other: { id: string; name: string }; count: number }[] = [];
  if (!isCourse) {
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
      const counts = new Map<string, { name: string; count: number }>();
      for (const row of mates.data ?? []) {
        const u = Array.isArray(row.users) ? row.users[0] : row.users;
        if (!u) continue;
        const e = counts.get(u.id) ?? { name: u.name, count: 0 };
        e.count += 1;
        counts.set(u.id, e);
      }
      played = [...counts.entries()]
        .map(([oid, e]) => ({ other: { id: oid, name: e.name }, count: e.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }
  }

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <Link
        href="/roster"
        className="text-xs text-[color:var(--color-gold)]"
      >
        ← Roster
      </Link>

      <div className="mt-4 flex items-center gap-3.5">
        <Avatar size={64} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {member.name}
            </p>
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
          <p className="text-xs text-[color:#5a5a4a]">{member.professional_role}</p>
          <p className="text-[11px] text-[color:var(--color-mute)]">{member.company}</p>
        </div>
        {member.handicap != null && (
          <div className="bg-[color:var(--color-navy)] text-[color:var(--color-gold)] text-center rounded-lg px-3 py-1.5">
            <p className="text-[9px] font-bold tracking-[0.15em]">HCP</p>
            <p
              className="text-base font-semibold text-[color:var(--color-cream)] leading-none"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {member.handicap}
            </p>
          </div>
        )}
      </div>

      {!isCourse && member.bio && (
        <section className="mt-4 rounded-xl border border-[color:#e8e2d2] bg-white p-5">
          <p className="text-sm leading-relaxed">{member.bio}</p>
        </section>
      )}

      {!isCourse && member.helps && member.helps.length > 0 && (
        <section className="mt-3 rounded-xl border border-[color:#e8e2d2] bg-white p-5">
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

      {!isCourse && played.length > 0 && (
        <section className="mt-3 rounded-xl border border-[color:#e8e2d2] bg-white p-5">
          <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-2">
            Past rounds together
          </p>
          {played.map(({ other, count }) => (
            <div
              key={other.id}
              className="flex justify-between py-2 border-b border-[color:#f0ebd8] last:border-b-0 text-sm"
            >
              <span>{other.name}</span>
              <span className="text-[color:var(--color-gold)] font-semibold">{count}×</span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
