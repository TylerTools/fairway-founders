'use client';

import { useActionState, useState, useTransition } from 'react';
import {
  queueAdminBlast,
  previewAudience,
  type BlastFormState,
} from '@/app/actions/email';
import type { Database } from '@/lib/database.types';

type Audience = Database['public']['Enums']['email_audience'];

const initial: BlastFormState = { ok: true };

const OPTIONS: { value: Audience; label: string; sub: string }[] = [
  {
    value: 'all_approved',
    label: 'All approved members',
    sub: 'Every approved founder',
  },
  {
    value: 'this_week_rsvps',
    label: "This week's RSVPs",
    sub: 'Only those confirmed for the next round',
  },
  {
    value: 'this_week_no_rsvps',
    label: 'Not yet RSVPed',
    sub: 'Approved members who haven’t RSVPed this week',
  },
  {
    value: 'pending_applicants',
    label: 'Pending applicants',
    sub: 'People waiting on access approval',
  },
  {
    value: 'all_admins',
    label: 'All admins',
    sub: 'Just the admin team',
  },
];

export default function BlastComposer() {
  const [state, formAction, pending] = useActionState(queueAdminBlast, initial);
  const [audience, setAudience] = useState<Audience>('all_approved');
  const [count, setCount] = useState<number | null>(null);
  const [previewing, startPreview] = useTransition();

  function refreshCount(next: Audience) {
    setAudience(next);
    setCount(null);
    startPreview(async () => {
      const n = await previewAudience(next);
      setCount(n);
    });
  }

  return (
    <section className="rounded-xl border border-[color:#e8e2d2] bg-white p-5">
      <p
        className="text-xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Compose blast
      </p>
      <p className="mt-1 text-xs text-[color:var(--color-mute)]">
        Pick an audience, write the message, queue it. Sending happens once a
        Resend API key is in env.
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="audience" value={audience} />

        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold mb-2">
            Audience
          </p>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => refreshCount(opt.value)}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                  audience === opt.value
                    ? 'border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-[color:var(--color-cream)]'
                    : 'border-[color:#e8e2d2] bg-white hover:border-[color:var(--color-gold)]'
                }`}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {opt.label}
                </p>
                <p
                  className={`text-[10px] tracking-[0.05em] mt-0.5 ${
                    audience === opt.value
                      ? 'text-[color:#a8a596]'
                      : 'text-[color:var(--color-mute)]'
                  }`}
                >
                  {opt.sub}
                </p>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[color:var(--color-mute)]">
            {previewing
              ? 'Counting recipients…'
              : count != null
                ? `${count} recipient${count === 1 ? '' : 's'} right now.`
                : 'Tap an audience to see how many people are in it.'}
          </p>
        </div>

        <label className="block">
          <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
            Subject
          </span>
          <input
            type="text"
            name="subject"
            maxLength={200}
            required
            placeholder="e.g. Move this week's round to 3 PM"
            className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
          />
        </label>

        <label className="block">
          <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
            Body
          </span>
          <textarea
            name="body"
            rows={8}
            maxLength={8000}
            required
            placeholder="Plain text. Plain enough for now."
            className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)] resize-y font-mono"
          />
        </label>

        {state.error && (
          <p className="text-xs text-[color:#a13c3c]">{state.error}</p>
        )}
        {state.ok && state.message && (
          <p className="text-xs text-[color:#7c9885]">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending || count === 0}
          className="rounded-lg bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-5 py-2.5 text-xs font-semibold tracking-[0.1em] uppercase disabled:opacity-60"
        >
          {pending ? 'Queueing…' : 'Queue blast'}
        </button>
      </form>
    </section>
  );
}
