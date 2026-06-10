'use client';

import { useActionState, useState } from 'react';
import { createLeague, type LeagueFormState } from '@/app/actions/leagues';

const initial: LeagueFormState = { ok: true };

export default function NewLeagueForm() {
  const [state, formAction, pending] = useActionState(createLeague, initial);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[color:var(--color-gold)] bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-[color:var(--color-ink)] hover:bg-[color:#f5f1e8]/40"
      >
        + New league
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full sm:w-auto sm:min-w-[360px] rounded-xl border border-[color:var(--color-gold)] bg-white p-4 space-y-3"
    >
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-gold)]">
        Add a league
      </p>
      <Field label="Name" name="name" required placeholder="Fairway Founders Sarasota" />
      <Field label="Short name" name="short_name" placeholder="Sarasota" />
      <Field label="Slug (URL)" name="slug" placeholder="auto from name" />
      <Field label="Description" name="description" textarea />
      {state.error && (
        <p className="text-xs text-[color:#a13c3c]">{state.error}</p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          onClick={() => setTimeout(() => setOpen(false), 80)}
          className="rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs tracking-[0.08em] uppercase text-[color:var(--color-mute)] px-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  textarea,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          rows={2}
          placeholder={placeholder}
          className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)] resize-y"
        />
      ) : (
        <input
          name={name}
          required={required}
          placeholder={placeholder}
          className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
        />
      )}
    </label>
  );
}
