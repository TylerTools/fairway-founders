import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { canAccessGln } from '@/lib/auth';
import FeedbackRow from '@/app/admin/feedback/FeedbackRow';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

type FeedbackKind = Database['public']['Enums']['feedback_kind'];
type FeedbackStatus = Database['public']['Enums']['feedback_status'];

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: 'New',
  in_review: 'In review',
  resolved: 'Resolved',
  wontfix: 'Won’t fix',
};
const STATUS_COLOR: Record<FeedbackStatus, string> = {
  new: '#c9a961',
  in_review: '#7c9885',
  resolved: '#5a5a4a',
  wontfix: '#a87c4f',
};

/**
 * GLN-wide feedback inbox. Includes every league's reports AND the global
 * (league_id IS NULL) platform-level bug reports that don't surface in any
 * single league cockpit. The 'scope' chip filters to a single bucket.
 */
export default async function GlnFeedbackInbox({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string;
    status?: string;
    scope?: string;
  }>;
}) {
  if (!(await canAccessGln())) redirect('/admin');

  const { kind: kindFilter, status: statusFilter, scope } = await searchParams;

  let q = supabase
    .from('feedback')
    .select(
      'id, kind, status, subject, body, created_at, league_id, user:user_id(id, name, email), league:league_id(name, short_name, slug)',
    )
    .order('created_at', { ascending: false });
  if (kindFilter === 'feedback' || kindFilter === 'issue') {
    q = q.eq('kind', kindFilter as FeedbackKind);
  }
  if (
    statusFilter === 'new' ||
    statusFilter === 'in_review' ||
    statusFilter === 'resolved' ||
    statusFilter === 'wontfix'
  ) {
    q = q.eq('status', statusFilter as FeedbackStatus);
  }
  if (scope === 'global') q = q.is('league_id', null);

  const res = await q;
  const rows = res.data ?? [];

  // Scope tab counts
  const scopeRes = await supabase.from('feedback').select('league_id');
  let allCount = 0;
  let globalCount = 0;
  for (const r of scopeRes.data ?? []) {
    allCount++;
    if (!r.league_id) globalCount++;
  }

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-3xl mx-auto w-full">
      <Link href="/gln" className="text-xs text-[color:var(--color-gold)]">
        ← GLN console
      </Link>
      <p className="mt-4 text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Platform · Inbox
      </p>
      <h1
        className="mt-1 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Feedback &amp; issues
      </h1>
      <p className="text-[11px] text-[color:var(--color-mute)] mt-1">
        {allCount} total across every league · {globalCount} global
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <Chip
          label={`All ${allCount}`}
          href="/gln/feedback"
          active={!scope}
        />
        <Chip
          label={`Global ${globalCount}`}
          href="/gln/feedback?scope=global"
          active={scope === 'global'}
        />
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[color:var(--color-mute)] italic">
          Inbox empty.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((r) => {
            const u = Array.isArray(r.user) ? r.user[0] : r.user;
            const lg = Array.isArray(r.league) ? r.league[0] : r.league;
            const created = new Date(r.created_at);
            return (
              <article
                key={r.id}
                className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
                      {r.kind === 'issue' ? 'App issue' : 'Program'}
                      {' · '}
                      {lg ? (
                        <span className="text-[color:var(--color-navy)]">
                          {lg.short_name || lg.name}
                        </span>
                      ) : (
                        <span className="text-[color:#a87c4f]">Global</span>
                      )}
                      {r.subject && ' · '}
                      {r.subject && (
                        <span className="text-[color:var(--color-ink)]">
                          {r.subject}
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[color:#1a3a2e]">
                      {r.body}
                    </p>
                    <p className="mt-2 text-[11px] text-[color:var(--color-mute)]">
                      {u ? `${u.name} · ${u.email}` : 'unknown'} ·{' '}
                      {created.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {created.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className="text-[9px] tracking-[0.1em] uppercase font-bold rounded-full px-2 py-0.5 text-white shrink-0"
                    style={{ background: STATUS_COLOR[r.status] }}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-[color:#f0ebd8]">
                  <FeedbackRow id={r.id} status={r.status} />
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
