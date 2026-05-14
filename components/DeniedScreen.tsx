export default function DeniedScreen() {
  return (
    <main className="px-6 py-16 max-w-md mx-auto text-center">
      <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--color-mute)]">
        Request declined
      </p>
      <h1
        className="mt-3 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        We&rsquo;re not a fit right now.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[color:#5a5a4a]">
        Membership in Fairway Founders is curated. If you think this was a
        mistake, reach out to the admin directly.
      </p>
    </main>
  );
}
