import { FourIcon, LinkIcon, BirdieIcon } from './InteractionIcons';

export interface MemberCounts {
  fours: number;
  links: number;
  birdies: number;
}

/**
 * The "12 Fours · 9 Links · 4 Birdies" strip.
 * `full` for the profile hero, `compact` for directory cards.
 */
export default function CountTags({
  fours,
  links,
  birdies,
  variant = 'full',
}: MemberCounts & { variant?: 'full' | 'compact' }) {
  const items = [
    { Icon: FourIcon, n: fours, label: 'Fours' },
    { Icon: LinkIcon, n: links, label: 'Links' },
    { Icon: BirdieIcon, n: birdies, label: 'Birdies' },
  ];

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2.5">
        {items.map(({ Icon, n, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[color:var(--color-mute)]"
          >
            <Icon size={11} className="text-[color:var(--color-gold)]" />
            {n}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      {items.map(({ Icon, n, label }) => (
        <div key={label} className="inline-flex items-center gap-1.5">
          <Icon size={15} className="text-[color:var(--color-gold)]" />
          <span className="text-sm font-semibold text-[color:var(--color-ink)]">{n}</span>
          <span className="text-[11px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
