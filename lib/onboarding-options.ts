/**
 * Curated taxonomies shared by the onboarding wizard and the /me profile
 * editor. Members can always free-add beyond these — the lists are
 * suggestions that keep the data matchable (filtering, profession-spread).
 *
 * HELP_OPTIONS (the give) and SEEKING_OPTIONS (the ask) are kept parallel so
 * an offer lines up with a need.
 */

export const INDUSTRIES = [
  'Software / SaaS',
  'E-commerce / Retail',
  'Real Estate',
  'Finance / Investing',
  'Healthcare / Wellness',
  'Marketing / Agency',
  'Professional Services',
  'Construction / Trades',
  'Hospitality / F&B',
  'Manufacturing / Logistics',
  'Media / Creative',
  'Education',
] as const;

export const HELP_OPTIONS = [
  'Fundraising & capital',
  'Hiring & recruiting',
  'Sales & GTM',
  'Marketing & brand',
  'Product & engineering',
  'Ops & finance',
  'Legal & compliance',
  'Intros & partnerships',
  'Mentorship & advice',
] as const;

export const SEEKING_OPTIONS = [
  'Investors / capital',
  'Talent to hire',
  'A role / next move',
  'Customers / clients',
  'Co-founders / partners',
  'Trusted vendors',
  'Advice / mentorship',
  'Warm intros',
] as const;
