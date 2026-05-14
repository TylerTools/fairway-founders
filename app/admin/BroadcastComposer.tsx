'use client';

import { useState, useTransition } from 'react';
import { sendBroadcast, type BroadcastState } from '@/app/actions/notifications';

const initial: BroadcastState = { ok: true };

export default function BroadcastComposer() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<BroadcastState>(initial);
  const [open, setOpen] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await sendBroadcast(initial, fd);
      setState(res);
      if (res.ok) form.reset();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setState(initial);
        }}
        className="w-full flex items-center justify-between rounded-xl border border-[color:#e8e2d2] bg-white px-4 py-3 hover:border-[color:var(--color-gold)]"
      >
        <span className="text-sm font-semibold">Send a message to the group</span>
        <span className="text-[10px] tracking-[0.1em] uppercase font-bold text-[color:var(--color-gold)]">
          Compose →
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-gold)] bg-white p-4">
      <div className="flex justify-between items-start">
        <p className="text-[10px] tracking-[0.15em] uppercase font-bold text-[color:var(--color-gold)]">
          Broadcast to all members
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] text-[color:var(--color-mute)] uppercase tracking-[0.08em]"
        >
          Close
        </button>
      </div>
      <p className="mt-1 text-[11px] text-[color:var(--color-mute)]">
        Shows up in every approved member's notification bell.
      </p>

      {state.ok && state.message ? (
        <div className="mt-3">
          <p className="text-sm">{state.message}</p>
          <button
            type="button"
            onClick={() => setState(initial)}
            className="mt-2 text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-gold)]"
          >
            Send another →
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-3">
          <label className="block">
            <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576]">
              Title <span className="text-[color:var(--color-gold)]">*</span>
            </span>
            <input
              name="title"
              required
              maxLength={140}
              placeholder="Reminder: cutoff is tonight at 8."
              className="mt-1 w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--color-gold)]"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576]">
              Details (optional)
            </span>
            <textarea
              name="body"
              rows={3}
              maxLength={2000}
              placeholder="Anything you want to add."
              className="mt-1 w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm resize-y focus:outline-none focus:border-[color:var(--color-gold)]"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576]">
              Link (optional)
            </span>
            <input
              name="link"
              type="text"
              maxLength={500}
              placeholder="/dashboard"
              className="mt-1 w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--color-gold)]"
            />
          </label>

          {state.error && (
            <p className="text-xs text-[color:#a13c3c]">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase disabled:opacity-60"
          >
            {pending ? 'Sending…' : 'Send to all approved members'}
          </button>
        </form>
      )}
    </div>
  );
}
