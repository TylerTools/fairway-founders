import type { MyTraffic } from '@/app/actions/analytics';

export default function ProfileAnalytics({
  traffic,
  monthLabel,
}: {
  traffic: MyTraffic;
  monthLabel: string;
}) {
  const items = [
    { n: traffic.profileViews, label: 'Views' },
    { n: traffic.uniqueViewers, label: 'People' },
    { n: traffic.websiteClicks, label: 'Site clicks' },
    { n: traffic.vcardSaves, label: 'vCard saves' },
    { n: traffic.calls, label: 'Calls' },
    { n: traffic.texts, label: 'Texts' },
  ];

  return (
    <div className="rounded-xl border border-[color:var(--color-gold)] bg-[color:var(--color-navy)] text-[color:var(--color-cream)] p-5">
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-gold)]">
        Your profile · {monthLabel}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-y-3 gap-x-2">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <p className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {it.n}
            </p>
            <p className="text-[9px] tracking-[0.1em] uppercase text-[color:#d8d2c0]">
              {it.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-[color:#d8d2c0]">
        Aggregate counts only — you never see who viewed you.
      </p>
    </div>
  );
}
