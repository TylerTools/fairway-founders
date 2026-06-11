export default function HowItWorksStep({
  n,
  title,
  body,
  icon,
}: {
  n: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex-1 rounded-xl border border-[color:#e8e2d2] bg-white p-5 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-[color:var(--color-cream)] border-2 border-[color:var(--color-gold)]/60 flex items-center justify-center text-[color:var(--color-navy)]">
        {icon}
      </div>
      <p
        className="mt-3 text-xs tracking-[0.15em] uppercase font-bold text-[color:var(--color-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Step {n}
      </p>
      <p
        className="mt-1 text-lg leading-tight text-[color:var(--color-ink)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </p>
      <p className="mt-2 text-xs text-[color:#5a5a4a] leading-relaxed">
        {body}
      </p>
    </div>
  );
}
