import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import FeedbackRow from './FeedbackRow';
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

export default async function FeedbackInbox({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string }>;
}) {
  const me = await getAppUser();
  const view = await getViewMode(me?.app_role ?? null);
  if (!me) redirect('/');
  if (me.app_role !== 'admin' || view !== 'admin') redirect('/dashboard');

  const { kind: kindFilter, status: statusFilter } = await searchParams;

  let q = supabase
    .from('feedback')
    .select(
      'id, kind, status, subject, body, created_at, user:user_id(id, name, email)',
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
  const res = await q;
  const rows = res.data ?? [];

  // Counts for filter chips
  const countsRes = await supabase.from('feedback').select('kind, status');
  const counts = {
    all: countsRes.data?.length ?? 0,
    feedback: 0,
    issue: 0,
    new: 0,
  };
  for (const r of countsRes.data ?? []) {
    if (r.kind === 'feedback') counts.feedback += 1;
    if (r.kind === 'issue') counts.issue += 1;
    if (r.status === 'new') counts.new += 1;
  }

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-3xl mx-auto w-full">
      <Link
        href="/admin"
        className="text-xs text-[color:var(--color-gold)]"
      >
        ← Admin
      </Link>
      <p className="mt-4 text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        Inbox
      </p>
      <h1
        className="mt-1 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Feedback &amp; issues
      </h1>
      <p className="text-[11px] text-[color:var(--color-mute)] mt-1">
        {counts.all} total · {counts.new} new
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <Chip
          label={`All ${counts.all}`}
          href="/admin/feedback"
          active={!kindFilter && !statusFilter}
        />
        <Chip
          label={`Program ${counts.feedback}`}
          href="/admin/feedback?kind=feedback"
          active={kindFilter === 'feedback'}
        />
        <Chip
          label={`Issues ${counts.issue}`}
          href="/admin/feedback?kind=issue"
          active={kindFilter === 'issue'}
        />
        <Chip
          label={`New ${counts.new}`}
          href="/admin/feedback?status=new"
          active={statusFilter === 'new'}
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
            const created = new Date(r.created_at);
            return (
              <article
                key={r.id}
                className="rounded-xl border border-[color:#e8e2d2] bg-white p-4"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
                      {r.kind === 'issue' ? 'App issue' : 'Program'}
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
                    dangerouslySetInnerHTML={{ __html: STATUS_LABEL[r.status] }}
                  />
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
