export default function GolfFlagIcon({
  size = 96,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      {/* green */}
      <ellipse cx="60" cy="100" rx="50" ry="9" fill="#7c9885" />
      <ellipse cx="60" cy="98" rx="50" ry="9" fill="#1a3a2e" />
      {/* hole */}
      <ellipse cx="74" cy="96" rx="6" ry="2" fill="#0d1f17" />
      {/* flagstick */}
      <line
        x1="74"
        y1="98"
        x2="74"
        y2="22"
        stroke="#1a3a2e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* flag */}
      <path
        d="M 74 24 Q 90 30 100 26 Q 92 38 100 50 Q 90 46 74 50 Z"
        fill="#c9a961"
      />
      <path
        d="M 74 24 Q 90 30 100 26 Q 92 38 100 50 Q 90 46 74 50 Z"
        fill="url(#flagShade)"
      />
      {/* ball */}
      <circle cx="48" cy="96" r="4.5" fill="#f5f1e8" />
      <circle cx="46" cy="94.5" r="1" fill="#e8e2d2" />
      <circle cx="49" cy="95" r="0.6" fill="#e8e2d2" />
      <circle cx="47" cy="97" r="0.6" fill="#e8e2d2" />
      <defs>
        <linearGradient id="flagShade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#c9a961" stopOpacity="0" />
          <stop offset="100%" stopColor="#1a3a2e" stopOpacity="0.18" />
        </linearGradient>
      </defs>
    </svg>
  );
}
