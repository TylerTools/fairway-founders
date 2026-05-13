import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import Avatar from '@/components/Avatar';

export default async function RosterPage() {
  const me = await getAppUser();
  const res = await supabase
    .from('users')
    .select('id, name, professional_role, company, handicap')
    .order('name', { ascending: true });
  const members = res.data ?? [];

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
        Roster · {members.length} members
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {members.map((m) => (
          <Link
            key={m.id}
            href={`/roster/${m.id}`}
            className="bg-white border border-[color:#e8e2d2] rounded-xl p-3.5 hover:border-[color:var(--color-gold)]"
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
          </Link>
        ))}
      </div>
    </main>
  );
}
