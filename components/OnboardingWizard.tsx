'use client';

import { useState, useTransition } from 'react';
import { submitOnboarding, type OnboardingState } from '@/app/actions/onboarding';

const initial: OnboardingState = { ok: true };

export default function OnboardingWizard({ name }: { name: string }) {
  const first = name.split(' ')[0] || 'there';
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<OnboardingState>(initial);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitOnboarding(initial, fd);
      setState(res);
    });
  }

  return (
    <main className="px-6 py-12 max-w-md mx-auto w-full">
      <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-mute)]">
        Welcome aboard
      </p>
      <h1
        className="mt-2 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Tell us about yourself, {first}.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[color:#5a5a4a]">
        Give the admin a sense of who you are before they approve access.
        Two minutes, and you're done.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field
          label="What do you do?"
          name="professional_role"
          required
          placeholder="Founder, CTO, Head of Sales…"
        />
        <Field
          label="Company"
          name="company"
          required
          placeholder="Where you're building"
        />
        <Field
          label="Short bio"
          name="bio"
          textarea
          placeholder="A line or two on what you're working on or what makes you tick."
          rows={3}
        />
        <Field
          label="Golf handicap (optional)"
          name="handicap"
          type="number"
          step="0.1"
          min="0"
          max="54"
          placeholder="0–54. Leave blank if you don't have one yet."
        />
        <Field
          label="Can help with (comma-separated, optional)"
          name="helps"
          placeholder="Fundraising, hiring, GTM, design…"
        />

        {state.error && (
          <p className="text-xs text-[color:#a13c3c]">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-4 text-sm font-semibold tracking-[0.1em] uppercase shadow-lg shadow-[color:var(--color-navy)]/25 hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Submitting…' : 'Submit for review'}
        </button>
        <p className="text-[11px] text-[color:var(--color-mute)] text-center italic">
          An admin will get notified and approve your access.
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  textarea,
  rows,
  type,
  step,
  min,
  max,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576]">
        {label}
        {required && <span className="text-[color:var(--color-gold)]"> *</span>}
      </span>
      <span className="block mt-1">
        {textarea ? (
          <textarea
            name={name}
            required={required}
            placeholder={placeholder}
            rows={rows ?? 3}
            className="w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm resize-y focus:outline-none focus:border-[color:var(--color-gold)]"
          />
        ) : (
          <input
            name={name}
            required={required}
            placeholder={placeholder}
            type={type ?? 'text'}
            step={step}
            min={min}
            max={max}
            className="w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--color-gold)]"
          />
        )}
      </span>
    </label>
  );
}
