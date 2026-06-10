import Link from 'next/link';
import Image from 'next/image';
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
      aria-label="Start playing"
      className="group fixed bottom-28 lg:bottom-6 left-4 lg:left-6 z-30 block"
    >
      <Image
        src="/Start Playing.png"
        alt="Start playing"
        width={224}
        height={224}
        priority
        className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-2xl transition-transform group-hover:scale-105 group-active:scale-95"
      />
    </Link>
  );
}
