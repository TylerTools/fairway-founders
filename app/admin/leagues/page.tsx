import { redirect } from 'next/navigation';

// League management moved to the GLN console (platform tier).
// /admin/* is now strictly the league-admin cockpit.
export default function AdminLeaguesRedirect() {
  redirect('/gln');
}
