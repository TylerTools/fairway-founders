import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAppUser } from '@/lib/current-user';
import { getMyAppProfile } from '@/app/actions/profile';
import ProfileEditor from './ProfileEditor';

export default async function MePage() {
  const me = await getAppUser();
  if (!me) redirect('/');
  const profile = await getMyAppProfile();
  if (!profile) redirect('/');

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

      <ProfileEditor
        profile={profile}
        email={me.email}
        photoUrl={profile.photo_url}
        logoUrl={profile.logo_url}
      />
    </main>
  );
}
