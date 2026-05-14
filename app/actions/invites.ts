'use server';

import { getAppUser } from '@/lib/current-user';

export interface InviteState {
  ok: boolean;
  error?: string;
  sentTo?: string;
}

const INVITE_FROM = process.env.INVITE_FROM ?? 'Fairway Founders <invites@fairwayfounders.org>';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;',
  );
}

export async function sendInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };
  if (me.access_status !== 'approved') {
    return { ok: false, error: 'Only approved members can invite.' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: 'Email is not configured yet. Ask the admin to set RESEND_API_KEY.',
    };
  }

  const toEmail = (formData.get('email') as string | null)?.trim().toLowerCase();
  const toName = (formData.get('name') as string | null)?.trim() || null;
  const note = (formData.get('note') as string | null)?.trim().slice(0, 500) || null;

  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return { ok: false, error: 'Please enter a valid email.' };
  }

  const inviterFirst = me.name.split(' ')[0] || me.name;
  const greeting = toName ? `Hi ${escapeHtml(toName)},` : 'Hi there,';

  const subject = `${inviterFirst} invited you to Fairway Founders`;

  const html = `
<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; background:#f5f1e8; margin:0; padding:24px; color:#1a3a2e;">
    <div style="max-width:520px; margin:0 auto; background:#fff; border:1px solid #e8e2d2; border-radius:12px; padding:32px;">
      <p style="font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:#8a8576; margin:0;">An invitation</p>
      <h1 style="font-family:'Fraunces',Georgia,serif; font-size:28px; line-height:1.2; margin:8px 0 16px;">${greeting}</h1>
      <p style="font-size:15px; line-height:1.6; margin:0 0 16px;">
        <strong>${escapeHtml(me.name)}</strong> invited you to join
        <strong>Fairway Founders</strong> — a private group of founders and
        operators who play a 9-hole scramble together on Thursdays.
      </p>
      ${
        note
          ? `<p style="font-size:14px; line-height:1.6; margin:0 0 16px; padding:12px 16px; background:#f5f1e8; border-left:3px solid #c9a961; color:#5a5a4a; font-style:italic;">${escapeHtml(note)}</p>`
          : ''
      }
      <p style="font-size:14px; line-height:1.6; margin:0 0 24px; color:#5a5a4a;">
        Sign up below — an admin will review and approve your access.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${SITE_URL}" style="display:inline-block; background:#1a3a2e; color:#c9a961; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:13px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase;">Request access</a>
      </p>
      <p style="font-size:11px; color:#8a8576; margin:24px 0 0;">
        Tee off at half-past two.
      </p>
    </div>
  </body>
</html>`.trim();

  const text = [
    `${toName ? `Hi ${toName},` : 'Hi there,'}`,
    '',
    `${me.name} invited you to join Fairway Founders — a private group of founders and operators who play a 9-hole scramble together on Thursdays.`,
    ...(note ? ['', `"${note}"`, ''] : ['']),
    `Sign up here: ${SITE_URL}`,
    '',
    'Tee off at half-past two.',
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: INVITE_FROM,
      to: [toEmail],
      reply_to: me.email,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return {
      ok: false,
      error: `Email send failed (${res.status}). ${body.slice(0, 200)}`,
    };
  }

  return { ok: true, sentTo: toEmail };
}
