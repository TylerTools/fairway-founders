'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { generateGroups, pairKey, type PairingHistory } from '@/lib/groups';
import type { CourseConfig } from '@/lib/schedule';

export interface GroupActionState {
  ok: boolean;
  error?: string;
  message?: string;
}

async function requireAdmin() {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') throw new Error('Admins only.');
  return me;
}

export async function clearGroups(eventId: string): Promise<void> {
  await requireAdmin();
  await supabase.from('foursomes').delete().eq('event_id', eventId);
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function runGroupGeneration(eventId: string): Promise<GroupActionState> {
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
