import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/lib/current-user';

const PLAY_WINDOW_START_HOUR_LOCAL = 13; // 1:00 PM — appears 90 min before tee-off
const PLAY_WINDOW_END_HOUR_LOCAL = 20;   // 8:00 PM — gone by evening

function isWithinPlayWindow(): boolean {
  const now = new Date();
  const h = now.getHours();
  return h >= PLAY_WINDOW_START_HOUR_LOCAL && h < PLAY_WINDOW_END_HOUR_LOCAL;
}

export default async function PlayNowBall({ me }: { me: AppUser }) {
  if (!isWithinPlayWindow()) return null;

  const today = new Date().toISOString().slice(0, 10);

  const res = await supabase
    .from('rsvps')
    .select('event_id, events:event_id(id, date, status)')
    .eq('user_id', me.id);

  const todays = (res.data ?? []).find((r) => {
    const e = Array.isArray(r.events) ? r.events[0] : r.events;
    return e && e.date === today && e.status !== 'past';
  });

  if (!todays) return null;

  return (
    <Link
      href="/dashboard"
      aria-label="Play now"
      className="group fixed bottom-28 lg:bottom-6 left-4 lg:left-6 z-30 flex flex-col items-center"
    >
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-2xl shadow-black/40 transition-transform group-hover:scale-105 group-active:scale-95">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 30% 28%, #ffffff 0%, #f5f1e8 38%, #d6cfb8 78%, #8a8576 100%)',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 rounded-full opacity-50 mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #c9c4af 1.4px, transparent 1.6px), radial-gradient(circle, #c9c4af 1.4px, transparent 1.6px)',
            backgroundSize: '14px 14px, 14px 14px',
            backgroundPosition: '0 0, 7px 7px',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 70% 75%, rgba(0,0,0,0.25) 0%, transparent 55%)',
          }}
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-bold text-[color:var(--color-navy)] text-center leading-tight px-2 drop-shadow-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Play
            <br />
            Now
          </span>
        </div>
      </div>
    </Link>
  );
}
