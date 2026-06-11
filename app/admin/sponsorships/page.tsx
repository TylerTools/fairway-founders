import { redirect } from 'next/navigation';
import Link from 'next/link';
import { canAccessAdmin } from '@/lib/auth';
import { getPendingSponsorships } from '@/app/actions/sponsorships';
import AdminSponsorship from './AdminSponsorship';

export default async function AdminSponsorshipsPage() {
  if (!(await canAccessAdmin())) redirect('/');
  const pending = await getPendingSponsorships();

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-2xl mx-auto w-full">
      <Link href="/admin" className="text-xs text-[color:var(--color-gold)]">
        ← Admin
      </Link>
      <h1 className="mt-3 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
        Sponsorships
      </h1>
      <p className="mt-1 text-xs text-[color:var(--color-mute)] leading-relaxed">
        Approve featured listings and round sponsors. Approved featured members pin to
        the top of the Members directory for the window you set.
      </p>

      <div className="mt-6">
        <AdminSponsorship initial={pending} />
      </div>
    </main>
  );
}
