import Link from 'next/link';

export interface MyLeagueRow {
  membershipId: string;
  role: 'member' | 'admin';
  status: 'pending' | 'active' | 'declined';
  leagueId: string;
  name: string;
  shortName: string | null;
  slug: string;
}

const STATUS_PILL: Record<MyLeagueRow['status'], { bg: string; fg: string; label: string }> = {
  active: {
    bg: 'var(--color-navy)',
    fg: 'var(--color-gold)',
    label: 'Active',
  },
  pending: {
    bg: 'var(--color-gold)',
    fg: 'var(--color-navy)',
    label: 'Pending',
  },
  declined: {
    bg: '#a87c4f',
    fg: '#ffffff',
    label: 'Declined',
  },
};

/**
 * "Your leagues" — read-only list of every league this member is in (or has
 * requested). Active leagues show first; declined rows give a Re-request link
 * back to /join/[slug]. Mounted on /me between the editor and the sponsorship
 * card.
 */
export default function MyLeagues({ leagues }: { leagues: MyLeagueRow[] }) {
  return (
    <section className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Your leagues
      </p>
      {leagues.length === 0 ? (
        <p className="mt-3 text-sm italic text-[color:var(--color-mute)]">
          You aren&rsquo;t in any league yet — ask your inviter for a league
          link.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {leagues.map((l) => {
            const pill = STATUS_PILL[l.status];
            return (
              <li
                key={l.membershipId}
                className="rounded-lg border border-[color:#e8e2d2] bg-white px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                    {l.name}
                    {l.role === 'admin' && l.status === 'active' && (
                      <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-gold)] text-[color:var(--color-navy)] rounded-full px-2 py-0.5">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mt-0.5">
                    {l.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[9px] tracking-[0.12em] uppercase font-bold rounded-full px-2 py-0.5"
                    style={{ background: pill.bg, color: pill.fg }}
                  >
                    {pill.label}
                  </span>
                  {l.status === 'declined' && (
                    <Link
                      href={`/join/${l.slug}`}
                      className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-gold)]"
                    >
                      Re-request →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-[color:var(--color-mute)] italic">
        To join another league, visit that league&rsquo;s sign-in page at
        <span className="font-mono"> /join/&lt;slug&gt;</span>.
      </p>
    </section>
  );
}
