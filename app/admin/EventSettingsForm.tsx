'use client';

import { useActionState, useState, useTransition } from 'react';
import { updateEvent, deleteEvent, type EventFormState } from '@/app/actions/events';
import type { Database } from '@/lib/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];
type CourseConfig = Database['public']['Enums']['course_config'];

const initial: EventFormState = { ok: true };

export default function EventSettingsForm({ event }: { event: EventRow }) {
  const boundUpdate = updateEvent.bind(null, event.id);
  const [state, formAction, pending] = useActionState(boundUpdate, initial);
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();

  const courseConfig: CourseConfig = event.course_config;
  const feeDollars = (event.fee_cents / 100).toFixed(0);

  // Convert UTC date to ET local for the datetime-local input.
  // We assume EDT (-04:00); ignored if admin doesn't edit the date.
  const eventDate = new Date(event.date);
  const offsetMs = -4 * 60 * 60 * 1000;
  const local = new Date(eventDate.getTime() + offsetMs);
  const localStr = local.toISOString().slice(0, 16);

  function onDelete() {
    if (!confirm('Delete this event and all its RSVPs/foursomes/scores?')) return;
    startDelete(async () => {
      await deleteEvent(event.id);
    });
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-[color:#e8e2d2] bg-white p-4 space-y-1.5">
        <Row label="Course layout" value={labelFor(event.course_config)} />
        <Row label="Green fee" value={`$${feeDollars}`} />
        <Row label="Pro-shop email" value={event.pro_shop_email ?? '—'} />
        <Row
          label="Tee time"
          value={eventDate.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        />
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
            {deleting ? 'Deleting…' : 'Delete event'}
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
      <Field label="Tee time (ET)" name="date" type="datetime-local" defaultValue={localStr} />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold mb-1">
          Course layout
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {(['front', 'back', 'both'] as CourseConfig[]).map((cfg) => (
            <label
              key={cfg}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <input
                type="radio"
                name="course_config"
                value={cfg}
                defaultChecked={courseConfig === cfg}
                className="sr-only peer"
              />
              <span className="w-full text-center py-2 rounded-md border border-[color:#e8e2d2] text-xs font-semibold tracking-wide peer-checked:bg-[color:var(--color-navy)] peer-checked:text-[color:var(--color-gold)] peer-checked:border-[color:var(--color-navy)]">
                {labelFor(cfg)}
              </span>
            </label>
          ))}
        </div>
      </div>
      <Field label="Green fee (USD)" name="fee_dollars" type="number" min="0" defaultValue={feeDollars} />
      <Field label="Pro-shop email" name="pro_shop_email" type="email" defaultValue={event.pro_shop_email ?? ''} />
      {state.error && <p className="text-xs text-[color:#a13c3c]">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-md px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
          onClick={() => setTimeout(() => setEditing(false), 50)}
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

function labelFor(cfg: CourseConfig): string {
  return cfg === 'front' ? 'Front 9' : cfg === 'back' ? 'Back 9' : 'All 18';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-[color:var(--color-mute)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  min,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  min?: string;
  defaultValue: string;
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
        defaultValue={defaultValue}
        className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
      />
    </label>
  );
}
