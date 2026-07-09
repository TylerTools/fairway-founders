'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboarding, type OnboardingState } from '@/app/actions/onboarding';
import { INDUSTRIES, SEEKING_OPTIONS } from '@/lib/onboarding-options';

const initial: OnboardingState = { ok: true };

const STEPS = ['Who you want', 'Who you are'] as const;

/** Ultra-lean 2-step pre-approval wizard.
 *  Step 1: what you're looking for + which industries you want to connect with.
 *  Step 2: role, company, your own industry.
 *  Anything else (bio, goals, handicap, city, helps) is optional and can be
 *  added later from /me — never in the sign-up dialogue. */
export default function OnboardingWizard({ name }: { name: string }) {
  const first = name.split(' ')[0] || 'there';
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<OnboardingState>(initial);
  const [step, setStep] = useState(0);

  const [seeking, setSeeking] = useState<string[]>([]);
  const [seekingIndustries, setSeekingIndustries] = useState<string[]>([]);
  const [industry, setIndustry] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  function field(n: string): string {
    return (
      (formRef.current?.elements.namedItem(n) as HTMLInputElement | null)?.value ?? ''
    ).trim();
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (seeking.length === 0 && seekingIndustries.length === 0) {
        return 'Pick at least one thing you want from the network.';
      }
    }
    if (s === 1) {
      if (!field('professional_role')) return 'Let us know what you do.';
      if (!field('company')) return 'Add your company.';
      if (!industry) return 'Pick the industry that fits best.';
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    for (let s = 0; s < STEPS.length; s++) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        setStepError(err);
        return;
      }
    }

    const fd = new FormData(e.currentTarget);
    if (industry) fd.set('industry', industry);
    seeking.forEach((s) => fd.append('seeking', s));
    seekingIndustries.forEach((s) => fd.append('seeking_industries', s));

    startTransition(async () => {
      const res = await submitOnboarding(initial, fd);
      setState(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <main className="px-6 py-12 max-w-md mx-auto w-full">
      <p className="text-[10px] tracking-[0.2em] uppercase text-[color:var(--color-mute)] font-semibold">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>
      <h1
        className="mt-2 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {step === 0 && (
          <>
            Who do you want to meet,{' '}
            <em className="not-italic italic text-[color:var(--color-gold)]">{first}</em>?
          </>
        )}
        {step === 1 && 'Now the quick basics.'}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[color:#5a5a4a]">
        {step === 0 &&
          'Pick what you want out of the network and the industries you want to be around. We use this to pair you with the right people.'}
        {step === 1 &&
          'Just enough for an admin to say yes. Everything else waits until you’re in.'}
      </p>

      <div className="mt-6 flex gap-1.5" aria-hidden>
        {STEPS.map((_, i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{
              background:
                i <= step ? 'var(--color-navy)' : 'rgba(201,169,97,0.30)',
            }}
          />
        ))}
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="mt-6">
        <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5 space-y-5">
          {/* STEP 1 — Who they want. */}
          <div className={step === 0 ? 'space-y-5' : 'hidden'}>
            <ChipField
              label="What are you looking for?"
              options={SEEKING_OPTIONS}
              selected={seeking}
              multi
              onToggle={(v) =>
                setSeeking((cur) =>
                  cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
                )
              }
              onAdd={(v) =>
                setSeeking((cur) => (cur.includes(v) ? cur : [...cur, v]))
              }
              addPlaceholder="Something else…"
            />
            <ChipField
              label="Industries you want to connect with"
              options={INDUSTRIES}
              selected={seekingIndustries}
              multi
              onToggle={(v) =>
                setSeekingIndustries((cur) =>
                  cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
                )
              }
              onAdd={(v) =>
                setSeekingIndustries((cur) =>
                  cur.includes(v) ? cur : [...cur, v],
                )
              }
              addPlaceholder="Something else…"
            />
          </div>

          {/* STEP 2 — Who they are. */}
          <div className={step === 1 ? 'space-y-4' : 'hidden'}>
            <Field
              label="Your name"
              name="name"
              defaultValue={name}
              placeholder="Full name"
            />
            <Field
              label="What do you do?"
              name="professional_role"
              placeholder="Founder, CTO, Head of Sales…"
            />
            <Field
              label="Company"
              name="company"
              placeholder="Where you’re building"
            />
            <ChipField
              label="Your industry"
              options={INDUSTRIES}
              selected={industry ? [industry] : []}
              onToggle={(v) => setIndustry((cur) => (cur === v ? null : v))}
              onAdd={(v) => setIndustry(v)}
              addPlaceholder="Something else…"
            />
          </div>

          {stepError && <p className="text-xs text-[color:#a13c3c]">{stepError}</p>}
          {state.error && <p className="text-xs text-[color:#a13c3c]">{state.error}</p>}
        </div>

        <div className="mt-5 flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="rounded-lg px-4 py-3 text-[12px] font-semibold tracking-[0.08em] uppercase ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)]"
            >
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex-1 rounded-lg px-4 py-3 text-[12px] font-semibold tracking-[0.1em] uppercase ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)]"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg px-4 py-3 text-[12px] font-semibold tracking-[0.1em] uppercase ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] disabled:opacity-60"
            >
              {pending ? 'Submitting…' : 'Request access'}
            </button>
          )}
        </div>
        {step === STEPS.length - 1 && (
          <p className="mt-3 text-[11px] text-[color:var(--color-mute)] text-center italic">
            An admin will review and welcome you in.
          </p>
        )}
      </form>
    </main>
  );
}

function ChipField({
  label,
  options,
  selected,
  onToggle,
  onAdd,
  multi,
  addPlaceholder,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  onAdd: (value: string) => void;
  multi?: boolean;
  addPlaceholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const extras = selected.filter((s) => !options.includes(s));
  const all = [...options, ...extras];

  function commit() {
    const v = draft.trim().slice(0, 60);
    if (!v) return;
    onAdd(v);
    setDraft('');
  }

  return (
    <div>
      <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576]">
        {label}
        {!multi && <span className="text-[color:var(--color-gold)]"> *</span>}
      </span>
      <div className="mt-2 flex flex-wrap gap-2">
        {all.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={
                'rounded-full px-3.5 py-1.5 text-[13px] border transition-colors ' +
                (active
                  ? 'border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-[color:var(--color-gold)]'
                  : 'border-[color:#e8e2d2] bg-white text-[color:var(--color-ink)] hover:border-[color:var(--color-gold)]')
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={addPlaceholder ?? 'Add your own…'}
          className="flex-1 min-w-0 rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--color-gold)]"
        />
        <button
          type="button"
          onClick={commit}
          className="text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-gold)] px-1"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  const cls =
    'w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--color-gold)]';
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576]">
        {label}
      </span>
      <span className="block mt-1">
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          type={type ?? 'text'}
          className={cls}
        />
      </span>
    </label>
  );
}
