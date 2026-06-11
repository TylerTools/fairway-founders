import { redirect } from 'next/navigation';

// League detail moved under the GLN console.
export default async function AdminLeagueDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/gln/leagues/${id}`);
}
