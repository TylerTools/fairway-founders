'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';

export interface ScoreActionState {
  ok: boolean;
  error?: string;
}

export async function upsertHoleScore(
  foursomeId: string,
  hole: number,
  strokes: number | null,
): Promise<ScoreActionState> {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') return { ok: false, error: 'Admins only.' };
  if (hole < 1 || hole > 18) return { ok: false, error: 'Invalid hole.' };

  if (strokes == null || Number.isNaN(strokes) || strokes <= 0) {
    await supabase
      .from('hole_scores')
      .delete()
      .eq('foursome_id', foursomeId)
      .eq('hole', hole);
  } else {
    const clamped = Math.max(1, Math.min(15, Math.round(strokes)));
    const existing = await supabase
      .from('hole_scores')
      .select('id')
      .eq('foursome_id', foursomeId)
      .eq('hole', hole)
      .maybeSingle();
    if (existing.data) {
      await supabase
        .from('hole_scores')
        .update({ strokes: clamped })
        .eq('id', existing.data.id);
    } else {
      await supabase
        .from('hole_scores')
        .insert({ foursome_id: foursomeId, hole, strokes: clamped });
    }
  }

  revalidatePath('/leaderboard');
  return { ok: true };
}
