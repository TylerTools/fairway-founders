'use client';

import { useActionState, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import {
  updateProfile,
  setMyLinks,
  uploadProfilePhoto,
  uploadBusinessLogo,
  removeProfilePhoto,
  removeBusinessLogo,
  type AppProfileSnapshot,
  type ProfileFormState,
  type MemberLinkKind,
} from '@/app/actions/profile';

const LINK_KINDS: { value: MemberLinkKind; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'calendly', label: 'Calendly' },
  { value: 'other', label: 'Other' },
];

const initial: ProfileFormState = { ok: true };

type LinkRow = { kind: MemberLinkKind; label: string; url: string };

export default function ProfileEditor({
  profile,
  email,
  photoUrl,
  logoUrl,
}: {
  profile: AppProfileSnapshot;
  email: string;
  photoUrl: string | null;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfile, initial);

  return (
    <div className="mt-6 space-y-3">
      <ImageRow
        label="Profile photo"
        url={photoUrl}
        rounded="full"
        onUpload={uploadProfilePhoto}
        onRemove={removeProfilePhoto}
        onDone={() => router.refresh()}
      />
      <ImageRow
        label="Business logo"
        url={logoUrl}
        rounded="xl"
        onUpload={uploadBusinessLogo}
        onRemove={removeBusinessLogo}
        onDone={() => router.refresh()}
      />

      <form action={formAction} className="rounded-xl border border-[color:#e8e2d2] bg-white p-5 space-y-4">
        <SectionLabel>Identity</SectionLabel>
        <Field name="tagline" label="Tagline" defaultValue={profile.tagline ?? ''} placeholder="What you do, in a line" />
        <div className="grid grid-cols-2 gap-3">
          <Field name="company" label="Company" defaultValue={profile.company ?? ''} />
          <Field name="professional_role" label="Role" defaultValue={profile.professional_role ?? ''} />
        </div>
        <Field name="city" label="Location" defaultValue={profile.city ?? ''} placeholder="Sarasota, FL" />
        <Field name="bio" label="Bio" defaultValue={profile.bio ?? ''} textarea rows={4} />

        <SectionLabel>Contact</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <Field name="phone" label="Phone" defaultValue={profile.phone ?? ''} />
          <ReadOnlyField label="Email" value={email} />
        </div>
        <Field name="website_url" label="Website" defaultValue={profile.website_url ?? ''} placeholder="https://" />

        <SectionLabel>Golf</SectionLabel>
        <Field name="handicap" label="Handicap (0–54)" defaultValue={profile.handicap != null ? String(profile.handicap) : ''} type="number" step="0.1" min="0" max="54" />

        <SectionLabel>Can help with</SectionLabel>
        <Field name="helps" label="Comma separated (max 8)" defaultValue={profile.helps.join(', ')} />

        <SectionLabel>Privacy</SectionLabel>
        <label className="flex items-center gap-2.5 text-sm text-[color:var(--color-ink)]">
          <input type="checkbox" name="leaderboard_opt_out" defaultChecked={profile.leaderboard_opt_out} className="w-4 h-4 accent-[color:#1a3a2e]" />
          Hide me from the networking leaderboard (your stats still count for you)
        </label>

        {state.error && <p className="text-xs text-[color:#a13c3c]">{state.error}</p>}
        {state.ok && !pending && <span className="hidden" aria-hidden />}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md px-5 py-2.5 text-xs font-semibold tracking-[0.08em] uppercase bg-[color:var(--color-navy)] text-[color:var(--color-gold)] disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <LinkHubEditor initial={profile.links.map((l) => ({ kind: l.kind, label: l.label, url: l.url }))} />
    </div>
  );
}

function ImageRow({
  label,
  url,
  rounded,
  onUpload,
  onRemove,
  onDone,
}: {
  label: string;
  url: string | null;
  rounded: 'full' | 'xl';
  onUpload: (fd: FormData) => Promise<{ ok: boolean; url?: string; error?: string }>;
  onRemove: () => Promise<{ ok: boolean; error?: string }>;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    const res = await onUpload(fd);
    setBusy(false);
    if (!res.ok) setError(res.error ?? 'Upload failed.');
    else onDone();
  }

  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white p-5">
      <div className="flex items-center gap-4">
        <Avatar size={64} photoUrl={url} rounded={rounded} />
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
            {label}
          </p>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-gold)] disabled:opacity-60"
            >
              {busy ? 'Uploading…' : url ? 'Replace' : 'Upload'}
            </button>
            {url && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await onRemove();
                  setBusy(false);
                  onDone();
                }}
                className="text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-mute)] disabled:opacity-60"
              >
                Remove
              </button>
            )}
          </div>
          {error && <p className="mt-1 text-[11px] text-[color:#a13c3c]">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function LinkHubEditor({ initial }: { initial: LinkRow[] }) {
  const [rows, setRows] = useState<LinkRow[]>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function update(i: number, patch: Partial<LinkRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function add() {
    if (rows.length >= 8) return;
    setRows((r) => [...r, { kind: 'website', label: '', url: '' }]);
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function save() {
    setMsg(null);
    start(async () => {
      const res = await setMyLinks(rows);
      setMsg(res.ok ? 'Saved.' : res.error ?? 'Could not save links.');
    });
  }

  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white p-5 space-y-3">
      <SectionLabel>Link hub</SectionLabel>
      {rows.length === 0 && (
        <p className="text-xs italic text-[color:var(--color-mute)]">
          Add your website and social links — they show on your profile.
        </p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-start">
          <select
            value={row.kind}
            onChange={(e) => update(i, { kind: e.target.value as MemberLinkKind })}
            className="rounded-md px-2 py-2 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
          >
            {LINK_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <input
            value={row.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Label"
            className="w-28 rounded-md px-2.5 py-2 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
          />
          <input
            value={row.url}
            onChange={(e) => update(i, { url: e.target.value })}
            placeholder="https://"
            className="flex-1 min-w-0 rounded-md px-2.5 py-2 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-[color:var(--color-mute)] px-1.5 py-2 text-sm"
            aria-label="Remove link"
          >
            ×
          </button>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        {rows.length < 8 && (
          <button
            type="button"
            onClick={add}
            className="text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-gold)]"
          >
            + Add link
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-md px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase bg-[color:var(--color-navy)] text-[color:var(--color-gold)] disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save links'}
        </button>
        {msg && <span className="text-[11px] text-[color:var(--color-mute)]">{msg}</span>}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
      {children}
    </p>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  textarea,
  rows,
  type,
  step,
  min,
  max,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  const cls =
    'w-full rounded-md px-2.5 py-2 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none';
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        {label}
      </span>
      <span className="block mt-1">
        {textarea ? (
          <textarea name={name} defaultValue={defaultValue} rows={rows ?? 3} placeholder={placeholder} className={`${cls} resize-y`} />
        ) : (
          <input name={name} defaultValue={defaultValue} placeholder={placeholder} type={type ?? 'text'} step={step} min={min} max={max} className={cls} />
        )}
      </span>
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        {label}
      </span>
      <span className="block mt-1 rounded-md px-2.5 py-2 text-sm bg-[color:#f5f1e8] border border-[color:#e8e2d2] text-[color:var(--color-mute)] truncate">
        {value}
      </span>
    </label>
  );
}
