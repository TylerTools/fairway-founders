import { Resend } from 'resend';

const API_KEY = process.env.RESEND_API_KEY ?? '';
const FROM_ADDRESS =
  process.env.RESEND_FROM ?? 'Fairway Founders <noreply@fairwayfounders.org>';

let client: Resend | null = null;

export function resendClient(): Resend | null {
  if (!API_KEY) return null;
  if (!client) client = new Resend(API_KEY);
  return client;
}

export function isResendConfigured(): boolean {
  return !!API_KEY;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/** Best-effort send. Returns a structured result instead of throwing so the
 *  worker can mark the email_log row 'sent' or 'failed' accordingly. */
export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}): Promise<SendResult> {
  const r = resendClient();
  if (!r) {
    return { ok: false, error: 'RESEND_API_KEY not configured.' };
  }
  try {
    const res = await r.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      text: body,
    });
    if (res.error) {
      return { ok: false, error: res.error.message ?? 'send failed' };
    }
    return { ok: true, id: res.data?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export { FROM_ADDRESS };
