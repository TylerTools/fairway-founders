'use client';

import { useActionState, useState, useTransition } from 'react';
import {
  updateLeague,
  deleteLeague,
  type LeagueFormState,
} from '@/app/actions/leagues';
import type { Database } from '@/lib/database.types';

type LeagueRow = Database['public']['Tables']['leagues']['Row'];

const initial: LeagueFormState = { ok: true };

export default function LeagueSettingsForm({ league }: { league: LeagueRow }) {
  const bound = updateLeague.bind(null, league.id);
  const [state, formAction, pending] = useActionState(bound, initial);
  const [deleting, startDelete] = useTransition();
  const [editing, setEditing] = useState(false);

  function onDelete() {
    if (
      !confirm(
        `Delete ${league.name}? Only allowed if no courses are attached.`,
      )
    )
      return;
    startDelete(async () => {
      try {
        await deleteLeague(league.id);
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-[color:#e8e2d2] bg-white p-4 space-y-2 text-sm">
        <Row label="Slug" value={league.slug} />
        <Row label="Short name" value={league.short_name ?? '—'} />
        <Row label="Description" value={league.description ?? '—'} multiline />
        <div className="pt-2 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs tracking-[0.1em] uppercase font-semibold text-[color:var(--color-gold)]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-xs tracking-[0.1em] uppercase font-semibold text-[color:#a13c3c] disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete league'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-[color:#e8e2d2] bg-white p-4 space-y-3"
    >
      <Field label="Name" name="name" defaultValue={league.name} required />
      <Field
        label="Short name"
        name="short_name"
        defaultValue={league.short_name ?? ''}
      />
      <Field label="Slug" name="slug" defaultValue={league.slug} />
      <Field
        label="Description"
        name="description"
        textarea
        defaultValue={league.description ?? ''}
      />
      {state.error && <p className="text-xs text-[color:#a13c3c]">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          onClick={() => setTimeout(() => setEditing(false), 80)}
          className="rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs tracking-[0.08em] uppercase text-[color:var(--color-mute)] px-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[color:var(--color-mute)] text-xs uppercase tracking-[0.08em] shrink-0">
        {label}
      </span>
      <span
        className={`text-right text-sm text-[color:var(--color-ink)] ${
          multiline ? 'whitespace-pre-wrap' : 'truncate'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  textarea,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
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
          defaultValue={defaultValue}
          rows={3}
          className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)] resize-y"
        />
      ) : (
        <input
          name={name}
          required={required}
          defaultValue={defaultValue}
          className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
        />
      )}
    </label>
  );
}
