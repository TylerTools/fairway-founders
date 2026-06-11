'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import { FourIcon, LinkIcon, BirdieIcon } from '@/components/InteractionIcons';
import {
  searchMembers,
  sendFour,
  sendLink,
  sendBirdie,
  type MemberSearchResult,
  type InteractionKind,
} from '@/app/actions/interactions';

const KINDS: {
  value: InteractionKind;
  label: string;
  Icon: typeof FourIcon;
  blurb: string;
}[] = [
  { value: 'four', label: 'Four', Icon: FourIcon, blurb: 'You threw them business — a referral.' },
  { value: 'link', label: 'Link', Icon: LinkIcon, blurb: 'You met one-on-one.' },
  { value: 'birdie', label: 'Birdie', Icon: BirdieIcon, blurb: 'You closed business together.' },
];

export default function LogInteraction() {
  const router = useRouter();
  const [kind, setKind] = useState<InteractionKind>('four');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [selected, setSelected] = useState<MemberSearchResult | null>(null);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [, startSearch] = useTransition();
  const [sending, startSend] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function doSearch(q: string) {
    setQuery(q);
    setSelected(null);
    setMsg(null);
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      setResults(await searchMembers(q));
    });
  }

  function submit() {
    if (!selected) {
      setMsg('Pick a member first.');
      return;
    }
    setMsg(null);
    startSend(async () => {
      let res: { ok: boolean; error?: string };
      if (kind === 'four') res = await sendFour(selected.id, note || undefined);
      else if (kind === 'link') res = await sendLink(selected.id, note || undefined);
      else {
        const cents = amount ? Math.round(parseFloat(amount) * 100) : undefined;
        res = await sendBirdie(
          selected.id,
          cents != null && !Number.isNaN(cents) ? cents : undefined,
          note || undefined,
        );
      }
      if (res.ok) {
        setMsg(`Sent — ${selected.name} will get a request to confirm it.`);
        setSelected(null);
        setQuery('');
        setResults([]);
        setNote('');
        setAmount('');
        router.refresh();
      } else {
        setMsg(res.error ?? 'Could not send.');
      }
    });
  }

  const active = KINDS.find((k) => k.value === kind)!;

  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
      <p className="text-[11px] tracking-[0.15em] uppercase font-bold text-[color:var(--color-ink)] mb-3">
        Log business
      </p>

      {/* Kind selector */}
      <div className="grid grid-cols-3 gap-2">
        {KINDS.map(({ value, label, Icon }) => {
          const on = value === kind;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 transition-colors ${
                on
                  ? 'border-[color:var(--color-gold)] bg-[color:#fdf9ee]'
                  : 'border-[color:#e8e2d2] hover:border-[color:var(--color-gold)]'
              }`}
            >
              <Icon size={18} className="text-[color:var(--color-gold)]" />
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[color:var(--color-mute)]">{active.blurb}</p>

      {/* Member picker */}
      <div className="mt-4">
        {selected ? (
          <div className="flex items-center gap-2.5 rounded-md border border-[color:#e8e2d2] px-3 py-2">
            <Avatar size={28} photoUrl={selected.photo_url} rounded="full" />
            <span className="text-sm font-medium flex-1 truncate">{selected.name}</span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[color:var(--color-mute)] text-sm px-1"
              aria-label="Clear"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              value={query}
              onChange={(e) => doSearch(e.target.value)}
              placeholder="Who? Search members…"
              className="w-full rounded-md px-3 py-2 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
            />
            {results.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 z-10 rounded-lg border border-[color:#e8e2d2] bg-white shadow-lg max-h-56 overflow-y-auto">
                {results.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelected(m);
                      setResults([]);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[color:#f5f1e8]"
                  >
                    <Avatar size={26} photoUrl={m.photo_url} rounded="full" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{m.name}</span>
                      {(m.professional_role || m.company) && (
                        <span className="block text-[11px] text-[color:var(--color-mute)] truncate">
                          {[m.professional_role, m.company].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {kind === 'birdie' && (
        <div className="mt-3">
          <label className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
            Deal value (optional)
          </label>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-sm text-[color:var(--color-mute)]">$</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="w-32 rounded-md px-2.5 py-2 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
            />
          </div>
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Add a note (optional)"
        className="mt-3 w-full rounded-md px-2.5 py-2 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none resize-y"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="rounded-md px-5 py-2.5 text-xs font-semibold tracking-[0.08em] uppercase ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] disabled:opacity-60"
        >
          {sending ? 'Sending…' : `Send ${active.label}`}
        </button>
        {msg && <span className="text-[11px] text-[color:var(--color-mute)]">{msg}</span>}
      </div>
    </div>
  );
}
