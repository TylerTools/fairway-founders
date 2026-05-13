import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// MOCK DATA
// ============================================================================
const MOCK_MEMBERS = [
  { id: 1,  name: 'Tyler Thompson',  company: 'Eminence Services',     role: 'General Contractor', handicap: 14, bio: 'Remodel + new build. Built 80-client home services biz solo. Always game for trades intros.', helps: ['Remodels', 'Trade referrals', 'Project mgmt'] },
  { id: 2,  name: 'Sarah Chen',      company: 'Coastal Realty',        role: 'Realtor',            handicap: 22, bio: 'Waterfront specialist, 12 yrs in the area. Lived in Lakewood Ranch since 2014.',           helps: ['Buying/selling', 'Lot sourcing', 'Local market intel'] },
  { id: 3,  name: 'Marcus Johnson',  company: 'Johnson Legal',         role: 'Estate Attorney',    handicap: 8,  bio: 'Trust + estate planning. Help small biz owners structure for the next generation.',       helps: ['Estate planning', 'LLC structure', 'Asset protection'] },
  { id: 4,  name: 'Diana Rodriguez', company: 'Rodriguez CPA',         role: 'CPA',                handicap: 18, bio: 'Tax strategy for owner-operators. Former Big 4, prefers small business now.',             helps: ['Tax planning', 'Entity selection', 'Bookkeeping setup'] },
  { id: 5,  name: 'Eli Patterson',   company: 'ARETO',                 role: 'Marketing Agency',   handicap: 12, bio: 'AEO/GEO + brand. Help local businesses get found in AI search.',                          helps: ['SEO/AEO', 'Brand', 'Content systems'] },
  { id: 6,  name: 'James Wright',    company: 'Reefpoint',             role: 'SaaS Founder',       handicap: 6,  bio: 'B2B vertical SaaS for marinas. Bootstrapped to $1.2M ARR.',                              helps: ['Product strategy', 'Bootstrapping', 'Hiring engineers'] },
  { id: 7,  name: 'Robin Mills',     company: 'Mills Insurance',       role: 'Insurance Broker',   handicap: 24, bio: 'Commercial lines. GL, workers comp, builders risk â all the un-fun stuff you need.',     helps: ['Coverage review', 'Claims advocacy'] },
  { id: 8,  name: 'Priya Shah',      company: 'Shah Wealth',           role: 'Wealth Advisor',     handicap: 16, bio: 'Fiduciary, no commissions. Founders in liquidity events, biz owners planning exits.',     helps: ['Investment strategy', 'Exit planning'] },
  { id: 9,  name: 'Carlos Vega',     company: 'Vega Custom Homes',     role: 'Builder',            handicap: 10, bio: 'High-end coastal custom builds. 25 years in Manatee County.',                            helps: ['New construction', 'Permitting', 'Sub vetting'] },
  { id: 10, name: 'Dr. Amelia Foster', company: 'Foster Orthodontics', role: 'Orthodontist',       handicap: 20, bio: 'Practice owner, three locations. Always thinking about systems and team building.',     helps: ['Practice ops', 'Team culture'] },
  { id: 11, name: 'Jordan Kim',      company: 'Field Studio',          role: 'Brand Designer',     handicap: 28, bio: 'Identity + packaging for food, hospitality, premium services. Ex-Pentagram.',           helps: ['Brand identity', 'Packaging', 'Creative direction'] },
  { id: 12, name: 'Tony Russo',      company: 'Russo Hospitality',     role: 'Restaurant Owner',   handicap: 15, bio: 'Three concepts on Anna Maria. Margins are tight, vibes are immaculate.',                helps: ['F&B ops', 'Local hiring', 'Vendor intros'] },
  { id: 13, name: 'Megan O\'Brien',  company: 'OB Commercial',         role: 'Realtor',            handicap: 11, bio: 'Commercial leasing + investment sales. Industrial flex space is my niche.',             helps: ['Commercial space', 'Investment deals'] },
  { id: 14, name: 'Vincent Park',    company: 'Park Capital',          role: 'Angel Investor',     handicap: 4,  bio: 'Early checks into Florida-based founders. $25Kâ$250K, B2B preferred.',                  helps: ['Funding', 'GTM intros', 'Board prep'] },
  { id: 15, name: 'Lila Bauer',      company: 'Bauer Architecture',    role: 'Architect',          handicap: 19, bio: 'Residential + small commercial. Coastal vernacular with modern guts.',                  helps: ['Design', 'Code/permitting', 'Builder selection'] },
  { id: 16, name: 'Derek Holloway',  company: 'Gulf Mortgage',         role: 'Mortgage Broker',    handicap: 13, bio: 'Self-employed borrowers, jumbos, construction loans. Rate-sensitive deals welcome.',    helps: ['Financing', 'Pre-approvals'] },
];

const buildHistoryKey = (a, b) => [a, b].sort((x, y) => x - y).join('-');
const MOCK_HISTORY = {
  [buildHistoryKey(1, 2)]: 3, [buildHistoryKey(1, 9)]: 3, [buildHistoryKey(1, 5)]: 2,
  [buildHistoryKey(2, 13)]: 4, [buildHistoryKey(2, 16)]: 3, [buildHistoryKey(3, 4)]: 2,
  [buildHistoryKey(4, 8)]: 3, [buildHistoryKey(6, 14)]: 3, [buildHistoryKey(7, 8)]: 2,
  [buildHistoryKey(9, 15)]: 3, [buildHistoryKey(11, 12)]: 2, [buildHistoryKey(10, 12)]: 1,
  [buildHistoryKey(5, 11)]: 2,
};

const DEFAULT_FEE = 40;
const DEFAULT_PRO_SHOP_EMAIL = 'proshop@legacygolfclub.com';
const COURSE_NAME = 'Legacy Golf Club';

function Avatar({ size = 48, bg = '#f0ebd8', fg = '#8a8576' }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block' }}>
        <circle cx="32" cy="24" r="11" fill={fg}/>
        <path d="M 12 60 Q 12 40 32 40 Q 52 40 52 60 Z" fill={fg}/>
      </svg>
    </div>
  );
}

// ============================================================================
// SCHEDULE
// ============================================================================
function nextThursdayAt230(from) {
  const d = new Date(from);
  let daysUntil = (4 - d.getDay() + 7) % 7;
  if (daysUntil === 0 && (d.getHours() > 14 || (d.getHours() === 14 && d.getMinutes() >= 30))) daysUntil = 7;
  d.setDate(d.getDate() + daysUntil);
  d.setHours(14, 30, 0, 0);
  return d;
}

function buildSchedule(nowMs, count = 4) {
  const first = nextThursdayAt230(nowMs);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(first);
    date.setDate(date.getDate() + i * 7);
    const opensAt = new Date(date); opensAt.setDate(opensAt.getDate() - 7); opensAt.setHours(8, 0, 0, 0);
    const closesAt = new Date(date); closesAt.setDate(closesAt.getDate() - 2); closesAt.setHours(18, 0, 0, 0);
    return { date, opensAt, closesAt };
  });
}

function eventStatus(evt, nowMs) {
  if (nowMs < evt.opensAt.getTime()) return 'locked';
  if (nowMs < evt.closesAt.getTime()) return 'open';
  if (nowMs < evt.date.getTime()) return 'closed';
  return 'past';
}

// ============================================================================
// COURSE LAYOUT
// ============================================================================
const COURSE_OPTIONS = {
  front: { label: 'Front 9', range: '1â9', holes: Array.from({ length: 9 }, (_, i) => i + 1) },
  back:  { label: 'Back 9', range: '10â18', holes: Array.from({ length: 9 }, (_, i) => i + 10) },
  both:  { label: 'All 18', range: '1â18', holes: Array.from({ length: 18 }, (_, i) => i + 1) },
};

function assignHoles(numFoursomes, courseConfig = 'front') {
  const available = COURSE_OPTIONS[courseConfig].holes;
  return Array.from({ length: numFoursomes }, (_, i) => {
    const tierIdx = Math.floor(i / available.length);
    const holeIdx = i % available.length;
    const tier = ['A', 'B', 'C'][tierIdx] || 'X';
    return { hole: available[holeIdx], tier, hasTier: tierIdx > 0 };
  });
}

