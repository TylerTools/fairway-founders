import { redirect } from 'next/navigation';
import { getAppUser } from '@/lib/current-user';
import ClerkProfileShell from '../ClerkProfileShell';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const me = await getAppUser();
  if (!me) redirect('/');

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto w-full">
      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] px-2">
        Your profile · Clerk-managed
      </p>
      <div className="mt-3">
        <ClerkProfileShell />
      </div>
    </main>
  );
}
