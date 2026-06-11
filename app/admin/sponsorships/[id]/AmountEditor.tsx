'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setSponsorshipAmount } from '@/app/actions/sponsorships';

export default function AmountEditor({
  id,
  initialCents,
}: {
  id: string;
  initialCents: number | null;
}) {
  const router = useRouter();
  const [val, setVal] = useState(initialCents != null ? String(initialCents / 100) : '');
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save() {
    setMsg(null);
    const trimmed = val.trim();
    const cents = trimmed === '' ? null : Math.round(parseFloat(trimmed) * 100);
    if (cents != null && Number.isNaN(cents)) {
      setMsg('Enter a number.');
      return;
    }
    start(async () => {
      const res = await setSponsorshipAmount(id, cents);
      setMsg(res.ok ? 'Saved.' : res.error ?? 'Failed.');
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-sm text-[color:var(--color-mute)]">$</span>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        inputMode="decimal"
        placeholder="Amount paid"
        className="w-32 rounded-md px-2.5 py-1.5 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase bg-[color:var(--color-navy)] text-[color:var(--color-gold)] disabled:opacity-60"
      >
        {pending ? '…' : 'Save'}
      </button>
      {msg && <span className="text-[11px] text-[color:var(--color-mute)]">{msg}</span>}
    </div>
  );
}