// ============================================================================
// PARTITION
// ============================================================================
function partitionSizes(n) {
  if (n < 2) return null;
  if (n === 2) return [2];
  if (n === 3) return [3];
  if (n === 5) return [3, 2];
  const r = n % 4;
  if (r === 0) return Array(n / 4).fill(4);
  if (r === 3) return [...Array((n - 3) / 4).fill(4), 3];
  if (r === 2) return [...Array(Math.floor(n / 4) - 1).fill(4), 3, 3];
  if (r === 1) return [...Array((n - 9) / 4).fill(4), 3, 3, 3];
  return null;
}

function describePartition(sizes) {
  if (!sizes) return '';
  const c = sizes.reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {});
  const parts = [];
  if (c[4]) parts.push(`${c[4]} foursome${c[4] > 1 ? 's' : ''}`);
  if (c[3]) parts.push(`${c[3]} trio${c[3] > 1 ? 's' : ''}`);
  if (c[2]) parts.push(`${c[2]} pair${c[2] > 1 ? 's' : ''}`);
  return parts.join(' + ');
}

// ============================================================================
// GROUPING
// ============================================================================
function scoreGroups(groups, history) {
  let score = 0;
  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const k = buildHistoryKey(group[i].id, group[j].id);
        score += (history[k] || 0) * 10;
      }
    }
    const roleCount = {};
    for (const m of group) roleCount[m.role] = (roleCount[m.role] || 0) + 1;
    for (const c of Object.values(roleCount)) if (c > 1) score += (c - 1) * 15;
  }
  return score;
}

function assignCartPairs(group, history) {
  if (group.length < 2) return [group];
  if (group.length === 2) return [group];
  if (group.length === 3) return [[group[0], group[1]], [group[2]]];
  const [a, b, c, d] = group;
  const splits = [[[a, b], [c, d]], [[a, c], [b, d]], [[a, d], [b, c]]];
  let best = splits[0]; let bestScore = Infinity;
  for (const split of splits) {
    let s = 0;
    for (const cart of split) s += (history[buildHistoryKey(cart[0].id, cart[1].id)] || 0);
    if (s < bestScore) { bestScore = s; best = split; }
  }
  return best;
}

function generateGroups(members, history, courseConfig = 'front') {
  const sizes = partitionSizes(members.length);
  if (!sizes) return null;
  let best = null; let bestScore = Infinity;
  for (let attempt = 0; attempt < 250; attempt++) {
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const groups = [];
    let offset = 0;
    for (const sz of sizes) { groups.push(shuffled.slice(offset, offset + sz)); offset += sz; }
    const s = scoreGroups(groups, history);
    if (s < bestScore) { bestScore = s; best = groups; }
  }
  const holeAssignments = assignHoles(best.length, courseConfig);
  let cartCounter = 1;
  const foursomes = best.map((group, i) => {
    const cartPairs = assignCartPairs(group, history);
    const carts = cartPairs.map(pair => ({ number: cartCounter++, members: pair }));
    return { members: group, carts, ...holeAssignments[i] };
  });
  return { foursomes, score: bestScore, sizes };
}

function getAllCarts(foursomes) {
  return foursomes.flatMap(f => f.carts.map(c => ({ ...c, hole: f.hole, tier: f.tier, hasTier: f.hasTier })));
}

function lastName(fullName) {
  const cleaned = fullName.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s+/, '');
  const parts = cleaned.split(' ');
  return parts[parts.length - 1].toUpperCase();
}

