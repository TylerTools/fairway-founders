import { COURSE_OPTIONS, fmtMoney, lastName } from './schedule';
import type { Database } from './database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

export interface ProShopFoursome {
  hole: number;
  tier: 'A' | 'B' | 'C';
  hasTier: boolean;
  memberNames: string[];
}

export interface ProShopDraft {
  subject: string;
  body: string;
  to: string | null;
}

export function buildProShopEmail({
  event,
  foursomes,
  playerCount,
  cartCount,
}: {
  event: EventRow;
  foursomes: ProShopFoursome[];
  playerCount: number;
  cartCount: number;
}): ProShopDraft {
  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const shortDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const cfg = COURSE_OPTIONS[event.course_config];
  const total = playerCount * event.fee_cents;

  const subject = `Fairway Founders — ${shortDate} — Tee Time Confirmation`;
  const lines: string[] = [];
  lines.push('Hi Legacy Golf Club Pro Shop,');
  lines.push('');
  lines.push('Confirming our Fairway Founders group for this week:');
  lines.push('');
  lines.push(`Date:     ${dateStr}`);
  lines.push('Time:     2:30 PM shotgun start');
  lines.push(`Layout:   ${cfg.label} (holes ${cfg.range})`);
  lines.push(`Players:  ${playerCount} confirmed`);
  lines.push(`Carts:    ${cartCount}`);
  lines.push(
    `Fee:      ${fmtMoney(event.fee_cents)}/player × ${playerCount} = ${fmtMoney(
      total,
    )} estimated`,
  );
  lines.push('');
  lines.push('Group assignments:');
  for (const f of foursomes) {
    const tierTag = f.hasTier ? ` (Tier ${f.tier})` : '';
    const names = f.memberNames
      .map((name) => {
        const first = name.split(' ')[0]?.[0] ?? '';
        return `${first}. ${lastName(name)}`;
      })
      .join(', ');
    lines.push(`  Hole ${f.hole}${tierTag}: ${names}`);
  }
  lines.push('');
  lines.push('Please let us know if anything changes on your end.');
  lines.push('');
  lines.push('Thanks,');
  lines.push('Fairway Founders');

  return {
    subject,
    body: lines.join('\n'),
    to: event.pro_shop_email,
  };
}
