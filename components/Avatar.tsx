export default function Avatar({
  size = 48,
  navy = false,
  photoUrl = null,
  rounded = 'full',
}: {
  size?: number;
  navy?: boolean;
  photoUrl?: string | null;
  rounded?: 'full' | 'xl';
}) {
  const bg = navy ? '#1a3a2e' : '#f0ebd8';
  const fg = navy ? '#c9a961' : '#8a8576';
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
  return (
    <div
      className={`flex items-center justify-center shrink-0 overflow-hidden ${radius}`}
      style={{ width: size, height: size, background: bg }}
    >
      {photoUrl ? (
        // Plain <img> (not next/image) so Supabase Storage URLs need no remotePatterns config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 64 64" width={size} height={size}>
          <circle cx="32" cy="24" r="11" fill={fg} />
          <path d="M 12 60 Q 12 40 32 40 Q 52 40 52 60 Z" fill={fg} />
        </svg>
      )}
    </div>
  );
}
