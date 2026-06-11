'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FourIcon, LinkIcon, BirdieIcon } from './InteractionIcons';
import {
  sendFour,
  sendLink,
  sendBirdie,
  type InteractionKind,
} from '@/app/actions/interactions';

const KINDS: { k: InteractionKind; label: string; Icon: typeof FourIcon }[] = [
  { k: 'four', label: 'Four', Icon: FourIcon },
  { k: 'link', label: 'Link', Icon: LinkIcon },
  { k: 'birdie', label: 'Birdie', Icon: BirdieIcon },
];

/**
 * The +Four / +Link / +Birdie buttons shown on another member's profile.
 * Clicking one reveals an inline note (+ optional $ for Birdie) and sends a
 * pending request the other member confirms.
 */
export default function ProfileInteractionButtons({
  toUserId,
  toName,
}: {
  toUserId: string;
  toName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<InteractionKind | null>(null);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function send() {
    if (!open) return;
    setMsg(null);
    start(async () => {
      let res: { ok: boolean; error?: string };
      if (open === 'four') res = await sendFour(toUserId, note || undefined);
      else if (open === 'link') res = await sendLink(toUserId, note || undefined);
      else {
        const c = amount ? Math.round(parseFloat(amount) * 100) : undefined;
        res = await sendBirdie(
          toUserId,
          c != null && !Number.isNaN(c) ? c : undefined,
          note || undefined,
        );
      }
      if (res.ok) {
        setMsg(`Sent — ${toName} will confirm it.`);
        setOpen(null);
        setNote('');
        setAmount('');
        router.refresh();
      } else {
        setMsg(res.error ?? 'Could not send.');
      }
    });
  }

  const activeLabel = KINDS.find((x) => x.k === open)?.label ?? '';

  return (
    <>
      {KINDS.map(({ k, label, Icon }) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            setOpen(open === k ? null : k);
            setMsg(null);
          }}
          className={`inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase rounded-md transition-colors ${
            open === k
              ? 'border-[color:var(--color-gold)] bg-[color:#fdf9ee]'
              : 'border-[color:#e8e2d2] hover:border-[color:var(--color-gold)]'
          }`}
        >
          <Icon size={14} className="text-[color:var(--color-gold)]" />
          {label}
        </button>
      ))}

      {open && (
        <div className="w-full mt-2 rounded-lg border border-[color:#e8e2d2] bg-[color:#fdfcf8] p-3">
          {open === 'birdie' && (
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-sm text-[color:var(--color-mute)]">$</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="Deal value (optional)"
                className="w-44 rounded-md px-2.5 py-1.5 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
              />
            </div>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={`Add a note for ${toName} (optional)`}
            className="w-full rounded-md px-2.5 py-2 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none resize-y"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="rounded-md px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] disabled:opacity-60"
            >
              {sending ? 'Sending…' : `Send ${activeLabel}`}
            </button>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!open && msg && (
        <span className="w-full text-[11px] text-[color:var(--color-mute)]">{msg}</span>
      )}
    </>
  );
}
