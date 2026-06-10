'use client';

import { useActionState, useTransition, useState } from 'react';
import {
  updateCourse,
  deleteCourse,
  type CourseFormState,
} from '@/app/actions/courses';
import type { Database } from '@/lib/database.types';

type CourseRow = Database['public']['Tables']['courses']['Row'];

const initial: CourseFormState = { ok: true };

export default function CourseSettingsForm({ course }: { course: CourseRow }) {
  const bound = updateCourse.bind(null, course.id);
  const [state, formAction, pending] = useActionState(bound, initial);
  const [deleting, startDelete] = useTransition();
  const [editing, setEditing] = useState(false);

  function onDelete() {
    if (
      !confirm(
        `Delete ${course.name}? This is only allowed when no events are scheduled at this course.`,
      )
    )
      return;
    startDelete(async () => {
      try {
        await deleteCourse(course.id);
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-[color:#e8e2d2] bg-white p-4 space-y-2 text-sm">
        <Row label="Short name" value={course.short_name ?? '—'} />
        <Row label="Address" value={course.address ?? '—'} />
        <Row
          label="City / State"
          value={
            [course.city, course.state].filter(Boolean).join(', ') || '—'
          }
        />
        <Row label="Website" value={course.website_url ?? '—'} />
        <Row
          label="Default pro-shop email"
          value={course.default_pro_shop_email ?? '—'}
        />
        <Row label="Notes" value={course.notes ?? '—'} multiline />
        <div className="pt-2 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs tracking-[0.1em] uppercase font-semibold text-[color:var(--color-gold)]"
          >
            Edit settings
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-xs tracking-[0.1em] uppercase font-semibold text-[color:#a13c3c] disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete course'}
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
      <Field label="Name" name="name" defaultValue={course.name} required />
      <Field
        label="Short name"
        name="short_name"
        defaultValue={course.short_name ?? ''}
      />
      <Field
        label="Address"
        name="address"
        defaultValue={course.address ?? ''}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" name="city" defaultValue={course.city ?? ''} />
        <Field label="State" name="state" defaultValue={course.state ?? ''} />
      </div>
      <Field
        label="Website URL"
        name="website_url"
        type="url"
        defaultValue={course.website_url ?? ''}
      />
      <Field
        label="Default pro-shop email"
        name="default_pro_shop_email"
        type="email"
        defaultValue={course.default_pro_shop_email ?? ''}
      />
      <Field
        label="Notes"
        name="notes"
        textarea
        defaultValue={course.notes ?? ''}
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
  type = 'text',
  defaultValue,
  required,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
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
          type={type}
          name={name}
          required={required}
          defaultValue={defaultValue}
          className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
        />
      )}
    </label>
  );
}
