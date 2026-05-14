export default function PendingScreen({ name }: { name: string }) {
  const first = name.split(' ')[0] || 'there';
  return (
    <main className="px-6 py-16 max-w-md mx-auto text-center">
      <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--color-mute)]">
        Request received
      </p>
      <h1
        className="mt-3 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Hang tight, {first}.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[color:#5a5a4a]">
        An admin will review your request
        and approve or decline it. You&rsquo;ll get full access here as soon as
        the green light flips on.
      </p>
      <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white border border-[color:var(--color-gold)]/40 px-4 py-2">
        <span className="w-2 h-2 rounded-full bg-[color:var(--color-gold)] animate-pulse" />
        <span className="text-[11px] tracking-[0.15em] uppercase font-semibold text-[color:#5a5a4a]">
          Awaiting approval
        </span>
      </div>
    </main>
  );
}
