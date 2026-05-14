'use client';

import { useEffect } from 'react';

export default function PrintTrigger({ count }: { count: number }) {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 400);
    return () => clearTimeout(id);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-md px-5 py-2 text-xs font-semibold tracking-[0.1em] uppercase"
    >
      Print {count} cart label{count === 1 ? '' : 's'}
    </button>
  );
}
