'use client';

import { useActionState, useState } from 'react';
import { createEvent, type EventFormState } from '@/app/actions/events';

const initial: EventFormState = { ok: true };

export default function NewEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, initial);
  const [open, setOpen] = useState(false);
  const [recurrence, setRecurrence] = useState<'once' | 'weekly'>('once');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs tracking-[0.1em] uppercase font-semibold text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/60 rounded-full px-3 py-1.5"
      >
        + New event
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-[color:var(--color-gold)] bg-white p-4 space-y-3"
    >
      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-gold)] font-semibold">
        Schedule a new round
      </p>
      <Field
        label="Tee time (ET)"
        name="date"
        type="datetime-local"
        required
      />

      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold mb-1">
          Recurrence
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {(['once', 'weekly'] as const).map((opt) => (
            <label key={opt} className="cursor-pointer">
              <input
                type="radio"
                name="recurrence"
                value={opt}
                checked={recurrence === opt}
                onChange={() => setRecurrence(opt)}
                className="sr-only peer"
              />
              <span className="block text-center py-2 rounded-md border border-[color:#e8e2d2] text-xs font-semibold tracking-wide peer-checked:bg-[color:var(--color-navy)] peer-checked:text-[color:var(--color-gold)] peer-checked:border-[color:var(--color-navy)]">
                {opt === 'once' ? 'One-off' : 'Weekly series'}
              </span>
            </label>
          ))}
        </div>
        {recurrence === 'weekly' && (
          <label className="block mt-2">
            <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
              Number of weeks
            </span>
            <input
              type="number"
              name="repeat_count"
              min="2"
              max="52"
              defaultValue="8"
              className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
            />
            <span className="block text-[10px] text-[color:var(--color-mute)] mt-1 italic">
              Creates one event per week starting on the tee time above.
            </span>
          </label>
        )}
      </div>

      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold mb-1">
          Course layout
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {(['front', 'back', 'both'] as const).map((cfg) => (
            <label
              key={cfg}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <input
                type="radio"
                name="course_config"
                value={cfg}
                defaultChecked={cfg === 'front'}
                className="sr-only peer"
              />
              <span className="w-full text-center py-2 rounded-md border border-[color:#e8e2d2] text-xs font-semibold tracking-wide peer-checked:bg-[color:var(--color-navy)] peer-checked:text-[color:var(--color-gold)] peer-checked:border-[color:var(--color-navy)]">
                {cfg === 'front' ? 'Front 9' : cfg === 'back' ? 'Back 9' : 'All 18'}
              </span>
            </label>
          ))}
        </div>
      </div>
      <Field
        label="Green fee (USD)"
        name="fee_dollars"
        type="number"
        min="0"
        defaultValue="40"
      />
      <Field
        label="Pro-shop email"
        name="pro_shop_email"
        type="email"
        defaultValue="proshop@legacygolfclub.com"
      />
      {state.error && <p className="text-xs text-[color:#a13c3c]">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-md px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Schedule'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs tracking-[0.1em] uppercase text-[color:var(--color-mute)] px-2"
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
  type,
  min,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  min?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
        {label}
      </span>
      <input
        type={type}
        name={name}
        min={min}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
      />
    </label>
  );
}
