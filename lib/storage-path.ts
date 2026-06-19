/** Pull the in-bucket object path back out of a stored Supabase public URL.
 *  Pure string helper — kept out of the 'use server' action files so it can be
 *  shared (those files may only export async server actions). */
export function pathFromPublicUrl(
  url: string | null,
  bucket: string,
): string | null {
  if (!url) return null;
  const marker = `/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}
