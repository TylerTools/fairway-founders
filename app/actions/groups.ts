'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { requireEventAdmin } from '@/lib/auth';
import { queueEmail } from '@/lib/email-queue';
import {
  generateGroups,
  pairKey,
  type PairingHistory,
  type CartRequests,
} from '@/lib/groups';
import { COURSE_OPTIONS, type CourseConfig } from '@/lib/schedule';

export interface GroupActionState {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function clearGroups(eventId: string): Promise<void> {
  await requireEventAdmin(eventId);
  await supabase.from('foursomes').delete().eq('event_id', eventId);
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function runGroupGeneration(
  eventId: string,
  options: { skipEmail?: boolean } = {},
): Promise<GroupActionState> {
  await requireEventAdmin(eventId);

  const evtRes = await supabase
    .from('events')
    .select('id, course_config')
    .eq('id', eventId)
    .maybeSingle();
  if (!evtRes.data) return { ok: false, error: 'Event not found.' };
  const courseConfig: CourseConfig = evtRes.data.course_config;

  const rsvpRes = await supabase
    .from('rsvps')
    .select('user_id, requested_cart_partner_id, users:user_id(*)')
    .eq('event_id', eventId);
  if (rsvpRes.error) return { ok: false, error: rsvpRes.error.message };

  const members = (rsvpRes.data ?? [])
    .map((row) => (Array.isArray(row.users) ? row.users[0] : row.users))
    .filter((u): u is NonNullable<typeof u> => !!u);

  if (members.length < 2) {
    return { ok: false, error: 'Need at least 2 RSVPs to generate groups.' };
  }

  // Cart-partner requests — only honor a request when both members are in this
  // event's pool. Mutual requests are favored strongly, one-way gently; the
  // algorithm treats them as a soft preference, never a guarantee.
  const memberIds = new Set(members.map((m) => m.id));
  const requests: CartRequests = new Map();
  for (const row of rsvpRes.data ?? []) {
    const partner = row.requested_cart_partner_id;
    if (partner && memberIds.has(row.user_id) && memberIds.has(partner)) {
      requests.set(row.user_id, partner);
    }
  }

  // Build pairing history from prior foursome_members — but only from REAL
  // events. Test-game foursomes would otherwise pollute repeat-pairing
  // minimization with practice rounds that never actually happened.
  const history: PairingHistory = new Map();
  const realEventsRes = await supabase
    .from('events')
    .select('id')
    .eq('is_test', false)
    .neq('id', eventId);
  const realEventIds = (realEventsRes.data ?? []).map((e) => e.id);
  let priorIds: string[] = [];
  if (realEventIds.length > 0) {
    const priorFoursomeIdsRes = await supabase
      .from('foursomes')
      .select('id')
      .in('event_id', realEventIds);
    priorIds = (priorFoursomeIdsRes.data ?? []).map((r) => r.id);
  }
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

  const result = generateGroups(members, history, courseConfig, requests);
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

/** Add an empty foursome to the event. Hole = next unused hole in the
 *  event's course_config; wraps if all in use. Tier stays 'A' (overflow
 *  tiers B/C are only created by the auto-generator). */
export async function addEmptyGroup(
  eventId: string,
): Promise<GroupActionState & { foursomeId?: string }> {
  await requireEventAdmin(eventId);

  const evtRes = await supabase
    .from('events')
    .select('course_config')
    .eq('id', eventId)
    .maybeSingle();
  if (!evtRes.data) return { ok: false, error: 'Event not found.' };
  const configHoles =
    COURSE_OPTIONS[evtRes.data.course_config as CourseConfig].holes;

  const four = await supabase
    .from('foursomes')
    .select('hole, group_index')
    .eq('event_id', eventId);
  if (four.error) return { ok: false, error: four.error.message };

  const usedHoles = new Set((four.data ?? []).map((f) => f.hole));
  const nextHole = configHoles.find((h) => !usedHoles.has(h)) ?? configHoles[0];
  const nextIndex =
    (four.data ?? []).reduce((m, f) => Math.max(m, f.group_index), -1) + 1;

  const ins = await supabase
    .from('foursomes')
    .insert({
      event_id: eventId,
      hole: nextHole,
      tier: 'A' as const,
      group_index: nextIndex,
    })
    .select('id')
    .single();
  if (ins.error) return { ok: false, error: ins.error.message };

  revalidatePath('/admin');
  revalidatePath('/');
  return { ok: true, foursomeId: ins.data?.id };
}

/** Delete a foursome. Refuses if it still has members — admin must move
 *  players out first to avoid dropping someone unnoticed. */
export async function deleteGroup(
  eventId: string,
  foursomeId: string,
): Promise<GroupActionState> {
  await requireEventAdmin(eventId);
  const membersRes = await supabase
    .from('foursome_members')
    .select('id')
    .eq('foursome_id', foursomeId);
  if (membersRes.error) return { ok: false, error: membersRes.error.message };
  if ((membersRes.data ?? []).length > 0) {
    return { ok: false, error: 'Move players out of this group first.' };
  }
  const del = await supabase
    .from('foursomes')
    .delete()
    .eq('id', foursomeId)
    .eq('event_id', eventId);
  if (del.error) return { ok: false, error: del.error.message };
  revalidatePath('/admin');
  revalidatePath('/');
  return { ok: true };
}

/** Move a player from their current foursome to a different one. Cart
 *  assignment: if the destination has a cart with a single player, we
 *  pair up; otherwise we start a new cart with a fresh event-scoped
 *  cart_number. Idempotent when destFoursomeId == current foursome. */
export async function movePlayer(
  eventId: string,
  userId: string,
  destFoursomeId: string,
): Promise<GroupActionState> {
  await requireEventAdmin(eventId);

  const four = await supabase
    .from('foursomes')
    .select('id, foursome_members(id, user_id, cart_number)')
    .eq('event_id', eventId);
  if (four.error) return { ok: false, error: four.error.message };

  const foursomes = four.data ?? [];
  const destFoursome = foursomes.find((f) => f.id === destFoursomeId);
  if (!destFoursome) return { ok: false, error: 'Destination not found.' };

  let currentRow: {
    id: string;
    cart_number: number;
    foursome_id: string;
  } | null = null;
  for (const f of foursomes) {
    for (const m of f.foursome_members ?? []) {
      if (m.user_id === userId) {
        currentRow = { id: m.id, cart_number: m.cart_number, foursome_id: f.id };
      }
    }
  }
  if (!currentRow) return { ok: false, error: 'Player not in a group.' };
  if (currentRow.foursome_id === destFoursomeId) return { ok: true };

  // Pick a cart number in the destination:
  //   - existing cart in dest with exactly 1 player → pair up
  //   - else new cart_number = max event cart + 1
  const destCartCounts = new Map<number, number>();
  for (const m of destFoursome.foursome_members ?? []) {
    destCartCounts.set(m.cart_number, (destCartCounts.get(m.cart_number) ?? 0) + 1);
  }
  let targetCart: number | null = null;
  for (const [num, count] of destCartCounts) {
    if (count === 1) {
      targetCart = num;
      break;
    }
  }
  if (targetCart == null) {
    const allCarts = foursomes
      .flatMap((f) => (f.foursome_members ?? []).map((m) => m.cart_number))
      .filter((n): n is number => typeof n === 'number');
    targetCart = allCarts.length ? Math.max(...allCarts) + 1 : 1;
  }

  const del = await supabase
    .from('foursome_members')
    .delete()
    .eq('id', currentRow.id);
  if (del.error) return { ok: false, error: del.error.message };
  const ins = await supabase.from('foursome_members').insert({
    foursome_id: destFoursomeId,
    user_id: userId,
    cart_number: targetCart,
  });
  if (ins.error) {
    // Restore the original assignment so a failed move never drops a player.
    await supabase.from('foursome_members').insert({
      foursome_id: currentRow.foursome_id,
      user_id: userId,
      cart_number: currentRow.cart_number,
    });
    return { ok: false, error: ins.error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  return { ok: true };
}

export async function swapPlayers(
  eventId: string,
  userIdA: string,
  userIdB: string,
): Promise<GroupActionState> {
  await requireEventAdmin(eventId);
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
  const del = await supabase
    .from('foursome_members')
    .delete()
    .in('id', [rowA.id, rowB.id]);
  if (del.error) return { ok: false, error: del.error.message };
  const ins = await supabase.from('foursome_members').insert([
    { foursome_id: rowA.foursome_id, user_id: userIdB, cart_number: rowA.cart_number },
    { foursome_id: rowB.foursome_id, user_id: userIdA, cart_number: rowB.cart_number },
  ]);
  if (ins.error) {
    // Re-insert the originals so a failed swap never drops both players.
    await supabase.from('foursome_members').insert([
      { foursome_id: rowA.foursome_id, user_id: rowA.user_id, cart_number: rowA.cart_number },
      { foursome_id: rowB.foursome_id, user_id: rowB.user_id, cart_number: rowB.cart_number },
    ]);
    return { ok: false, error: ins.error.message };
  }

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
