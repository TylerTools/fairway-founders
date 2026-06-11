'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAppUser, type AppUser } from '@/lib/current-user';
import type { Database } from '@/lib/database.types';

export type MemberLinkKind = Database['public']['Enums']['member_link_kind'];

const LINK_KINDS: MemberLinkKind[] = [
  'website',
  'linkedin',
  'instagram',
  'facebook',
  'x',
  'youtube',
  'tiktok',
  'calendly',
  'other',
];

export interface ProfileFormState {
  ok: boolean;
  error?: string;
}

export interface MemberLink {
  id: string;
  label: string;
  url: string;
  kind: MemberLinkKind;
  sort_order: number;
}

export interface AppProfileSnapshot {
  bio: string | null;
  company: string | null;
  professional_role: string | null;
  handicap: number | null;
  helps: string[];
  tagline: string | null;
  phone: string | null;
  website_url: string | null;
  city: string | null;
  leaderboard_opt_out: boolean;
  photo_url: string | null;
  logo_url: string | null;
  links: MemberLink[];
}

export async function getMyAppProfile(): Promise<AppProfileSnapshot | null> {
  const me: AppUser | null = await getAppUser();
  if (!me) return null;

  const linksRes = await supabase
    .from('member_links')
    .select('id, label, url, kind, sort_order')
    .eq('user_id', me.id)
    .order('sort_order', { ascending: true });

  return {
    bio: me.bio,
    company: me.company,
    professional_role: me.professional_role,
    handicap: me.handicap != null ? Number(me.handicap) : null,
    helps: me.helps ?? [],
    tagline: me.tagline,
    phone: me.phone,
    website_url: me.website_url,
    city: me.city,
    leaderboard_opt_out: me.leaderboard_opt_out,
    photo_url: me.photo_url,
    logo_url: me.logo_url,
    links: (linksRes.data ?? []) as MemberLink[],
  };
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const str = (k: string, max: number) =>
    ((formData.get(k) as string | null)?.trim().slice(0, max) || null) ?? null;

  const bio = str('bio', 600);
  const company = str('company', 120);
  const professional_role = str('professional_role', 120);
  const tagline = str('tagline', 140);
  const phone = str('phone', 40);
  const website_url = str('website_url', 300);
  const city = str('city', 120);
  const leaderboard_opt_out = formData.get('leaderboard_opt_out') === 'on';

  const handicapRaw = formData.get('handicap') as string | null;
  let handicap: number | null = null;
  if (handicapRaw && handicapRaw.trim() !== '') {
    const parsed = parseFloat(handicapRaw);
    if (Number.isNaN(parsed)) return { ok: false, error: 'Handicap must be a number.' };
    handicap = Math.max(0, Math.min(54, parsed));
  }

  const helps = ((formData.get('helps') as string | null) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const { error } = await supabase
    .from('users')
    .update({
      bio,
      company,
      professional_role,
      tagline,
      phone,
      website_url,
      city,
      handicap,
      helps,
      leaderboard_opt_out,
    })
    .eq('id', me.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/me');
  revalidatePath('/roster');
  revalidatePath(`/roster/${me.id}`);
  return { ok: true };
}

/** Replace-all link hub: delete the member's links and reinsert the validated set. */
export async function setMyLinks(
  links: { label: string; url: string; kind: string }[],
): Promise<ProfileFormState> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const clean = links
    .map((l, i) => ({
      label: (l.label || '').trim().slice(0, 60),
      url: (l.url || '').trim().slice(0, 300),
      kind: (LINK_KINDS.includes(l.kind as MemberLinkKind)
        ? l.kind
        : 'other') as MemberLinkKind,
      sort_order: i,
    }))
    .filter((l) => l.label && l.url)
    .slice(0, 8);

  await supabase.from('member_links').delete().eq('user_id', me.id);
  if (clean.length) {
    const { error } = await supabase
      .from('member_links')
      .insert(clean.map((l) => ({ ...l, user_id: me.id })));
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath('/me');
  revalidatePath(`/roster/${me.id}`);
  return { ok: true };
}

// ── Media uploads (server-only service-role client) ──────────────────────────

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function extObfrom(type: string): string {
  return type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
}

/** Pull the in-bucket object path back out of a stored public URL. */
function pathFromPublicUrl(url: string | null, bucket: string): string | null {
  if (!url) return null;
  const marker = `/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

async function uploadImage(
  formData: FormData,
  bucket: 'member-photos' | 'member-logos',
  maxBytes: number,
  column: 'photo_url' | 'logo_url',
  prevUrl: string | null,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'No file selected.' };
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Use a JPEG, PNG, or WebP image.' };
  }
  if (file.size > maxBytes) {
    return { ok: false, error: `Image must be under ${Math.round(maxBytes / 1024 / 1024)} MB.` };
  }

  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const path = `${me.id}/${randomUUID()}.${extObfrom(file.type)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const up = await admin.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) return { ok: false, error: up.error.message };

  const url = admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  const patch = column === 'photo_url' ? { photo_url: url } : { logo_url: url };
  const { error } = await supabase.from('users').update(patch).eq('id', me.id);
  if (error) return { ok: false, error: error.message };

  const oldPath = pathFromPublicUrl(prevUrl, bucket);
  if (oldPath) {
    await admin.storage
      .from(bucket)
      .remove([oldPath])
      .catch(() => {});
  }

  revalidatePath('/me');
  revalidatePath('/roster');
  revalidatePath(`/roster/${me.id}`);
  return { ok: true, url };
}

export async function uploadProfilePhoto(formData: FormData) {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };
  return uploadImage(formData, 'member-photos', 5 * 1024 * 1024, 'photo_url', me.photo_url);
}

export async function uploadBusinessLogo(formData: FormData) {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };
  return uploadImage(formData, 'member-logos', 2 * 1024 * 1024, 'logo_url', me.logo_url);
}

async function clearImage(
  bucket: 'member-photos' | 'member-logos',
  column: 'photo_url' | 'logo_url',
): Promise<ProfileFormState> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };
  const prev = column === 'photo_url' ? me.photo_url : me.logo_url;
  const patch = column === 'photo_url' ? { photo_url: null } : { logo_url: null };
  await supabase.from('users').update(patch).eq('id', me.id);
  const oldPath = pathFromPublicUrl(prev, bucket);
  if (oldPath) {
    try {
      getSupabaseAdmin()
        .storage.from(bucket)
        .remove([oldPath])
        .catch(() => {});
    } catch {
      // service-role key not set — the row is already nulled, leave the orphan.
    }
  }
  revalidatePath('/me');
  revalidatePath('/roster');
  revalidatePath(`/roster/${me.id}`);
  return { ok: true };
}

export async function removeProfilePhoto() {
  return clearImage('member-photos', 'photo_url');
}

export async function removeBusinessLogo() {
  return clearImage('member-logos', 'logo_url');
}
