'use client';

import { useActionState, useState, useTransition } from 'react';
import {
  addCourseContact,
  deleteCourseContact,
  setPrimaryContact,
  type CourseFormState,
} from '@/app/actions/courses';

const initial: CourseFormState = { ok: true };

interface Contact {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  user_id: string | null;
  notes: string | null;
}

interface MemberOption {
  id: string;
  name: string;
  email: string;
}

export default function ContactList({
  courseId,
  contacts,
  memberOptions,
}: {
  courseId: string;
  contacts: Contact[];
  memberOptions: MemberOption[];
}) {
  const bound = addCourseContact.bind(null, courseId);
  const [state, formAction, pending] = useActionState(bound, initial);
  const [adding, setAdding] = useState(false);
  const [busy, startTransition] = useTransition();

  function onDelete(id: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return;
    startTransition(() => deleteCourseContact(id, courseId));
  }
  function onPromote(id: string) {
    startTransition(() => setPrimaryContact(id, courseId));
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 ? (
        <p className="text-sm text-[color:var(--color-mute)] italic px-1">
          No contacts yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className={`rounded-xl border bg-white p-4 ${
                c.is_primary ? 'border-[color:var(--color-gold)]' : 'border-[color:#e8e2d2]'
              }`}
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-base font-semibold"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {c.name}
                    </p>
                    {c.is_primary && (
                      <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-gold)] text-[color:var(--color-navy)] rounded-full px-2 py-0.5">
                        Primary
                      </span>
                    )}
                    {c.user_id && (
                      <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full px-2 py-0.5">
                        Course staff
                      </span>
                    )}
                  </div>
                  {c.role && (
                    <p className="text-xs text-[color:#5a5a4a] mt-0.5">{c.role}</p>
                  )}
                  {(c.email || c.phone) && (
                    <p className="text-[11px] text-[color:var(--color-mute)] mt-1">
                      {[c.email, c.phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {c.notes && (
                    <p className="text-xs text-[color:#5a5a4a] mt-2 whitespace-pre-wrap">
                      {c.notes}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {!c.is_primary && (
                    <button
                      type="button"
                      onClick={() => onPromote(c.id)}
                      disabled={busy}
                      className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-gold)] disabled:opacity-60"
                    >
                      Set primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(c.id, c.name)}
                    disabled={busy}
                    className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:#a13c3c] disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          action={formAction}
          className="rounded-xl border border-[color:var(--color-gold)] bg-white p-4 space-y-3"
        >
          <Field label="Name" name="name" required />
          <Field label="Role / title" name="role" placeholder="Head Pro, Manager…" />
          <Field label="Email" name="email" type="email" />
          <Field label="Phone" name="phone" />
          <label className="block">
            <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
              Link to a member (grants course-staff access)
            </span>
            <select
              name="user_id"
              className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
              defaultValue=""
            >
              <option value="">— Not a member yet —</option>
              {memberOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </label>
          <Field label="Notes" name="notes" textarea />
          <label className="flex items-center gap-2 text-xs text-[color:#5a5a4a]">
            <input
              type="checkbox"
              name="is_primary"
              className="w-4 h-4 accent-[color:var(--color-navy)]"
            />
            Primary contact for this course
          </label>
          {state.error && (
            <p className="text-xs text-[color:#a13c3c]">{state.error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              onClick={() => setTimeout(() => setAdding(false), 80)}
              className="rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
            >
              {pending ? 'Saving…' : 'Add contact'}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs tracking-[0.08em] uppercase text-[color:var(--color-mute)] px-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full border border-[color:var(--color-gold)] bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-[color:var(--color-ink)] hover:bg-[color:#f5f1e8]/40"
        >
          + Add contact
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  textarea,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  placeholder?: string;
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
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
        />
      )}
    </label>
  );
}
