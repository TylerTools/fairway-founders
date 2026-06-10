'use client';

import { useActionState, useState } from 'react';
import { createCourse, type CourseFormState } from '@/app/actions/courses';

const initial: CourseFormState = { ok: true };

export default function NewCourseForm({ leagueId }: { leagueId: string }) {
  const bound = createCourse.bind(null, leagueId);
  const [state, formAction, pending] = useActionState(bound, initial);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[color:var(--color-gold)] bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-[color:var(--color-ink)] hover:bg-[color:#f5f1e8]/40"
      >
        + New course
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full sm:w-auto sm:min-w-[360px] rounded-xl border border-[color:var(--color-gold)] bg-white p-4 space-y-3"
    >
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-gold)]">
        Add a course
      </p>
      <Field label="Name" name="name" required />
      <Field label="Short name (optional)" name="short_name" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" name="city" />
        <Field label="State" name="state" />
      </div>
      <Field label="Address" name="address" />
      <Field label="Website URL" name="website_url" type="url" />
      <Field
        label="Default pro-shop email"
        name="default_pro_shop_email"
        type="email"
      />
      {state.error && <p className="text-xs text-[color:#a13c3c]">{state.error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
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
  type = 'text',
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
        {label}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
      />
    </label>
  );
}
