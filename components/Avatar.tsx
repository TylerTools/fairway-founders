export default function Avatar({
  size = 48,
  navy = false,
}: {
  size?: number;
  navy?: boolean;
}) {
  const bg = navy ? '#1a3a2e' : '#f0ebd8';
  const fg = navy ? '#c9a961' : '#8a8576';
  return (
    <div
      className="flex items-center justify-center shrink-0 rounded-full overflow-hidden"
      style={{ width: size, height: size, background: bg }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx="32" cy="24" r="11" fill={fg} />
        <path d="M 12 60 Q 12 40 32 40 Q 52 40 52 60 Z" fill={fg} />
      </svg>
    </div>
  );
}
