'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import {
  updateEvent,
  deleteEvent,
  endEventSeries,
  type EventFormState,
} from '@/app/actions/events';
import type { Database } from '@/lib/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];
type CourseConfig = Database['public']['Enums']['course_config'];

const initial: EventFormState = { ok: true };

export default function EventSettingsForm({ event }: { event: EventRow }) {
  const boundUpdate = updateEvent.bind(null, event.id);
  const [state, formAction, pending] = useActionState(boundUpdate, initial);
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [endingSeries, startEnd] = useTransition();
  const [seriesMsg, setSeriesMsg] = useState<string | null>(null);
  const submittedRef = useRef(false);

  // Collapse back to read-only only after a SUCCESSFUL save — never on a hidden
  // timer (the old setTimeout swallowed validation/save errors by unmounting
  // the form before the error could render).
  useEffect(() => {
    if (submittedRef.current && !pending && state.ok) {
      submittedRef.current = false;
      setEditing(false);
    }
  }, [pending, state]);

  const courseConfig: CourseConfig = event.course_config;
  const feeDollars = (event.fee_cents / 100).toFixed(0);

  // Prefill the datetime-local input with the event's actual ET wall-clock
  // (DST-correct — EDT in summer, EST in winter; no longer hardcoded to -04:00).
  const eventDate = new Date(event.date);
  const localStr = etInputValue(eventDate);

  function onDelete() {
    if (!confirm('Delete this event and all its RSVPs/foursomes/scores?')) return;
    startDelete(async () => {
      await deleteEvent(event.id);
    });
  }

  function onEndSeries() {
    if (
      !confirm(
        'End this weekly series? Future unplayed rounds will be removed; any events that already have groups or scores stay put.',
      )
    )
      return;
    setSeriesMsg(null);
    startEnd(async () => {
      const res = await endEventSeries(event.id);
      if (!res.ok) {
        setSeriesMsg(res.error ?? 'Could not end series.');
        return;
      }
      const removed = res.removed ?? 0;
      const skipped = res.skipped ?? 0;
      const parts: string[] = [];
      parts.push(
        removed === 0
          ? 'No upcoming rounds to remove.'
          : `Removed ${removed} upcoming round${removed === 1 ? '' : 's'}.`,
      );
      if (skipped > 0) {
        parts.push(
          `${skipped} kept (already have groups or scores).`,
        );
      }
      setSeriesMsg(parts.join(' '));
    });
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 space-y-1.5">
        <Row label="Course layout" value={labelFor(event.course_config)} />
        <Row label="Green fee" value={`$${feeDollars}`} />
        <Row label="Pro-shop email" value={event.pro_shop_email ?? '—'} />
        <Row
          label="Tee time"
          value={eventDate.toLocaleString('en-US', {
            timeZone: 'America/New_York',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        />
        {event.series_id && (
          <Row label="Series" value="Part of a weekly series" />
        )}
        {seriesMsg && (
          <p className="text-[11px] text-[color:var(--color-mute)] italic pt-1">
            {seriesMsg}
          </p>
        )}
        <div className="pt-2 flex justify-between items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs tracking-[0.1em] uppercase font-semibold text-[color:var(--color-gold)]"
          >
            Edit settings
          </button>
          <div className="flex gap-3 items-center">
            {event.series_id && (
              <button
                type="button"
                onClick={onEndSeries}
                disabled={endingSeries}
                className="text-xs tracking-[0.1em] uppercase font-semibold text-[color:var(--color-mute)] disabled:opacity-60"
              >
                {endingSeries ? 'Ending…' : 'End series'}
              </button>
            )}
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
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => {
        submittedRef.current = true;
      }}
      className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 space-y-3"
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

/** Format an instant as a `YYYY-MM-DDTHH:mm` string in ET, for prefilling a
 *  <input type="datetime-local"> with the event's actual local wall-clock. */
function etInputValue(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  // hour12:false can emit '24' for midnight in some runtimes — normalize to '00'.
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
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
