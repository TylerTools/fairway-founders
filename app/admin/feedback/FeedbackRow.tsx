'use client';

import { useTransition } from 'react';
import { updateFeedbackStatus } from '@/app/actions/feedback';
import type { Database } from '@/lib/database.types';

type FeedbackStatus = Database['public']['Enums']['feedback_status'];

const STATUSES: { value: FeedbackStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'wontfix', label: 'Won&rsquo;t fix' },
];

export default function FeedbackRow({
  id,
  status,
}: {
  id: string;
  status: FeedbackStatus;
}) {
  const [pending, startTransition] = useTransition();

  function set(next: FeedbackStatus) {
    if (next === status) return;
    startTransition(async () => {
      await updateFeedbackStatus(id, next);
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => set(s.value)}
          disabled={pending}
          className={`text-[10px] tracking-[0.08em] uppercase font-semibold rounded-full px-2.5 py-1 border ${
            status === s.value
              ? 'bg-[color:var(--color-navy)] text-[color:var(--color-gold)] border-[color:var(--color-navy)]'
              : 'bg-white text-[color:#5a5a4a] border-[color:#e8e2d2]'
          } disabled:opacity-60`}
          dangerouslySetInnerHTML={{ __html: s.label }}
        />
      ))}
    </div>
  );
}
