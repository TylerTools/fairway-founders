import GolfFlagIcon from './GolfFlagIcon';

/**
 * Hero band shown on the signed-out landing.
 *
 * If `public/hero.mp4` exists in the repo, the browser plays it muted on loop.
 * If the file is missing or fails to load, the golf-flag icon shows instead.
 *
 * Drop your video at `public/hero.mp4` (and optionally
 * `public/hero-poster.jpg` for the first-frame fallback) — no other change
 * needed. MP4 (H.264, AAC) is the broadest-support format.
 */
export default function HeroVideo() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-[color:var(--color-navy)] aspect-[16/9] max-h-[420px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <GolfFlagIcon size={140} />
      </div>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hero.mp4" type="video/mp4" />
        <source src="/hero.webm" type="video/webm" />
      </video>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[color:var(--color-navy)]/70 to-transparent" />
    </div>
  );
}
