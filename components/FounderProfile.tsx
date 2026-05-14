'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  getMyAppProfile,
  updateProfile,
  type AppProfileSnapshot,
  type ProfileFormState,
} from '@/app/actions/profile';

const initial: ProfileFormState = { ok: true };

export default function FounderProfile() {
  const [data, setData] = useState<AppProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ProfileFormState>(initial);

  async function refresh() {
    const next = await getMyAppProfile();
    setData(next);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProfile(initial, fd);
      setState(res);
      if (res.ok) {
        await refresh();
        setEditing(false);
      }
    });
  }

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-[color:#8a8576]">
        Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-10 text-center text-sm text-[color:#8a8576]">
        Sign in to see your founder details.
      </div>
    );
  }

  if (!editing) {
    return (
      <div
        className="space-y-5"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <Header
          subtitle="The non-auth side of your member profile."
          onEdit={() => setEditing(true)}
        />
        <Row label="Bio" value={data.bio ?? '—'} multiline />
        <Row label="Company" value={data.company ?? '—'} />
        <Row label="Role" value={data.professional_role ?? '—'} />
        <Row
          label="Handicap"
          value={
            data.handicap != null
              ? String(data.handicap)
              : 'Not set — leaderboard will use your gross score.'
          }
        />
        <Row
          label="Can help with"
          value={data.helps.length ? data.helps.join(' · ') : '—'}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Header
        subtitle="The non-auth side of your member profile."
        onEdit={null}
      />
      <Field
        label="Bio"
        name="bio"
        defaultValue={data.bio ?? ''}
        textarea
        rows={3}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company" name="company" defaultValue={data.company ?? ''} />
        <Field
          label="Role"
          name="professional_role"
          defaultValue={data.professional_role ?? ''}
        />
      </div>
      <Field
        label="Handicap (0–54)"
        name="handicap"
        defaultValue={data.handicap != null ? String(data.handicap) : ''}
        type="number"
        step="0.1"
        min="0"
        max="54"
      />
      <Field
        label="Can help with (comma separated)"
        name="helps"
        defaultValue={data.helps.join(', ')}
      />
      {state.error && (
        <p className="text-xs" style={{ color: '#a13c3c' }}>
          {state.error}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
          style={{ background: '#1a3a2e', color: '#c9a961' }}
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs tracking-[0.1em] uppercase px-2"
          style={{ color: '#8a8576' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Header({
  subtitle,
  onEdit,
}: {
  subtitle: string;
  onEdit: (() => void) | null;
}) {
  return (
    <div>
      <div className="flex justify-between items-start gap-3">
        <div>
          <h1
            className="text-2xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#1a3a2e' }}
          >
            Founder details
          </h1>
          <p className="mt-1 text-xs" style={{ color: '#8a8576' }}>
            {subtitle}
          </p>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs tracking-[0.1em] uppercase font-semibold"
            style={{ color: '#c9a961' }}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p
        className="text-[10px] tracking-[0.15em] uppercase font-semibold"
        style={{ color: '#8a8576' }}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-sm leading-relaxed ${
          multiline ? 'whitespace-pre-wrap' : ''
        }`}
        style={{ color: '#1a3a2e' }}
      >
        {value}
      </p>
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
  const baseStyle: React.CSSProperties = {
    border: '1px solid #e8e2d2',
    background: '#fff',
    color: '#1a3a2e',
  };
  return (
    <label className="block">
      <span
        className="text-[10px] tracking-[0.15em] uppercase font-semibold"
        style={{ color: '#8a8576' }}
      >
        {label}
      </span>
      <span className="block mt-1">
        {textarea ? (
          <textarea
            name={name}
            defaultValue={defaultValue}
            rows={rows ?? 3}
            className="w-full rounded-md px-2.5 py-2 text-sm resize-y focus:outline-none"
            style={baseStyle}
          />
        ) : (
          <input
            name={name}
            defaultValue={defaultValue}
            type={type ?? 'text'}
            step={step}
            min={min}
            max={max}
            className="w-full rounded-md px-2.5 py-2 text-sm focus:outline-none"
            style={baseStyle}
          />
        )}
      </span>
    </label>
  );
}
