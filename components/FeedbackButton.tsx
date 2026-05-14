'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  submitFeedback,
  type FeedbackFormState,
} from '@/app/actions/feedback';

const INITIAL_STATE: FeedbackFormState = { ok: true };

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'feedback' | 'issue'>('feedback');
  const [state, formAction, pending] = useActionState(
    submitFeedback,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.ok && state.message) {
      const t = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[88px] z-30 rounded-full bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase shadow-lg shadow-[color:var(--color-navy)]/20 hover:opacity-90"
      >
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-[color:var(--color-navy)]/60 flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[color:var(--color-cream)] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[color:#e8e2d2] flex justify-between items-center">
              <p
                className="text-lg font-semibold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Tell us anything
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl text-[color:var(--color-mute)] leading-none px-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form action={formAction} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold mb-2">
                  This is about
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <KindOption
                    value="feedback"
                    selected={kind === 'feedback'}
                    onSelect={setKind}
                    title="Program"
                    sub="Round, structure, ideas"
                  />
                  <KindOption
                    value="issue"
                    selected={kind === 'issue'}
                    onSelect={setKind}
                    title="App issue"
                    sub="Bug, broken thing"
                  />
                </div>
                <input type="hidden" name="kind" value={kind} />
              </div>

              <label className="block">
                <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
                  Subject (optional)
                </span>
                <input
                  type="text"
                  name="subject"
                  maxLength={200}
                  className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
                  placeholder={
                    kind === 'issue'
                      ? 'e.g. RSVP button stuck loading'
                      : 'e.g. Move shotgun to 3 PM in summer'
                  }
                />
              </label>

              <label className="block">
                <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
                  Details
                </span>
                <textarea
                  name="body"
                  rows={5}
                  maxLength={2000}
                  required
                  className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)] resize-y"
                  placeholder={
                    kind === 'issue'
                      ? 'What happened? What were you doing when it broke?'
                      : 'Tell us what you&rsquo;d change or what&rsquo;s working.'
                  }
                />
              </label>

              {state.error && (
                <p className="text-xs text-[color:#a13c3c]">{state.error}</p>
              )}
              {state.ok && state.message && (
                <p className="text-xs text-[color:#7c9885]">{state.message}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-lg py-3 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
                >
                  {pending ? 'Sending…' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 text-xs tracking-[0.08em] uppercase text-[color:var(--color-mute)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function KindOption({
  value,
  selected,
  onSelect,
  title,
  sub,
}: {
  value: 'feedback' | 'issue';
  selected: boolean;
  onSelect: (v: 'feedback' | 'issue') => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`text-left rounded-lg border px-3 py-2.5 ${
        selected
          ? 'border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-[color:var(--color-cream)]'
          : 'border-[color:#e8e2d2] bg-white text-[color:var(--color-ink)]'
      }`}
    >
      <p
        className="text-sm font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </p>
      <p
        className={`text-[10px] tracking-[0.05em] mt-0.5 ${
          selected ? 'text-[color:#a8a596]' : 'text-[color:var(--color-mute)]'
        }`}
      >
        {sub}
      </p>
    </button>
  );
}
