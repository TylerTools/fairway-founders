/**
 * Shown when a signed-in user has no active league memberships yet.
 * Three variants:
 *   - leagueName + pendingLeague=true: their request to one specific
 *     league is waiting on the admin.
 *   - declinedLeague=true: their last request was declined; they can
 *     try another league from /me (or visit /join/[slug]).
 *   - neither: stranded user with no requests at all (signed up at /
 *     without a league cookie). They get a 'Pick a league' affordance
 *     once that flow exists; for now, contact-admin copy.
 */
export default function PendingScreen({
  name,
  leagueName,
  pendingLeague,
  declinedLeague,
}: {
  name: string;
  leagueName?: string;
  pendingLeague?: boolean;
  declinedLeague?: boolean;
}) {
  const first = name.split(' ')[0] || 'there';

  const headline = pendingLeague
    ? `Hang tight, ${first}.`
    : declinedLeague
      ? `${first}, let's try again.`
      : `Hang tight, ${first}.`;

  const body = pendingLeague
    ? leagueName
      ? `Your request to join ${leagueName} is with the league admin. You'll get full access here as soon as the green light flips on.`
      : `An admin will review your request and approve or decline it. You'll get full access here as soon as the green light flips on.`
    : declinedLeague
      ? `Your last league request wasn't accepted. You can try another league — visit a league's sign-in page and request again from there.`
      : `An admin needs to add you to a league before you can see the app. Reach out and we'll get you sorted.`;

  const chipCopy = pendingLeague
    ? 'Awaiting approval'
    : declinedLeague
      ? 'No active leagues'
      : 'No league yet';

  return (
    <main className="px-6 py-16 max-w-md mx-auto text-center">
      <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--color-mute)]">
        {pendingLeague ? 'Request received' : declinedLeague ? 'Membership' : 'Membership'}
      </p>
      <h1
        className="mt-3 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {headline}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[color:#5a5a4a]">
        {body}
      </p>
      <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white border border-[color:var(--color-gold)]/40 px-4 py-2">
        <span className="w-2 h-2 rounded-full bg-[color:var(--color-gold)] animate-pulse" />
        <span className="text-[11px] tracking-[0.15em] uppercase font-semibold text-[color:#5a5a4a]">
          {chipCopy}
        </span>
      </div>
    </main>
  );
}
