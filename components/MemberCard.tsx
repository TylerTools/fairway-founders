import Link from 'next/link';
import Avatar from './Avatar';
import CountTags from './CountTags';

export interface DirectoryMember {
  id: string;
  name: string;
  professional_role: string | null;
  company: string | null;
  tagline: string | null;
  photo_url: string | null;
  handicap: number | null;
  app_role: 'member' | 'super_admin';
  access_status: 'pending' | 'approved' | 'denied';
  leagues: { slug: string; label: string }[];
  counts: { fours: number; links: number; birdies: number };
  isMe: boolean;
}

const ROLE_LABEL: Record<'member' | 'super_admin', string> = {
  member: 'Member',
  super_admin: 'Admin',
};

export default function MemberCard({
  m,
  isAdmin,
}: {
  m: DirectoryMember;
  isAdmin: boolean;
}) {
  const showRoleChip = m.app_role !== 'member';
  const showStatusChip = isAdmin && m.access_status !== 'approved';
  const subtitle = m.tagline || m.professional_role;

  return (
    <Link
      href={`/roster/${m.id}`}
      className={`bg-white border rounded-xl p-3.5 hover:border-[color:var(--color-gold)] transition-colors ${
        showStatusChip ? 'border-[color:#a13c3c]/40' : 'border-[color:#e8e2d2]'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <Avatar size={44} photoUrl={m.photo_url} rounded="xl" />
        {m.handicap != null && (
          <span className="text-[9px] bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-md px-1.5 py-0.5 font-bold tracking-wide">
            HCP {m.handicap}
          </span>
        )}
      </div>

      <p className="text-[13px] font-semibold leading-tight">
        {m.name}
        {m.isMe && (
          <span className="text-[color:var(--color-gold)] font-normal"> (you)</span>
        )}
      </p>
      {subtitle && (
        <p className="text-[11px] text-[color:var(--color-mute)] mt-0.5 line-clamp-1">
          {subtitle}
        </p>
      )}

      {m.leagues.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {m.leagues.slice(0, 2).map((l) => (
            <span
              key={l.slug}
              className="text-[8px] tracking-[0.12em] uppercase font-bold bg-[color:#f0ebd8] text-[color:#5a5a4a] rounded-full px-1.5 py-0.5"
            >
              {l.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2">
        <CountTags
          fours={m.counts.fours}
          links={m.counts.links}
          birdies={m.counts.birdies}
          variant="compact"
        />
      </div>

      {(showRoleChip || showStatusChip) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {showRoleChip && (
            <span className="text-[8px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full px-1.5 py-0.5">
              {ROLE_LABEL[m.app_role]}
            </span>
          )}
          {showStatusChip && (
            <span className="text-[8px] tracking-[0.12em] uppercase font-bold bg-[color:#a13c3c] text-white rounded-full px-1.5 py-0.5">
              {m.access_status}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
