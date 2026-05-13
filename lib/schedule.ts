import type { Database } from './database.types';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type CourseConfig = Database['public']['Enums']['course_config'];
export type EventStatus = Database['public']['Enums']['event_status'];

export const COURSE_OPTIONS: Record<
  CourseConfig,
  { label: string; range: string; holes: number[] }
> = {
  front: { label: 'Front 9', range: '1–9', holes: Array.from({ length: 9 }, (_, i) => i + 1) },
  back: { label: 'Back 9', range: '10–18', holes: Array.from({ length: 9 }, (_, i) => i + 10) },
  both: { label: 'All 18', range: '1–18', holes: Array.from({ length: 18 }, (_, i) => i + 1) },
};

/** Derive status from event timestamps; ignore the stored status. */
export function liveStatus(evt: EventRow, now = Date.now()): EventStatus {
  const opens = new Date(evt.opens_at).getTime();
  const closes = new Date(evt.closes_at).getTime();
  const date = new Date(evt.date).getTime();
  if (now < opens) return 'locked';
  if (now < closes) return 'open';
  if (now < date) return 'closed';
  return 'past';
}

export function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US')}`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'CLOSED';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

export function lastName(fullName: string): string {
  const cleaned = fullName.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s+/, '');
  const parts = cleaned.split(' ');
  return parts[parts.length - 1].toUpperCase();
}
