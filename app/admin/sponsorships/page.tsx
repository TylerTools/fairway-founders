import { redirect } from 'next/navigation';
import Link from 'next/link';
import { canAccessAdmin } from '@/lib/auth';
import {
  getPendingSponsorships,
  getActiveSponsorships,
} from '@/app/actions/sponsorships';
import Avatar from '@/components/Avatar';
import AdminSponsorship from './AdminSponsorship';
import { PLACEMENT_LABEL } from '@/lib/sponsorship-placements';

const KIND_LABEL = { featured: 'Featured', round: 'Round sponsor' } as const;

function fmtDate(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';
}

export default async function AdminSponsorshipsPage() {
  if (!(await canAccessAdmin())) redirect('/');
  const [pending, active] = await Promise.all([
    getPendingSponsorships(),
    getActiveSponsorships(),
  ]);

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-2xl mx-auto w-full">
      <Link href="/admin" className="text-xs text-[color:var(--color-gold)]">
        ← Admin
      </Link>
      <h1 className="mt-3 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
        Sponsorships
      </h1>
      <p className="mt-1 text-xs text-[color:var(--color-mute)] leading-relaxed">
        Approve featured listings and round sponsors. Featured members pin to the top of
        the Members directory; open an active sponsor to see their value report.
      </p>

      <section className="mt-6">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
          Pending
          {pending.length > 0 && (
            <span className="text-[color:var(--color-gold)]"> · {pending.length}</span>
          )}
        </p>
        <AdminSponsorship initial={pending} />
      </section>

      <section className="mt-7">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
          Active sponsors
        </p>
        {active.length === 0 ? (
          <p className="text-sm italic text-[color:var(--color-mute)]">No active sponsors.</p>
        ) : (
          <div className="space-y-2">
            {active.map((s) => (
              <Link
                key={s.id}
                href={`/admin/sponsorships/${s.id}`}
                className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 flex items-start gap-3 hover:border-[color:var(--color-gold)] transition-colors"
              >
                <Avatar size={40} photoUrl={s.user.photo_url} rounded="xl" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                    {s.user.name}
                    <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full px-2 py-0.5">
                      {KIND_LABEL[s.kind]}
                    </span>
                  </p>
                  <p className="text-xs text-[color:var(--color-mute)]">
                    thru {fmtDate(s.ends_at)}
                    {s.amount_cents != null
                      ? ` · $${(s.amount_cents / 100).toLocaleString('en-US')}`
                      : ''}
                  </p>
                  {s.placements.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {s.placements.map((p) => (
                        <span
                          key={p}
                          className="text-[9px] tracking-[0.08em] uppercase font-semibold bg-[color:#f0ebd8] text-[color:#5a5a4a] rounded-full px-2 py-0.5"
                        >
                          {PLACEMENT_LABEL[p]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[10px] tracking-[0.08em] uppercase text-[color:#a87c4f]">
                      No placements — promote in report
                    </p>
                  )}
                </div>
                <span className="text-[color:var(--color-gold)] text-xs font-semibold shrink-0 mt-1">
                  Report →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
