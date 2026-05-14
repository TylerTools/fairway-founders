'use client';

import { useState, useTransition } from 'react';
import { sendInvite, type InviteState } from '@/app/actions/invites';

const initial: InviteState = { ok: true };

export default function InviteFriend() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<InviteState>(initial);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await sendInvite(initial, fd);
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
        className="w-full rounded-xl border border-[color:var(--color-gold)] bg-white p-4 text-left hover:bg-[color:#f5f1e8]/40"
      >
        <p className="text-[10px] tracking-[0.15em] uppercase font-bold text-[color:var(--color-gold)]">
          Grow the network
        </p>
        <p className="mt-1 text-sm font-semibold">
          Invite a friend →
        </p>
        <p className="text-[11px] text-[color:var(--color-mute)] mt-0.5">
          Sends an email with a sign-up link.
        </p>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-gold)] bg-white p-4">
      <div className="flex justify-between items-start">
        <p className="text-[10px] tracking-[0.15em] uppercase font-bold text-[color:var(--color-gold)]">
          Invite a friend
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] text-[color:var(--color-mute)] uppercase tracking-[0.08em]"
        >
          Close
        </button>
      </div>

      {state.ok && state.sentTo ? (
        <div className="mt-3">
          <p className="text-sm">
            Invite sent to{' '}
            <strong className="text-[color:var(--color-ink)]">
              {state.sentTo}
            </strong>
            .
          </p>
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
          <Input
            name="email"
            type="email"
            label="Their email"
            placeholder="friend@example.com"
            required
          />
          <Input
            name="name"
            label="Their first name (optional)"
            placeholder="Sam"
          />
          <label className="block">
            <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576]">
              A short note (optional)
            </span>
            <textarea
              name="note"
              rows={2}
              maxLength={500}
              placeholder="Thought you'd be a great fit for this group…"
              className="mt-1 w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm resize-y focus:outline-none focus:border-[color:var(--color-gold)]"
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
            {pending ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      )}
    </div>
  );
}

function Input({
  name,
  type,
  label,
  placeholder,
  required,
}: {
  name: string;
  type?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576]">
        {label}
        {required && <span className="text-[color:var(--color-gold)]"> *</span>}
      </span>
      <input
        name={name}
        type={type ?? 'text'}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--color-gold)]"
      />
    </label>
  );
}
