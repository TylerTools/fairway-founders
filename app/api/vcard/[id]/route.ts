import { supabase } from '@/lib/supabase';
import { recordLinkClick } from '@/app/actions/analytics';

// vCard 3.0 text escaping (RFC 2426): backslash, newline, comma, semicolon.
function esc(v: string): string {
  return v
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * Downloadable contact card for a member. A route handler (not a server action)
 * because the response needs Content-Type: text/vcard + Content-Disposition:
 * attachment and a directly linkable URL (`<a href download>`).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  const m = res.data;
  // 404 (don't leak) for missing or not-yet-approved members.
  if (!m || m.access_status !== 'approved') {
    return new Response('Not found', { status: 404 });
  }

  // Record the contact save (best-effort, deduped, self-excluded).
  await recordLinkClick(id, 'vcard');

  const parts = (m.name || '').trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] ?? '';

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${esc(m.name)}`,
    `N:${esc(last)};${esc(first)};;;`,
  ];
  if (m.company) lines.push(`ORG:${esc(m.company)}`);
  if (m.professional_role) lines.push(`TITLE:${esc(m.professional_role)}`);
  if (m.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(m.email)}`);
  if (m.phone) lines.push(`TEL;TYPE=CELL:${esc(m.phone)}`);
  if (m.website_url) lines.push(`URL:${esc(m.website_url)}`);
  if (m.city) lines.push(`ADR;TYPE=WORK:;;;${esc(m.city)};;;`);
  const note = m.tagline || m.bio;
  if (note) lines.push(`NOTE:${esc(note)}`);
  lines.push('END:VCARD');

  const body = lines.join('\r\n');
  const safe =
    (m.name || 'contact').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') ||
    'contact';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safe}.vcf"`,
    },
  });
}