// ============================================================================
// HELPERS
// ============================================================================
function formatCountdown(ms) {
  if (ms <= 0) return 'CLOSED';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

function fmtMoney(n) { return `$${n.toLocaleString('en-US')}`; }

// ============================================================================
// SCORING â scramble net score with handicap
// In a scramble, the team plays one ball; net score = team gross - team handicap.
// Team handicap (USGA-style): 25%/20%/15%/10% of low/2nd/3rd/4th, then sum.
// We use a simpler & common variant: average of team handicaps Ã course handicap %.
// For a 9-hole front/back round, divide handicap allotment by 2.
// ============================================================================
function teamHandicap(group, holesPlayed = 9) {
  if (!group?.length) return 0;
  const sorted = [...group.map(m => m.handicap || 0)].sort((a, b) => a - b);
  const weights = [0.25, 0.20, 0.15, 0.10];
  let sum = 0;
  for (let i = 0; i < sorted.length; i++) sum += sorted[i] * (weights[i] || 0);
  // Scale weights for groups smaller than 4 so it still sums correctly
  if (sorted.length < 4) {
    const usedWeight = weights.slice(0, sorted.length).reduce((a, b) => a + b, 0);
    sum = sum / usedWeight * 0.7; // approx full-team factor
  }
  // Half stroke if 9-hole round
  return Math.round(sum * (holesPlayed / 18));
}

function leaderboardRows(foursomes, scoresByGroup, holesPlayed = 9) {
  if (!foursomes) return [];
  const par = holesPlayed === 9 ? 36 : 72; // typical par
  return foursomes.map((f, idx) => {
    const score = scoresByGroup[idx];
    const teamHcp = teamHandicap(f.members, holesPlayed);
    const holes = score?.holes || [];
    const holesIn = holes.filter(h => h != null && h > 0).length;
    const gross = holes.reduce((a, h) => a + (h || 0), 0);
    const projectedGross = holesIn > 0 ? Math.round(gross * holesPlayed / holesIn) : null;
    const net = gross > 0 ? gross - teamHcp : null;
    const projectedNet = projectedGross ? projectedGross - teamHcp : null;
    const thru = holesIn;
    const toPar = net != null ? net - par : null;
    return { idx, foursome: f, gross, net, projectedNet, teamHcp, thru, toPar, holesIn };
  })
  .sort((a, b) => {
    // Rank by current net if any holes played, else show in foursome order
    if (a.holesIn === 0 && b.holesIn === 0) return a.idx - b.idx;
    if (a.holesIn === 0) return 1;
    if (b.holesIn === 0) return -1;
    // Compare projected net (extrapolated) to be fair to mid-round groups
    return (a.projectedNet ?? 999) - (b.projectedNet ?? 999);
  });
}

function fmtToPar(toPar) {
  if (toPar == null) return 'â';
  if (toPar === 0) return 'E';
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
}

const ROLE_COLORS = {
  'Realtor': '#7c9885', 'General Contractor': '#8b6f47', 'Builder': '#8b6f47',
  'Estate Attorney': '#5d4e37', 'CPA': '#5d4e37', 'Wealth Advisor': '#5d4e37',
  'Insurance Broker': '#5d4e37', 'Mortgage Broker': '#5d4e37',
  'Marketing Agency': '#a87c4f', 'Brand Designer': '#a87c4f',
  'SaaS Founder': '#4a7c7e', 'Angel Investor': '#4a7c7e',
  'Orthodontist': '#9b6a6c', 'Restaurant Owner': '#9b6a6c', 'Architect': '#8b6f47',
};

// ============================================================================
// EMAIL DRAFT
// ============================================================================
function buildProShopEmail({ event, foursomes, members, fee, courseConfig }) {
  const dateStr = event.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const cfg = COURSE_OPTIONS[courseConfig];
  const playerCount = members.length;
  const totalCarts = foursomes.reduce((a, f) => a + f.carts.length, 0);
  const total = playerCount * fee;
  const subject = `Fairway Founders â ${event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} â Tee Time Confirmation`;
  const lines = [];
  lines.push(`Hi ${COURSE_NAME} Pro Shop,`);
  lines.push('');
  lines.push(`Confirming our Fairway Founders group for this week:`);
  lines.push('');
  lines.push(`Date:     ${dateStr}`);
  lines.push(`Time:     2:30 PM shotgun start`);
  lines.push(`Layout:   ${cfg.label} (holes ${cfg.range})`);
  lines.push(`Players:  ${playerCount} confirmed`);
  lines.push(`Carts:    ${totalCarts}`);
  lines.push(`Fee:      ${fmtMoney(fee)}/player Ã ${playerCount} = ${fmtMoney(total)} estimated`);
  lines.push('');
  lines.push(`Group assignments:`);
  for (const f of foursomes) {
    const tier = f.hasTier ? ` (Tier ${f.tier})` : '';
    const names = f.members.map(m => `${m.name.split(' ')[0][0]}. ${lastName(m.name)}`).join(', ');
    lines.push(`  Hole ${f.hole}${tier}: ${names}`);
  }
  lines.push('');
  lines.push(`Please let us know if anything changes on your end.`);
  lines.push('');
  lines.push(`Thanks,`);
  lines.push(`Fairway Founders`);
  return { subject, body: lines.join('\n') };
}

// ============================================================================
// PRINT â cart label per page
// ============================================================================
function PrintCartLabel({ cart, eventDateStr }) {
  const names = cart.members.map(m => lastName(m.name));
  const tierLabel = cart.hasTier ? ` Â· Tier ${cart.tier}` : '';
  return (
    <div className="print-page">
      <div className="print-brand">
        <div className="print-brand-line">FAIRWAY FOUNDERS</div>
        <div className="print-brand-sub">{eventDateStr}</div>
      </div>
      <div className="print-center">
        <div className="print-cart-label">CART</div>
        <div className="print-cart-num">{cart.number}</div>
      </div>
      <div className="print-names">
        {names.map((n, i) => (
          <React.Fragment key={i}>
            <div className="print-name">{n}</div>
            {i < names.length - 1 && <div className="print-amp">&amp;</div>}
          </React.Fragment>
        ))}
        {names.length === 1 && <div className="print-solo">â solo cart â</div>}
      </div>
      <div className="print-meta">Hole {cart.hole}{tierLabel}  Â·  2:30 PM Shotgun  Â·  {COURSE_NAME}</div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================
const ROLES = [
  { id: 'member', label: 'Member', icon: 'ð¤' },
  { id: 'admin', label: 'Admin', icon: 'âï¸' },
  { id: 'course', label: 'Course', icon: 'ð' },
];

export default function FairwayFounders() {
  const [tab, setTab] = useState('home');
  const [role, setRole] = useState('admin'); // demo default
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [history] = useState(MOCK_HISTORY);
  const [rsvpsByEvent, setRsvpsByEvent] = useState({ 0: new Set([1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16]) });
  const [foursomesByEvent, setFoursomesByEvent] = useState({});
  const [scoreByEvent, setScoreByEvent] = useState({});
  const [sizesByEvent, setSizesByEvent] = useState({});
  const [courseConfigByEvent, setCourseConfigByEvent] = useState({});
  const [feeByEvent, setFeeByEvent] = useState({});
  const [proShopEmailByEvent, setProShopEmailByEvent] = useState({});
  const [scoresByEvent, setScoresByEvent] = useState({}); // { eventIdx: { groupIdx: { holes: [4,5,...] } } }
  const [currentUserId] = useState(1);
  const [now, setNow] = useState(Date.now());
  const [selectedEventIdx, setSelectedEventIdx] = useState(0);
  const [printing, setPrinting] = useState(false);
  const [emailDraft, setEmailDraft] = useState(null);

  const schedule = useMemo(() => buildSchedule(Date.now()), []);
  const selectedEvent = schedule[selectedEventIdx];
  const status = eventStatus(selectedEvent, now);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!printing) return;
    const id = setTimeout(() => window.print(), 100);
    const reset = () => setPrinting(false);
    window.addEventListener('afterprint', reset);
    return () => { clearTimeout(id); window.removeEventListener('afterprint', reset); };
  }, [printing]);

  // Auto-snap tab if role changes and current tab not visible
  useEffect(() => {
    if (role === 'member' && (tab === 'admin' || tab === 'course')) setTab('home');
    if (role === 'course' && tab === 'admin') setTab('course');
  }, [role, tab]);

  const me = members.find(m => m.id === currentUserId);
  const rsvps = rsvpsByEvent[selectedEventIdx] || new Set();
  const foursomes = foursomesByEvent[selectedEventIdx] || null;
  const groupScore = scoreByEvent[selectedEventIdx] ?? null;
  const partitionSizesArr = sizesByEvent[selectedEventIdx] || null;
  const courseConfig = courseConfigByEvent[selectedEventIdx] || 'front';
  const fee = feeByEvent[selectedEventIdx] ?? DEFAULT_FEE;
  const proShopEmail = proShopEmailByEvent[selectedEventIdx] || DEFAULT_PRO_SHOP_EMAIL;
  const scores = scoresByEvent[selectedEventIdx] || {};
  const holesPlayed = COURSE_OPTIONS[courseConfig].holes.length;
  const leaderboard = useMemo(() => leaderboardRows(foursomes, scores, holesPlayed), [foursomes, scores, holesPlayed]);
  const rsvpedMembers = members.filter(m => rsvps.has(m.id));
  const myFoursome = foursomes?.find(f => f.members.some(m => m.id === currentUserId));
  const allCarts = foursomes ? getAllCarts(foursomes) : [];
  const eventDateStr = selectedEvent.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  function toggleRsvp(id) {
    setRsvpsByEvent(prev => { const next = new Set(prev[selectedEventIdx] || []); next.has(id) ? next.delete(id) : next.add(id); return { ...prev, [selectedEventIdx]: next }; });
  }
  function clearGroups() {
    setFoursomesByEvent(prev => { const n = { ...prev }; delete n[selectedEventIdx]; return n; });
    setScoreByEvent(prev => { const n = { ...prev }; delete n[selectedEventIdx]; return n; });
    setSizesByEvent(prev => { const n = { ...prev }; delete n[selectedEventIdx]; return n; });
  }
  function setCourseConfig(cfg) { setCourseConfigByEvent(prev => ({ ...prev, [selectedEventIdx]: cfg })); clearGroups(); }
  function setFee(v) { setFeeByEvent(prev => ({ ...prev, [selectedEventIdx]: v })); }
  function setProShopEmail(v) { setProShopEmailByEvent(prev => ({ ...prev, [selectedEventIdx]: v })); }
  function runGrouping() {
    const result = generateGroups(rsvpedMembers, history, courseConfig);
    if (!result) { alert('Need at least 2 RSVPs to generate groups.'); return; }
    setFoursomesByEvent(prev => ({ ...prev, [selectedEventIdx]: result.foursomes }));
    setScoreByEvent(prev => ({ ...prev, [selectedEventIdx]: result.score }));
    setSizesByEvent(prev => ({ ...prev, [selectedEventIdx]: result.sizes }));
  }
  function updateMe(updates) { setMembers(prev => prev.map(m => m.id === currentUserId ? { ...m, ...updates } : m)); }

  // Swap two players' positions wherever they sit. Cross-foursome = position swap.
  // Within same foursome = cart swap. Group sizes preserved.
  function swapPlayers(idA, idB) {
    if (idA === idB) return;
    const current = foursomesByEvent[selectedEventIdx];
    if (!current) return;
    let a = null, b = null;
    for (const f of current) for (const m of f.members) {
      if (m.id === idA) a = m;
      if (m.id === idB) b = m;
    }
    if (!a || !b) return;
    const swap = m => m.id === idA ? b : m.id === idB ? a : m;
    const next = current.map(f => ({
      ...f,
      members: f.members.map(swap),
      carts: f.carts.map(c => ({ ...c, members: c.members.map(swap) })),
    }));
    setFoursomesByEvent(prev => ({ ...prev, [selectedEventIdx]: next }));
  }

  function updateScore(groupIdx, holeIdx, value) {
    setScoresByEvent(prev => {
      const event = { ...(prev[selectedEventIdx] || {}) };
      const group = { ...(event[groupIdx] || { holes: [] }) };
      const holes = [...group.holes];
      holes[holeIdx] = value;
      group.holes = holes;
      event[groupIdx] = group;
      return { ...prev, [selectedEventIdx]: event };
    });
  }

  function openEmailDraft() {
    if (!foursomes) return;
    const draft = buildProShopEmail({ event: selectedEvent, foursomes, members: rsvpedMembers, fee, courseConfig });
    setEmailDraft({ ...draft, to: proShopEmail });
  }

  // Build tabs based on role
  const tabConfig = [
    { id: 'home', label: 'Tee Time', icon: 'â³', roles: ['member', 'admin', 'course'] },
    { id: 'leaderboard', label: 'Board', icon: 'ð', roles: ['member', 'admin', 'course'] },
    { id: 'profile', label: 'Profile', icon: 'ð¤', roles: ['member', 'admin'] },
    { id: 'members', label: 'Roster', icon: 'ð§âð¤âð§', roles: ['member', 'admin', 'course'] },
    { id: 'admin', label: 'Admin', icon: 'âï¸', roles: ['admin'] },
    { id: 'course', label: 'Course Ops', icon: 'ð', roles: ['admin', 'course'] },
  ].filter(t => t.roles.includes(role));

  return (
    <div style={{ minHeight: '100vh', background: '#f5f1e8', fontFamily: "'Inter', system-ui, sans-serif", color: '#1a3a2e' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
        .card { background: #fff; border: 1px solid #e8e2d2; border-radius: 12px; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .input { width: 100%; border: 1px solid #e8e2d2; border-radius: 6px; padding: 9px 10px; font-size: 13px; font-family: inherit; color: #1a3a2e; background: #fff; }

        .print-only { display: none; }
        @media print {
          @page { size: letter landscape; margin: 0.4in; }
          html, body { background: #fff !important; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
          .print-page { page-break-after: always; break-after: page; width: 100%; height: 7.5in; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; color: #1a3a2e; padding: 0.3in 0; }
          .print-page:last-child { page-break-after: auto; break-after: auto; }
          .print-brand { width: 100%; }
          .print-brand-line { font-family: 'Fraunces', Georgia, serif; font-size: 22pt; font-weight: 600; letter-spacing: 0.2em; }
          .print-brand-sub { font-family: 'Inter', sans-serif; font-size: 11pt; color: #8a8576; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4pt; }
          .print-center { display: flex; flex-direction: column; align-items: center; }
          .print-cart-label { font-family: 'Inter', sans-serif; font-size: 28pt; font-weight: 600; letter-spacing: 0.4em; color: #c9a961; }
          .print-cart-num { font-family: 'Fraunces', Georgia, serif; font-size: 180pt; font-weight: 700; line-height: 0.85; }
          .print-names { display: flex; flex-direction: column; align-items: center; }
          .print-name { font-family: 'Fraunces', Georgia, serif; font-size: 54pt; font-weight: 500; line-height: 1.1; letter-spacing: 0.02em; }
          .print-amp { font-family: 'Fraunces', Georgia, serif; font-size: 32pt; font-style: italic; color: #c9a961; line-height: 1.1; }
          .print-solo { font-family: 'Inter', sans-serif; font-size: 14pt; color: #8a8576; font-style: italic; margin-top: 8pt; }
          .print-meta { font-family: 'Inter', sans-serif; font-size: 13pt; color: #5a5a4a; letter-spacing: 0.08em; }
        }
      `}</style>

      {printing && (
        <div className="print-only">
          {allCarts.map(cart => <PrintCartLabel key={cart.number} cart={cart} eventDateStr={eventDateStr} />)}
        </div>
      )}

      {emailDraft && <EmailDraftModal draft={emailDraft} onClose={() => setEmailDraft(null)} />}

      <div className="screen-only">
        <header style={{ padding: '20px 20px 12px', borderBottom: '1px solid #e8e2d2', background: '#f5f1e8', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="display" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>Fairway</div>
              <div className="display" style={{ fontSize: 22, fontWeight: 400, lineHeight: 1, fontStyle: 'italic', color: '#c9a961' }}>Founders</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <RoleSwitcher value={role} onChange={setRole} />
              <div style={{ fontSize: 10, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Round 23 Â· {rsvpedMembers.length} in</div>
            </div>
          </div>
        </header>

        <main style={{ padding: '20px', paddingBottom: 100, maxWidth: 480, margin: '0 auto' }}>
          {tab === 'home' && (
            <HomeView me={me} myFoursome={myFoursome} schedule={schedule}
              selectedEventIdx={selectedEventIdx} onSelectEvent={setSelectedEventIdx}
              selectedEvent={selectedEvent} status={status} now={now}
              rsvped={rsvps.has(currentUserId)} onToggleRsvp={() => toggleRsvp(currentUserId)}
              courseConfig={courseConfig} fee={fee} role={role} />
          )}
          {tab === 'profile' && <ProfileView me={me} onUpdate={updateMe} />}
          {tab === 'leaderboard' && (
            <LeaderboardView
              leaderboard={leaderboard} foursomes={foursomes} scores={scores}
              holesPlayed={holesPlayed} courseConfig={courseConfig}
              currentUserId={currentUserId} role={role}
              onUpdateScore={updateScore}
              selectedEvent={selectedEvent} status={status}
            />
          )}
          {tab === 'members' && <MembersView members={members} currentUserId={currentUserId} history={history} role={role} />}
          {tab === 'admin' && (
            <AdminView members={members} rsvps={rsvps} onToggleRsvp={toggleRsvp}
              foursomes={foursomes} groupScore={groupScore} sizes={partitionSizesArr}
              courseConfig={courseConfig} onSetCourseConfig={setCourseConfig}
              fee={fee} onSetFee={setFee}
              proShopEmail={proShopEmail} onSetProShopEmail={setProShopEmail}
              onGenerate={runGrouping} onPrintCarts={() => setPrinting(true)}
              onEmailProShop={openEmailDraft} onSwapPlayers={swapPlayers}
              history={history} selectedEvent={selectedEvent} status={status} />
          )}
          {tab === 'course' && (
            <CourseOpsView
              foursomes={foursomes} rsvpedMembers={rsvpedMembers} fee={fee}
              courseConfig={courseConfig} selectedEvent={selectedEvent} status={status}
              onPrintCarts={() => setPrinting(true)} onEmailProShop={openEmailDraft}
              proShopEmail={proShopEmail} role={role} />
          )}
        </main>

        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a3a2e', borderTop: '1px solid #c9a961', padding: '12px 0 20px', zIndex: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: 480, margin: '0 auto' }}>
            {tabConfig.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 8px',
                  color: tab === t.id ? '#c9a961' : '#a8a596' }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

// ============================================================================
// ROLE SWITCHER
// ============================================================================
function RoleSwitcher({ value, onChange }) {
  return (
    <div style={{ display: 'flex', background: '#fff', border: '1px solid #e8e2d2', borderRadius: 16, padding: 2 }}>
      {ROLES.map(r => (
        <button key={r.id} onClick={() => onChange(r.id)}
          style={{ background: value === r.id ? '#1a3a2e' : 'transparent', color: value === r.id ? '#c9a961' : '#5a5a4a',
            border: 'none', borderRadius: 14, padding: '4px 9px', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// EMAIL DRAFT MODAL
// ============================================================================
function EmailDraftModal({ draft, onClose }) {
  const [copied, setCopied] = useState(false);
  const mailtoUrl = `mailto:${encodeURIComponent(draft.to)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;

  function copy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`To: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,58,46,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '92vh', background: '#f5f1e8', borderTopLeftRadius: 16, borderTopRightRadius: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e2d2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>Email to Pro Shop</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#5a5a4a', cursor: 'pointer', padding: 4 }}>Ã</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>To</div>
            <input className="input" value={draft.to} readOnly />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Subject</div>
            <input className="input" value={draft.subject} readOnly />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Body</div>
            <textarea className="input" value={draft.body} readOnly style={{ height: 280, resize: 'vertical', fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.5 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #e8e2d2', background: '#f5f1e8' }}>
          <button onClick={copy}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #c9a961', background: '#fff', color: '#1a3a2e', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            {copied ? 'â Copied' : 'Copy'}
          </button>
          <a href={mailtoUrl}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#1a3a2e', color: '#c9a961', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
            â Open in Email
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CALENDAR STRIP
// ============================================================================
function CalendarStrip({ schedule, selectedIdx, onSelect, now }) {
  return (
    <div className="hide-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 18, padding: '2px 0' }}>
      {schedule.map((evt, i) => {
        const s = eventStatus(evt, now);
        const isSelected = i === selectedIdx;
        const dayLabel = evt.date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateLabel = evt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const statusLabel = s === 'open' ? 'OPEN' : s === 'locked' ? `OPENS ${evt.opensAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : s === 'closed' ? 'GROUPS SET' : 'PAST';
        const statusColor = s === 'open' ? '#7c9885' : s === 'locked' ? '#8a8576' : s === 'closed' ? '#c9a961' : '#8a8576';
        return (
          <button key={i} onClick={() => onSelect(i)}
            style={{ flexShrink: 0, minWidth: 96, padding: '10px 12px', borderRadius: 10,
              background: isSelected ? '#1a3a2e' : '#fff', border: `1px solid ${isSelected ? '#1a3a2e' : '#e8e2d2'}`,
              color: isSelected ? '#f5f1e8' : '#1a3a2e', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', opacity: 0.7 }}>{dayLabel.toUpperCase()}</div>
            <div className="display" style={{ fontSize: 16, fontWeight: 600, margin: '2px 0' }}>{dateLabel}</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: isSelected ? '#c9a961' : statusColor }}>{statusLabel}</div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// HOME VIEW
// ============================================================================
function HomeView({ me, myFoursome, schedule, selectedEventIdx, onSelectEvent, selectedEvent, status, now, rsvped, onToggleRsvp, courseConfig, fee, role }) {
  const isOpen = status === 'open';
  const isLocked = status === 'locked';
  const cutoffMs = selectedEvent.closesAt.getTime() - now;
  const opensInMs = selectedEvent.opensAt.getTime() - now;
  const dateStr = selectedEvent.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const courseLabel = courseConfig === 'front' ? 'front nine scramble' : courseConfig === 'back' ? 'back nine scramble' : '18-hole scramble';

  return (
    <div>
      <CalendarStrip schedule={schedule} selectedIdx={selectedEventIdx} onSelect={onSelectEvent} now={now} />

      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8576' }}>{dateStr}</div>
      <h1 className="display" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 4px', lineHeight: 1.1 }}>
        Tee off <span style={{ fontStyle: 'italic', color: '#c9a961' }}>at half-past two</span>
      </h1>
      <div style={{ fontSize: 14, color: '#5a5a4a', marginBottom: 6 }}>{COURSE_NAME} Â· {courseLabel} Â· shotgun start</div>
      <div style={{ fontSize: 12, color: '#8a8576', marginBottom: 20 }}>Green fee Â· <strong style={{ color: '#1a3a2e' }}>{fmtMoney(fee)} per player</strong> (paid at the pro shop)</div>

      {role !== 'course' && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          {isOpen && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8576' }}>RSVP closes in</div>
                  <div className="display" style={{ fontSize: 28, fontWeight: 500 }}>{formatCountdown(cutoffMs)}</div>
                </div>
                <div className="pulse" style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c9885', marginTop: 8 }} />
              </div>
              <button onClick={onToggleRsvp}
                style={{ width: '100%', padding: '14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: rsvped ? '#1a3a2e' : '#c9a961', color: rsvped ? '#f5f1e8' : '#1a3a2e',
                  fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {rsvped ? `â You're in Â· ${fmtMoney(fee)}` : `Tap to RSVP Â· ${fmtMoney(fee)}`}
              </button>
            </>
          )}
          {isLocked && (
            <div style={{ textAlign: 'center', padding: '4px 0' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8576' }}>RSVP opens</div>
              <div className="display" style={{ fontSize: 22, fontWeight: 500 }}>Thu {selectedEvent.opensAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              <div style={{ fontSize: 12, color: '#8a8576', marginTop: 4 }}>{formatCountdown(opensInMs)} from now</div>
            </div>
          )}
          {status === 'closed' && (
            <div style={{ textAlign: 'center', padding: '4px 0' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8576' }}>RSVP closed</div>
              <div className="display" style={{ fontSize: 20, fontWeight: 500, color: '#c9a961' }}>Foursomes are set</div>
            </div>
          )}
        </div>
      )}

      {myFoursome && role !== 'course' ? (
        <div>
          <div style={{ marginBottom: 12, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8576' }}>Your Group</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ background: '#1a3a2e', color: '#f5f1e8', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#c9a961', fontWeight: 600 }}>STARTING HOLE</div>
                <div className="display" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1 }}>Hole {myFoursome.hole}{myFoursome.hasTier ? ` Â· Tier ${myFoursome.tier}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#c9a961', fontWeight: 600 }}>SHOTGUN</div>
                <div className="display" style={{ fontSize: 18, fontWeight: 500 }}>2:30 PM</div>
              </div>
            </div>
            {myFoursome.carts.map((cart, ci) => (
              <div key={cart.number}>
                <div style={{ padding: '8px 18px', background: '#f5f1e8', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#5a5a4a', borderTop: ci > 0 ? '1px solid #e8e2d2' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                  <span>CART {cart.number}</span>
                  {cart.members.length === 1 && <span style={{ fontStyle: 'italic', color: '#8a8576', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'none' }}>solo</span>}
                </div>
                {cart.members.map(m => (
                  <div key={m.id} style={{ display: 'flex', gap: 14, padding: 16, borderTop: '1px solid #f0ebd8' }}>
                    <Avatar size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{m.name}{m.id === me.id && <span style={{ color: '#c9a961', fontWeight: 400 }}> (you)</span>}</div>
                      <div style={{ fontSize: 12, color: '#8a8576', marginBottom: 4 }}>{m.role} Â· {m.company}</div>
                      <div style={{ fontSize: 12, color: '#5a5a4a', lineHeight: 1.4 }}>{m.bio}</div>
                      {m.helps && (
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {m.helps.map(h => <span key={h} style={{ fontSize: 10, padding: '2px 8px', background: '#f0ebd8', color: '#5a5a4a', borderRadius: 12 }}>{h}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : isOpen && role !== 'course' ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', background: '#1a3a2e', color: '#f5f1e8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>â³</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 500 }}>Groups drop at cutoff</div>
          <div style={{ fontSize: 13, color: '#a8a596', marginTop: 4 }}>Algorithm pairs carts + assigns holes</div>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================================
// PROFILE VIEW
// ============================================================================
function ProfileView({ me, onUpdate }) {
  const [bio, setBio] = useState(me.bio);
  const [helps, setHelps] = useState(me.helps?.join(', ') || '');
  const [handicap, setHandicap] = useState(me.handicap ?? '');
  const [editing, setEditing] = useState(false);
  function save() {
    const hcp = handicap === '' ? null : Math.max(0, Math.min(54, parseFloat(handicap) || 0));
    onUpdate({ bio, helps: helps.split(',').map(s => s.trim()).filter(Boolean), handicap: hcp });
    setEditing(false);
  }
  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8576' }}>Your Profile</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Avatar size={80} bg="#1a3a2e" fg="#c9a961" />
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.1 }}>{me.name}</div>
          <div style={{ fontSize: 13, color: '#5a5a4a' }}>{me.role}</div>
          <div style={{ fontSize: 12, color: '#8a8576' }}>{me.company}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 14px', background: '#1a3a2e', borderRadius: 10, color: '#c9a961' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em' }}>HCP</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, color: '#f5f1e8' }}>{me.handicap ?? 'â'}</div>
        </div>
      </div>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8576' }}>Bio</div>
          <button onClick={() => editing ? save() : setEditing(true)} style={{ fontSize: 11, background: 'none', border: 'none', color: '#c9a961', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{editing ? 'Save' : 'Edit'}</button>
        </div>
        {editing ? <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="input" style={{ resize: 'vertical' }}/> : <div style={{ fontSize: 14, lineHeight: 1.5 }}>{me.bio}</div>}
      </div>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8576', marginBottom: 10 }}>Handicap Index</div>
        {editing ? (
          <>
            <input type="number" min="0" max="54" step="0.1" value={handicap} onChange={e => setHandicap(e.target.value)} placeholder="e.g. 14" className="input" />
            <div style={{ fontSize: 10, color: '#8a8576', marginTop: 6 }}>Used for net scoring on the leaderboard. 0â54.</div>
          </>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>{me.handicap != null ? `${me.handicap}` : 'Not set â leaderboard will use your gross score.'}</div>
        )}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8576', marginBottom: 10 }}>Can Help With</div>
        {editing ? <input value={helps} onChange={e => setHelps(e.target.value)} placeholder="comma, separated, tags" className="input"/> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {me.helps?.map(h => <span key={h} style={{ fontSize: 12, padding: '6px 12px', background: '#f0ebd8', color: '#5a5a4a', borderRadius: 16 }}>{h}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LEADERBOARD VIEW
// ============================================================================
function LeaderboardView({ leaderboard, foursomes, scores, holesPlayed, courseConfig, currentUserId, role, onUpdateScore, selectedEvent, status }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const dateStr = selectedEvent.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const cfg = COURSE_OPTIONS[courseConfig];
  const par = holesPlayed === 9 ? 36 : 72;
  const canEdit = role === 'admin';

  if (!foursomes) {
    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8576' }}>Leaderboard</div>
        <h1 className="display" style={{ fontSize: 26, fontWeight: 500, margin: '0 0 16px' }}>{dateStr}</h1>
        <div className="card" style={{ padding: 32, textAlign: 'center', color: '#8a8576' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>ð</div>
          <div className="display" style={{ fontSize: 16, fontWeight: 500, color: '#1a3a2e' }}>Leaderboard not yet live</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Once admin generates groups and scoring opens, results post here in real time.</div>
        </div>
      </div>
    );
  }

  const anyScores = leaderboard.some(r => r.holesIn > 0);
  const myRow = leaderboard.find(r => r.foursome.members.some(m => m.id === currentUserId));

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8576' }}>Leaderboard Â· Live</div>
      <h1 className="display" style={{ fontSize: 26, fontWeight: 500, margin: '0 0 4px' }}>{dateStr}</h1>
      <div style={{ fontSize: 12, color: '#8a8576', marginBottom: 16 }}>{cfg.label} Â· Par {par} Â· scramble Â· net scoring</div>

      {/* My group banner */}
      {myRow && (
        <div className="card" style={{ padding: 14, marginBottom: 12, background: '#1a3a2e', color: '#f5f1e8', borderColor: '#c9a961' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#c9a961' }}>YOUR GROUP</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>
              Hole {myRow.foursome.hole} Â· thru {myRow.thru}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="display" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
                {myRow.net != null ? fmtToPar(myRow.toPar) : 'â'}
              </div>
              <div style={{ fontSize: 10, color: '#a8a596' }}>net Â· hcp {myRow.teamHcp}</div>
            </div>
          </div>
        </div>
      )}

      {!anyScores && (
        <div className="card" style={{ padding: 20, marginBottom: 12, textAlign: 'center', background: '#fff8e8' }}>
          <div className="pulse" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#c9a961', marginRight: 8 }} />
          <span style={{ fontSize: 12, color: '#5a5a4a', verticalAlign: 'middle' }}>
            Waiting for first scores Â· {canEdit ? 'tap any group to enter' : 'admin will post during the round'}
          </span>
        </div>
      )}

      {/* Leaderboard rows */}
      {leaderboard.map((row, rank) => {
        const isMine = row.foursome.members.some(m => m.id === currentUserId);
        const isExpanded = expandedIdx === row.idx;
        const showRank = row.holesIn > 0;
        const place = showRank ? rank + 1 : null;
        const placeColor = place === 1 ? '#c9a961' : place === 2 ? '#a8a596' : place === 3 ? '#a87c4f' : '#5a5a4a';
        return (
          <div key={row.idx} className="card" style={{ marginBottom: 8, overflow: 'hidden', borderColor: isMine ? '#c9a961' : '#e8e2d2' }}>
            <button onClick={() => setExpandedIdx(isExpanded ? null : row.idx)}
              style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                {showRank ? (
                  <div className="display" style={{ fontSize: 22, fontWeight: 700, color: placeColor, lineHeight: 1 }}>
                    {place === 1 ? '1' : place === 2 ? '2' : place === 3 ? '3' : place}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: '#8a8576', fontWeight: 600, letterSpacing: '0.1em' }}>â</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a3a2e', lineHeight: 1.3 }}>
                  {row.foursome.members.map(m => lastName(m.name)).join(' / ')}
                </div>
                <div style={{ fontSize: 10, color: '#8a8576', marginTop: 2, letterSpacing: '0.05em' }}>
                  HOLE {row.foursome.hole}{row.foursome.hasTier ? ` Â· TIER ${row.foursome.tier}` : ''} Â· TEAM HCP {row.teamHcp}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="display" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, color: row.toPar < 0 ? '#7c9885' : '#1a3a2e' }}>
                  {row.holesIn > 0 ? fmtToPar(row.toPar) : 'â'}
                </div>
                <div style={{ fontSize: 10, color: '#8a8576', marginTop: 2 }}>
                  {row.holesIn > 0 ? `thru ${row.thru} Â· net ${row.net}` : 'no scores'}
                </div>
              </div>
            </button>
            {isExpanded && (
              <ScoreEntry holesPlayed={holesPlayed} courseConfig={courseConfig}
                holes={scores[row.idx]?.holes || []}
                onChange={(holeIdx, val) => onUpdateScore(row.idx, holeIdx, val)}
                canEdit={canEdit} teamHcp={row.teamHcp} foursome={row.foursome} />
            )}
          </div>
        );
      })}

      <div style={{ fontSize: 10, color: '#8a8576', marginTop: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5 }}>
        Net = team gross â team handicap.<br/>
        Team handicap uses USGA scramble formula (25/20/15/10%) scaled to {holesPlayed} holes.
      </div>
    </div>
  );
}

function ScoreEntry({ holesPlayed, courseConfig, holes, onChange, canEdit, teamHcp, foursome }) {
  const startHole = COURSE_OPTIONS[courseConfig].holes[0];
  const holeNumbers = COURSE_OPTIONS[courseConfig].holes;
  const PAR = 4; // simplified: assume par-4 average per hole

  return (
    <div style={{ background: '#f5f1e8', borderTop: '1px solid #e8e2d2', padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>
        Hole-by-Hole Scoring {!canEdit && <span style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>Â· view only</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
        {holeNumbers.map((hn, i) => {
          const val = holes[i];
          const score = val ? parseInt(val) : null;
          const diff = score ? score - PAR : null;
          const bg = !val ? '#fff' : diff < 0 ? '#7c9885' : diff === 0 ? '#fff' : diff === 1 ? '#f0ebd8' : '#a87c4f';
          const fg = !val ? '#1a3a2e' : (diff < 0 || diff > 1) ? '#fff' : '#1a3a2e';
          return (
            <div key={hn} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ fontSize: 9, color: '#8a8576', fontWeight: 600 }}>{hn}</div>
              {canEdit ? (
                <input type="number" min="1" max="15" value={val ?? ''}
                  onChange={e => onChange(i, e.target.value === '' ? null : parseInt(e.target.value))}
                  style={{ width: '100%', padding: '6px 0', textAlign: 'center', border: '1px solid #e8e2d2', borderRadius: 4, fontSize: 14, fontWeight: 600, background: bg, color: fg, fontFamily: 'inherit' }} />
              ) : (
                <div style={{ width: '100%', padding: '6px 0', textAlign: 'center', border: '1px solid #e8e2d2', borderRadius: 4, fontSize: 14, fontWeight: 600, background: bg, color: fg }}>
                  {val ?? 'â'}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12, paddingTop: 10, borderTop: '1px solid #e8e2d2', fontSize: 11 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#8a8576', letterSpacing: '0.1em', fontWeight: 600 }}>GROSS</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{holes.reduce((a, h) => a + (h || 0), 0) || 'â'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#8a8576', letterSpacing: '0.1em', fontWeight: 600 }}>â HCP</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{teamHcp}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#c9a961', letterSpacing: '0.1em', fontWeight: 700 }}>NET</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 700, color: '#1a3a2e' }}>
            {holes.reduce((a, h) => a + (h || 0), 0) > 0 ? holes.reduce((a, h) => a + (h || 0), 0) - teamHcp : 'â'}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e8e2d2' }}>
        <div style={{ fontSize: 10, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>Players Â· Individual HCP</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {foursome.members.map(m => (
            <div key={m.id} style={{ fontSize: 11, padding: '3px 8px', background: '#fff', border: '1px solid #e8e2d2', borderRadius: 12, color: '#5a5a4a' }}>
              {m.name.split(' ')[0]} {lastName(m.name)[0]} Â· <strong style={{ color: '#1a3a2e' }}>{m.handicap ?? 'â'}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MEMBERS VIEW
// ============================================================================
function MembersView({ members, currentUserId, history, role }) {
  const [selected, setSelected] = useState(null);
  if (selected) {
    const playedWith = Object.entries(history)
      .filter(([k]) => k.split('-').includes(String(selected.id)))
      .map(([k, count]) => { const otherId = k.split('-').map(Number).find(id => id !== selected.id); return { member: members.find(m => m.id === otherId), count }; })
      .sort((a, b) => b.count - a.count);
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#c9a961', fontSize: 13, marginBottom: 16, cursor: 'pointer', padding: 0 }}>â Roster</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <Avatar size={64} />
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 22, fontWeight: 500 }}>{selected.name}</div>
            <div style={{ fontSize: 13, color: '#5a5a4a' }}>{selected.role}</div>
            <div style={{ fontSize: 12, color: '#8a8576' }}>{selected.company}</div>
          </div>
          {selected.handicap != null && (
            <div style={{ textAlign: 'center', padding: '6px 12px', background: '#1a3a2e', borderRadius: 8, color: '#c9a961' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em' }}>HCP</div>
              <div className="display" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1, color: '#f5f1e8' }}>{selected.handicap}</div>
            </div>
          )}
        </div>
        {role !== 'course' && (
          <div className="card" style={{ padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{selected.bio}</div>
          </div>
        )}
        {role !== 'course' && selected.helps && (
          <div className="card" style={{ padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8576', marginBottom: 8 }}>Can help with</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selected.helps.map(h => <span key={h} style={{ fontSize: 12, padding: '6px 12px', background: '#f0ebd8', borderRadius: 16, color: '#5a5a4a' }}>{h}</span>)}
            </div>
          </div>
        )}
        {role !== 'course' && playedWith.length > 0 && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8576', marginBottom: 10 }}>Past Rounds Together</div>
            {playedWith.slice(0, 5).map(({ member, count }) => member && (
              <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0ebd8', fontSize: 13 }}>
                <span>{member.name}</span>
                <span style={{ color: '#c9a961', fontWeight: 600 }}>{count}Ã</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8576' }}>Roster Â· {members.length} members</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {members.map(m => (
          <button key={m.id} onClick={() => setSelected(m)} style={{ background: '#fff', border: '1px solid #e8e2d2', borderRadius: 12, padding: 14, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Avatar size={40} />
              {m.handicap != null && (
                <div style={{ fontSize: 9, padding: '2px 6px', background: '#1a3a2e', color: '#c9a961', borderRadius: 6, fontWeight: 700, letterSpacing: '0.05em' }}>HCP {m.handicap}</div>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{m.name}{m.id === currentUserId && <span style={{ color: '#c9a961', fontWeight: 400 }}> (you)</span>}</div>
            <div style={{ fontSize: 11, color: '#8a8576', marginTop: 2 }}>{m.role}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COURSE OPS VIEW (for 'course' or 'admin' role)
// ============================================================================
function CourseOpsView({ foursomes, rsvpedMembers, fee, courseConfig, selectedEvent, status, onPrintCarts, onEmailProShop, proShopEmail, role }) {
  const dateStr = selectedEvent.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const cfg = COURSE_OPTIONS[courseConfig];
  const playerCount = rsvpedMembers.length;
  const totalCarts = foursomes ? foursomes.reduce((a, f) => a + f.carts.length, 0) : 0;
  const totalFee = playerCount * fee;

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8576' }}>Course Operations</div>
      <h1 className="display" style={{ fontSize: 26, fontWeight: 500, margin: '0 0 4px' }}>{dateStr}</h1>
      <div style={{ fontSize: 11, color: '#8a8576', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>2:30 PM Shotgun Â· {COURSE_NAME}</div>

      {/* Big summary card */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ background: '#1a3a2e', color: '#f5f1e8', padding: '14px 18px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#c9a961', fontWeight: 600 }}>EVENT SUMMARY</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 500 }}>Round 23</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <SummaryStat label="Players" value={playerCount} sub="confirmed" />
          <SummaryStat label="Carts" value={totalCarts} sub={`${COURSE_OPTIONS[courseConfig].label}`} border="left" />
          <SummaryStat label="Layout" value={cfg.label} sub={`Holes ${cfg.range}`} border="top" />
          <SummaryStat label="Total" value={fmtMoney(totalFee)} sub={`${fmtMoney(fee)} Ã ${playerCount}`} border="left top" />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={onEmailProShop} disabled={!foursomes}
          style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: foursomes ? '#1a3a2e' : '#a8a596', color: '#c9a961', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: foursomes ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          â Draft Email
        </button>
        <button onClick={onPrintCarts} disabled={!foursomes}
          style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #c9a961', background: '#fff', color: '#1a3a2e', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: foursomes ? 'pointer' : 'not-allowed', opacity: foursomes ? 1 : 0.5, fontFamily: 'inherit' }}>
          ð¨ Cart Labels
        </button>
      </div>

      {role === 'course' && (
        <div style={{ fontSize: 11, color: '#8a8576', marginBottom: 12, fontStyle: 'italic', textAlign: 'center' }}>
          Pro shop email on file: {proShopEmail}
        </div>
      )}

      {/* Group / hole / cart breakdown â operational only, no bios */}
      {foursomes ? (
        <>
          <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8576' }}>Hole assignments</div>
          {foursomes.map((f, gi) => (
            <div key={gi} className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f5f1e8', borderBottom: '1px solid #e8e2d2' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>HOLE {f.hole}{f.hasTier ? ` Â· TIER ${f.tier}` : ''}</div>
                <div style={{ fontSize: 11, color: '#8a8576' }}>{f.members.length} players Â· {f.carts.length} cart{f.carts.length > 1 ? 's' : ''}</div>
              </div>
              {f.carts.map(cart => (
                <div key={cart.number} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid #f0ebd8', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#c9a961', minWidth: 60 }}>Cart {cart.number}</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>{cart.members.map(m => lastName(m.name)).join(' & ')}</span>
                </div>
              ))}
            </div>
          ))}
        </>
      ) : (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#8a8576' }}>
          <div style={{ fontSize: 13, fontStyle: 'italic' }}>Groups not yet generated</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Status: {status}</div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value, sub, border = '' }) {
  const borders = {
    borderLeft: border.includes('left') ? '1px solid #e8e2d2' : 'none',
    borderTop: border.includes('top') ? '1px solid #e8e2d2' : 'none',
  };
  return (
    <div style={{ padding: '14px 16px', ...borders }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#8a8576', textTransform: 'uppercase' }}>{label}</div>
      <div className="display" style={{ fontSize: 24, fontWeight: 600, marginTop: 2, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#8a8576', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ============================================================================
// ADMIN VIEW
// ============================================================================
function AdminView({ members, rsvps, onToggleRsvp, foursomes, groupScore, sizes, courseConfig, onSetCourseConfig, fee, onSetFee, proShopEmail, onSetProShopEmail, onGenerate, onPrintCarts, onEmailProShop, onSwapPlayers, history, selectedEvent, status }) {
  const [section, setSection] = useState('settings');
  const [selectedSwapId, setSelectedSwapId] = useState(null);
  const dateStr = selectedEvent.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const partition = describePartition(sizes);
  const hasUnavoidablePair = sizes && sizes.includes(2);
  const totalCarts = foursomes ? foursomes.reduce((a, f) => a + f.carts.length, 0) : 0;

  const selectedSwapPlayer = selectedSwapId && foursomes
    ? foursomes.flatMap(f => f.members).find(m => m.id === selectedSwapId)
    : null;

  function handlePlayerTap(playerId) {
    if (!selectedSwapId) { setSelectedSwapId(playerId); return; }
    if (selectedSwapId === playerId) { setSelectedSwapId(null); return; }
    onSwapPlayers(selectedSwapId, playerId);
    setSelectedSwapId(null);
  }

  // Clear selection when switching sections or regenerating
  useEffect(() => { setSelectedSwapId(null); }, [section, foursomes]);

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8576' }}>Admin Console</div>
      <h1 className="display" style={{ fontSize: 26, fontWeight: 500, margin: '0 0 4px' }}>{dateStr}</h1>
      <div style={{ fontSize: 11, color: '#8a8576', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status Â· {status}</div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', padding: 4, borderRadius: 8, border: '1px solid #e8e2d2' }}>
        {['settings', 'rsvps', 'groups', 'history'].map(s => (
          <button key={s} onClick={() => setSection(s)}
            style={{ flex: 1, padding: '8px 4px', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
              background: section === s ? '#1a3a2e' : 'transparent', color: section === s ? '#c9a961' : '#5a5a4a' }}>
            {s}
          </button>
        ))}
      </div>

      {section === 'settings' && (
        <div>
          <CourseConfigSelector value={courseConfig} onChange={onSetCourseConfig} rsvpCount={rsvps.size} />
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Green Fee Per Player</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#5a5a4a' }}>$</span>
              <input className="input" type="number" min="0" value={fee} onChange={e => onSetFee(parseInt(e.target.value) || 0)} style={{ flex: 1 }} />
            </div>
            <div style={{ fontSize: 10, color: '#8a8576', marginTop: 6 }}>Members see this on the RSVP screen.</div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Pro Shop Email</div>
            <input className="input" type="email" value={proShopEmail} onChange={e => onSetProShopEmail(e.target.value)} />
            <div style={{ fontSize: 10, color: '#8a8576', marginTop: 6 }}>Used for tee-time confirmation drafts after groups generate.</div>
          </div>
        </div>
      )}

      {section === 'rsvps' && (
        <div className="card" style={{ padding: 4 }}>
          {members.map((m, i) => (
            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderBottom: i < members.length - 1 ? '1px solid #f0ebd8' : 'none', cursor: 'pointer' }}>
              <input type="checkbox" checked={rsvps.has(m.id)} onChange={() => onToggleRsvp(m.id)} style={{ width: 18, height: 18, accentColor: '#1a3a2e' }} />
              <Avatar size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#8a8576' }}>{m.role}</div>
              </div>
            </label>
          ))}
        </div>
      )}

      {section === 'groups' && (
        <div>
          <button onClick={onGenerate} disabled={rsvps.size < 2}
            style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', background: rsvps.size < 2 ? '#a8a596' : '#1a3a2e', color: '#c9a961', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: rsvps.size < 2 ? 'not-allowed' : 'pointer', marginBottom: 10 }}>
            â¡ Generate Groups ({rsvps.size} in)
          </button>

          {foursomes && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={onEmailProShop}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid #c9a961', background: '#fff', color: '#1a3a2e', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>
                â Email Pro Shop
              </button>
              <button onClick={onPrintCarts}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid #c9a961', background: '#fff', color: '#1a3a2e', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>
                ð¨ Cart Labels ({totalCarts})
              </button>
            </div>
          )}

          {sizes && (
            <div className="card" style={{ padding: 12, marginBottom: 12, background: hasUnavoidablePair ? '#fff8e8' : '#fff' }}>
              <div style={{ fontSize: 11, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Partition</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{rsvps.size} RSVPs â {partition}</div>
              {hasUnavoidablePair && <div style={{ fontSize: 11, color: '#a87c4f', marginTop: 6, fontWeight: 500 }}>â  A pair is unavoidable at this RSVP count.</div>}
            </div>
          )}

          {foursomes && (
            <>
              {selectedSwapPlayer && (
                <div className="card" style={{ padding: 12, marginBottom: 12, background: '#fff8e8', borderColor: '#c9a961', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#a87c4f', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Swap Mode</div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>Tap another player to swap with <strong>{selectedSwapPlayer.name}</strong></div>
                  </div>
                  <button onClick={() => setSelectedSwapId(null)}
                    style={{ background: 'none', border: '1px solid #a87c4f', color: '#a87c4f', borderRadius: 6, padding: '6px 10px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              )}
              <div style={{ fontSize: 11, color: '#8a8576', marginBottom: 12, textAlign: 'center' }}>
                Score: <strong style={{ color: '#1a3a2e' }}>{groupScore}</strong> Â· {totalCarts} carts Â· {COURSE_OPTIONS[courseConfig].label} Â· <em>tap a player to swap</em>
              </div>
              {foursomes.map((f, gi) => {
                const roles = f.members.map(m => m.role);
                const dupes = roles.filter((r, i) => roles.indexOf(r) !== i);
                const groupLabel = f.members.length === 4 ? 'Foursome' : f.members.length === 3 ? 'Trio' : 'Pair';
                return (
                  <div key={gi} className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ background: '#1a3a2e', color: '#f5f1e8', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="display" style={{ fontSize: 15, fontWeight: 600 }}>{groupLabel} {gi + 1}</div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {dupes.length > 0 && <div style={{ fontSize: 9, color: '#e8b97f', fontWeight: 600 }}>â  {dupes[0]} Ã2</div>}
                        <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#c9a961', fontWeight: 700 }}>HOLE {f.hole}{f.hasTier ? ` Â· TIER ${f.tier}` : ''}</div>
                      </div>
                    </div>
                    {f.carts.map((cart, ci) => (
                      <div key={cart.number}>
                        <div style={{ padding: '6px 14px', background: '#f5f1e8', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#5a5a4a', borderTop: ci > 0 ? '1px solid #e8e2d2' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                          <span>CART {cart.number}</span>
                          {cart.members.length === 1 && <span style={{ fontStyle: 'italic', color: '#8a8576', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'none' }}>solo</span>}
                        </div>
                        {cart.members.map(m => {
                          const isSelected = selectedSwapId === m.id;
                          return (
                            <button key={m.id} onClick={() => handlePlayerTap(m.id)}
                              style={{
                                width: '100%', display: 'flex', gap: 10, alignItems: 'center', padding: '8px 14px',
                                borderTop: '1px solid #f0ebd8', borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
                                background: isSelected ? '#fff8e8' : 'transparent',
                                boxShadow: isSelected ? 'inset 3px 0 0 #c9a961' : 'none',
                                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                              }}>
                              <Avatar size={26} />
                              <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: '#1a3a2e' }}>
                                {m.name}
                                {isSelected && <span style={{ color: '#a87c4f', fontWeight: 600, marginLeft: 6 }}>Â· selected</span>}
                              </span>
                              <span style={{ fontSize: 9, color: '#fff', background: ROLE_COLORS[m.role] || '#5a5a4a', padding: '2px 8px', borderRadius: 10 }}>{m.role}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {section === 'history' && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#8a8576', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Top Repeat Pairings</div>
          {Object.entries(history).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, count]) => {
            const [a, b] = k.split('-').map(Number);
            const ma = members.find(m => m.id === a);
            const mb = members.find(m => m.id === b);
            if (!ma || !mb) return null;
            return (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0ebd8', fontSize: 13 }}>
                <div style={{ flex: 1 }}>
                  <div>{ma.name} <span style={{ color: '#8a8576' }}>Ã</span> {mb.name}</div>
                  <div style={{ fontSize: 10, color: '#8a8576' }}>{ma.role} Â· {mb.role}</div>
                </div>
                <div style={{ background: count >= 3 ? '#a13c3c' : '#c9a961', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{count}Ã</div>
              </div>
            );
          })}
          <div style={{ fontSize: 11, color: '#8a8576', marginTop: 12, fontStyle: 'italic' }}>The algorithm penalizes these pairings on the next round.</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COURSE CONFIG SELECTOR
// ============================================================================
function CourseConfigSelector({ value, onChange, rsvpCount }) {
  const opts = [
    { id: 'front', label: 'Front 9', range: '1â9', capacity: 18 },
    { id: 'back', label: 'Back 9', range: '10â18', capacity: 18 },
    { id: 'both', label: 'All 18', range: '1â18', capacity: 36 },
  ];
  const selected = opts.find(o => o.id === value);
  const projFoursomes = Math.ceil(rsvpCount / 4);
  const willOverflow = projFoursomes > selected.capacity / 2 && projFoursomes <= selected.capacity;
  return (
    <div className="card" style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#8a8576', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Course Layout</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {opts.map(opt => (
          <button key={opt.id} onClick={() => onChange(opt.id)}
            style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: `1px solid ${value === opt.id ? '#1a3a2e' : '#e8e2d2'}`,
              background: value === opt.id ? '#1a3a2e' : '#fff', color: value === opt.id ? '#c9a961' : '#1a3a2e', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div className="display" style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', marginTop: 2, opacity: 0.8 }}>HOLES {opt.range}</div>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: '#8a8576', display: 'flex', justifyContent: 'space-between' }}>
        <span>Holes: <strong style={{ color: '#1a3a2e' }}>{selected.range}</strong></span>
        <span>Capacity: <strong style={{ color: '#1a3a2e' }}>{selected.capacity / 2} groups</strong></span>
      </div>
      {willOverflow && <div style={{ fontSize: 10, color: '#a87c4f', marginTop: 6 }}>â  {projFoursomes} groups will tire</div>}
    </div>
  );
}
