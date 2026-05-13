import { redirect } from 'next/navigation';
import { getAppUser } from '@/lib/current-user';
import Avatar from '@/components/Avatar';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const me = await getAppUser();
  if (!me) redirect('/');

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        Your profile
      </p>
      <div className="mt-3 flex items-center gap-4">
        <Avatar size={72} navy />
        <div className="flex-1">
          <p
            className="text-2xl leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {me.name}
          </p>
          <p className="text-xs text-[color:var(--color-mute)] uppercase tracking-[0.1em]">
            {me.app_role}
          </p>
        </div>
        <div className="bg-[color:var(--color-navy)] text-[color:var(--color-gold)] text-center rounded-lg px-3.5 py-2">
          <p className="text-[9px] font-bold tracking-[0.15em]">HCP</p>
          <p
            className="text-xl font-semibold text-[color:var(--color-cream)] leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {me.handicap ?? '—'}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-[color:#e8e2d2] bg-white p-5">
        <ProfileForm me={me} />
      </section>
    </main>
  );
}
