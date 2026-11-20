import { setting } from '../lib/appConfig';

// =========================================================================
// GENERATION LIMITS OF THE BACKEND (POST /scenario/generate)
// A transactional run returns `count` users x `recordsPerUser` (max 10) records; an aggregational run returns `count` rows.
// =========================================================================
export const MAX_USERS = 5000;
export const MAX_RECORDS_PER_USER = 10;
export const DEFAULT_RECORD_COUNT = 100;
export const RECORD_PRESETS = [10, 100, 1000, 5000];
export const MAX_SEED = 2_147_483_647;

/** Country preselected in the Country dropdown (and used if /catalog/countries cannot be loaded). Set VITE_DEFAULT_COUNTRY to change it. */
export const DEFAULT_COUNTRY: string = setting('VITE_DEFAULT_COUNTRY', import.meta.env.VITE_DEFAULT_COUNTRY as string | undefined) || 'IN';

/** Domains shown for completeness only: they have no catalog data yet, so they are not loaded from the API and cannot be selected. */
// Industries offered for now; the rest of the catalog stays on the server and appears here once its pattern is added.
export const ENABLED_INDUSTRIES: RegExp[] = [/telecom/i, /bank/i];
// What the person reads for an industry (display only; the catalog name is still what is sent to the API).
export const industryLabel = (name: string): string => (/bank/i.test(name) ? 'BFSI' : name);
// Greyed-out tiles for industries that are announced but not available. None for now.
export const COMING_SOON_DOMAINS: string[] = [];

// Where the schema comes from. Both are plain, equal choices.
export const SCHEMA_SOURCE_OPTIONS: { value: 'prompt' | 'import'; label: string; hint: string }[] = [
  { value: 'prompt', label: 'Propose a schema', hint: 'We draft the variables for this scenario. You review them next.' },
  { value: 'import', label: 'Upload your own schema', hint: 'A CSV of your column names and types. You review it next.' }
];

/** The plain-language line that explains a scenario: its description, or the first sentence of its business brief when it has none. */
export const scenarioExplanation = (scenario?: { description?: string | null; businessScenario?: string | null } | null): string => {
  const description = scenario?.description?.trim();
  if (description) return description;
  const brief = (scenario?.businessScenario ?? '').replace(/\s+/g, ' ').trim();
  const sentence = brief.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? brief;
  return sentence.length > 220 ? `${sentence.slice(0, 217)}...` : sentence;
};

export const DATA_TYPE_OPTIONS: { value: 'transactional' | 'aggregational'; label: string; hint: string }[] = [
  { value: 'transactional', label: 'Transactional', hint: 'A history of records for each user' },
  { value: 'aggregational', label: 'Aggregational', hint: 'One summary row per record' }
];

/** The most users (transactional) or rows (aggregational) one run can generate. */
export const MAX_VOLUME = MAX_USERS;

/** Users (transactional) or rows (aggregational) in the run, and how many history records each user gets. */
export function planGeneration(volume: number, typeOfData: string | undefined, recordsPerUser: number): { count: number; recordsPerUser: number } {
  if (typeOfData === 'aggregational') return { count: volume, recordsPerUser: 1 };
  return { count: volume, recordsPerUser };
}

export const pct = (score: number | undefined): string => (typeof score === 'number' ? `${(score * 100).toFixed(1)}%` : 'n/a');
