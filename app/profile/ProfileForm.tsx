'use client';

import { useActionState, useState } from 'react';
import { updateProfile, type ProfileFormState } from '@/app/actions/profile';
import type { Database } from '@/lib/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];

const initial: ProfileFormState = { ok: true };

export default function ProfileForm({ me }: { me: UserRow }) {
  const [state, formAction, pending] = useActionState(updateProfile, initial);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="space-y-4">
        <Display label="Bio" value={me.bio ?? '—'} />
        <Display label="Company" value={me.company ?? '—'} />
        <Display label="Role" value={me.professional_role ?? '—'} />
        <Display
          label="Handicap"
          value={
            me.handicap != null
              ? String(me.handicap)
              : 'Not set — leaderboard will use gross score.'
          }
        />
        <Display
          label="Can help with"
          value={(me.helps ?? []).length ? (me.helps ?? []).join(' · ') : '—'}
        />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs tracking-[0.1em] uppercase text-[color:var(--color-gold)] font-semibold"
        >
          Edit profile
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Bio"
        name="bio"
        defaultValue={me.bio ?? ''}
        textarea
        rows={3}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company" name="company" defaultValue={me.company ?? ''} />
        <Field
          label="Role"
          name="professional_role"
          defaultValue={me.professional_role ?? ''}
        />
      </div>
      <Field
        label="Handicap (0–54)"
        name="handicap"
        defaultValue={me.handicap != null ? String(me.handicap) : ''}
        type="number"
        step="0.1"
        min="0"
        max="54"
      />
      <Field
        label="Can help with (comma separated)"
        name="helps"
        defaultValue={(me.helps ?? []).join(', ')}
      />
      {state.error && (
        <p className="text-xs text-[color:#a13c3c]">{state.error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-md px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs tracking-[0.1em] uppercase text-[color:var(--color-mute)] px-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Display({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  textarea,
  rows,
  type,
  step,
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue: string;
  textarea?: boolean;
  rows?: number;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  const base =
    'w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white text-[color:var(--color-ink)] focus:outline-none focus:border-[color:var(--color-gold)]';
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
        {label}
      </span>
      <span className="block mt-1">
        {textarea ? (
          <textarea
            name={name}
            defaultValue={defaultValue}
            rows={rows ?? 3}
            className={`${base} resize-y`}
          />
        ) : (
          <input
            name={name}
            defaultValue={defaultValue}
            type={type ?? 'text'}
            step={step}
            min={min}
            max={max}
            className={base}
          />
        )}
      </span>
    </label>
  );
}
