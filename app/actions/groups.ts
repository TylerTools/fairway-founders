'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';
import { queueEmail } from '@/lib/email-queue';
import { generateGroups, pairKey, type PairingHistory } from '@/lib/groups';
import type { CourseConfig } from '@/lib/schedule';

export interface GroupActionState {
  ok: boolean;
  error?: string;
  message?: string;
}

async function requireAdmin() {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) throw new Error('Admins only.');
  return me;
}

export async function clearGroups(eventId: string): Promise<void> {
  await requireAdmin();
  await supabase.from('foursomes').delete().eq('event_id', eventId);
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function runGroupGeneration(
  eventId: string,
  options: { skipEmail?: boolean } = {},
): Promise<GroupActionState> {
  await requireAdmin();

  const evtRes = await supabase
    .from('events')
    .select('id, course_config')
    .eq('id', eventId)
    .maybeSingle();
  if (!evtRes.data) return { ok: false, error: 'Event not found.' };
  const courseConfig: CourseConfig = evtRes.data.course_config;

  const rsvpRes = await supabase
    .from('rsvps')
    .select('user_id, users:user_id(*)')
    .eq('event_id', eventId);
  if (rsvpRes.error) return { ok: false, error: rsvpRes.error.message };

  const members = (rsvpRes.data ?? [])
    .map((row) => (Array.isArray(row.users) ? row.users[0] : row.users))
    .filter((u): u is NonNullable<typeof u> => !!u);

  if (members.length < 2) {
    return { ok: false, error: 'Need at least 2 RSVPs to generate groups.' };
  }

  // Build pairing history from prior foursome_members.
  const history: PairingHistory = new Map();
  const priorFoursomeIdsRes = await supabase
    .from('foursomes')
    .select('id')
    .neq('event_id', eventId);
  const priorIds = (priorFoursomeIdsRes.data ?? []).map((r) => r.id);
  if (priorIds.length > 0) {
    const priorMembers = await supabase
      .from('foursome_members')
      .select('foursome_id, user_id')
      .in('foursome_id', priorIds);
    const byFoursome = new Map<string, string[]>();
    for (const m of priorMembers.data ?? []) {
      const list = byFoursome.get(m.foursome_id) ?? [];
      list.push(m.user_id);
      byFoursome.set(m.foursome_id, list);
    }
    for (const userIds of byFoursome.values()) {
      for (let i = 0; i < userIds.length; i++) {
        for (let j = i + 1; j < userIds.length; j++) {
          const k = pairKey(userIds[i], userIds[j]);
          history.set(k, (history.get(k) ?? 0) + 1);
        }
      }
    }
  }

  const result = generateGroups(members, history, courseConfig);
  if (!result) return { ok: false, error: 'Could not partition this RSVP count.' };

  // Wipe and recreate for this event.
  await supabase.from('foursomes').delete().eq('event_id', eventId);

  for (let gi = 0; gi < result.foursomes.length; gi++) {
    const f = result.foursomes[gi];
    const insertedFour = await supabase
      .from('foursomes')
      .insert({
        event_id: eventId,
        hole: f.hole,
        tier: f.tier,
        group_index: gi,
        score: result.score,
      })
      .select('id')
      .single();
    if (insertedFour.error || !insertedFour.data) {
      return { ok: false, error: insertedFour.error?.message ?? 'Insert failed.' };
    }
    const foursomeId = insertedFour.data.id;

    const memberRows = f.carts.flatMap((cart) =>
      cart.members.map((m) => ({
        foursome_id: foursomeId,
        user_id: m.id,
        cart_number: cart.number,
      })),
    );
    if (memberRows.length) {
      const mErr = await supabase.from('foursome_members').insert(memberRows);
      if (mErr.error) return { ok: false, error: mErr.error.message };
    }
  }

  // Best-effort: queue a "your group is set" email per RSVPed member.
  // The test-game flow opts out so it doesn't email real testers.
  if (!options.skipEmail) {
    try {
      await queueFoursomesGeneratedEmails(eventId);
    } catch {
      // never block the action on the notification
    }
  }

  revalidatePath('/');
  revalidatePath('/admin');
  return {
    ok: true,
    message: `Generated ${result.foursomes.length} group${
      result.foursomes.length === 1 ? '' : 's'
    } from ${members.length} RSVPs.`,
  };
}

export async function swapPlayers(
  eventId: string,
  userIdA: string,
  userIdB: string,
): Promise<GroupActionState> {
  await requireAdmin();
  if (userIdA === userIdB) return { ok: true };

  const four = await supabase
    .from('foursomes')
    .select('id, foursome_members(id, user_id, cart_number)')
    .eq('event_id', eventId);
  if (four.error) return { ok: false, error: four.error.message };

  let rowA: { id: string; user_id: string; cart_number: number; foursome_id: string } | null = null;
  let rowB: { id: string; user_id: string; cart_number: number; foursome_id: string } | null = null;
  for (const f of four.data ?? []) {
    for (const m of f.foursome_members ?? []) {
      const row = { ...m, foursome_id: f.id };
      if (m.user_id === userIdA) rowA = row;
      if (m.user_id === userIdB) rowB = row;
    }
  }
  if (!rowA || !rowB) return { ok: false, error: 'Player not in any foursome.' };

  // Swap user_id; keep foursome_id and cart_number per slot.
  // To respect the (foursome_id, user_id) unique constraint we do a 2-step:
  // park A on a temp user_id-less state by deleting, then update B, then re-insert A.
  // Simpler: use raw SQL transaction-ish via two updates with placeholders is risky.
  // Safest: delete both and re-insert.
  await supabase.from('foursome_members').delete().in('id', [rowA.id, rowB.id]);
  await supabase.from('foursome_members').insert([
    { foursome_id: rowA.foursome_id, user_id: userIdB, cart_number: rowA.cart_number },
    { foursome_id: rowB.foursome_id, user_id: userIdA, cart_number: rowB.cart_number },
  ]);

  revalidatePath('/');
  revalidatePath('/admin');
  return { ok: true };
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

async function queueFoursomesGeneratedEmails(eventId: string): Promise<void> {
  const evt = await supabase
    .from('events')
    .select('id, date, course:course_id(name)')
    .eq('id', eventId)
    .maybeSingle();
  if (!evt.data) return;
  const courseInfo = Array.isArray(evt.data.course)
    ? evt.data.course[0]
    : evt.data.course;
  const courseName = courseInfo?.name ?? 'the course';

  const dateStr = new Date(evt.data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const fmRes = await supabase
    .from('foursomes')
    .select('hole, tier, foursome_members(cart_number, user:user_id(id, name, email))')
    .eq('event_id', eventId);
  if (fmRes.error || !fmRes.data) return;

  for (const f of fmRes.data) {
    const tierTag = f.tier !== 'A' ? ` · Tier ${f.tier}` : '';
    const cartMap = new Map<number, { id: string; name: string; email: string }[]>();
    for (const m of f.foursome_members ?? []) {
      const u = Array.isArray(m.user) ? m.user[0] : m.user;
      if (!u) continue;
      const list = cartMap.get(m.cart_number) ?? [];
      list.push(u);
      cartMap.set(m.cart_number, list);
    }
    const allMembers = [...cartMap.values()].flat();
    for (const [cartNum, mems] of cartMap.entries()) {
      for (const target of mems) {
        const cartmates = mems.filter((x) => x.id !== target.id).map((x) => x.name);
        const others = allMembers
          .filter((x) => x.id !== target.id && !mems.some((c) => c.id === x.id))
          .map((x) => x.name);
        const first = target.name.split(' ')[0] || 'there';
        const cartLine =
          cartmates.length > 0
            ? `Cart ${cartNum} with ${cartmates.join(' & ')}`
            : `Cart ${cartNum} (solo)`;
        const groupLine = others.length
          ? `Your foursome: you, ${cartmates.join(', ')}${
              cartmates.length ? ', ' : ''
            }${others.join(', ')}`
          : `You're riding solo this round.`;
        await queueEmail({
          kind: 'foursomes_generated',
          toEmail: target.email,
          toUserId: target.id,
          subject: `Your tee time is set — ${dateStr}`,
          body: [
            `Hi ${first},`,
            '',
            `Your foursome for ${dateStr} at ${courseName} is set.`,
            '',
            `Starting hole: ${f.hole}${tierTag}`,
            cartLine,
            groupLine,
            '',
            `Full details: ${SITE_URL}/dashboard`,
            '',
            '— Fairway Founders',
          ].join('\n'),
          eventId,
        });
      }
    }
  }
}
