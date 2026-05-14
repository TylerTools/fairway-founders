'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setViewMode } from '@/app/actions/view-mode';
import type { ViewMode } from '@/lib/view-mode';

export default function ViewToggle({ current }: { current: ViewMode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function flip(target: ViewMode) {
    if (target === current) return;
    startTransition(async () => {
      await setViewMode(target);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex rounded-full border border-[color:var(--color-gold)]/60 bg-white p-0.5">
      <Btn
        active={current === 'admin'}
        onClick={() => flip('admin')}
        disabled={pending}
      >
        Admin
      </Btn>
      <Btn
        active={current === 'member'}
        onClick={() => flip('member')}
        disabled={pending}
      >
        Member
      </Btn>
    </div>
  );
}

function Btn({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors ${
        active
          ? 'bg-[color:var(--color-navy)] text-[color:var(--color-gold)]'
          : 'text-[color:#5a5a4a]'
      } disabled:opacity-60`}
    >
      {children}
    </button>
  );
}
