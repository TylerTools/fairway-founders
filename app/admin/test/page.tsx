import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';
import { getCurrentLeague } from '@/lib/league-context';
import TestGameForm from './TestGameForm';

export const dynamic = 'force-dynamic';

/**
 * Live test-game setup. Pick a course + the players, and one button spins up an
 * open, gross-scored nine-hole scramble with groups already built — then drops
 * you on the live leaderboard. Built for testing gameplay with real people.
 */
export default async function TestGamePage() {
  const me = await getAppUser();
  if (!me) redirect('/');
  if (!(await canAccessAdmin())) redirect('/dashboard');

  const league = await getCurrentLeague();

  const coursesRes = league
    ? await supabase
        .from('courses')
        .select('id, name')
        .eq('league_id', league.id)
        .eq('is_active', true)
        .order('name')
    : null;
  const membersRes = await supabase
    .from('users')
    .select('id, name, professional_role')
    .eq('access_status', 'approved')
    .order('name');

  const courses = coursesRes?.data ?? [];
  const members = membersRes.data ?? [];

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-3xl mx-auto w-full">
      <Link
        href="/admin"
        className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)] hover:text-[color:var(--color-navy)]"
      >
        ← Cockpit
      </Link>

      <p className="mt-4 text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Admin · Live test
      </p>
      <h1
        className="mt-1 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Start a test game
      </h1>
      <p className="mt-3 text-sm text-[color:#5a5a4a] leading-relaxed">
        Spins up an open, gross-scored nine-hole scramble right now — RSVPs the
        players you pick, builds the groups, and opens the live leaderboard. Each
        group shares one scorecard, and anyone in a group can post that team’s
        score from their own phone.
      </p>
      <p className="mt-2 text-[11px] text-[color:var(--color-mute)] leading-relaxed">
        Players must have approved accounts and be signed in to score their group.
      </p>

      {courses.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-6 text-center">
          <p className="text-sm text-[color:#5a5a4a]">
            No active course in {league?.name ?? 'this league'} yet.
          </p>
          <Link
            href="/admin/courses"
            className="mt-4 inline-block rounded-lg ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] px-4 py-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase"
          >
            Add a course
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <TestGameForm courses={courses} members={members} />
        </div>
      )}
    </main>
  );
}
