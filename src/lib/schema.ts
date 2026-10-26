import type { SchemaVariable } from '../api/types';

export interface DataField {
  id: string;
  name: string;
  /** Where the variable comes from (industry source, recommended library, derived) */
  standardRef: string;
  physicalType: string;
  constraints: string;
  sensitivity: 'PII / Masked' | 'Financial' | 'Operational' | 'Synthetic Target';
  qaStatus: 'PASS' | 'FLAGGED' | 'RESOLVED';
  qaMessage?: string;
  distribution?: string;
  /** Required variables, and the entity key, cannot be removed from the schema */
  required: boolean;
  /** Place in the delivered data (smaller comes first); editable before the schema is approved */
  sequence?: number;
}

const SOURCE_LABELS: Record<string, string> = {
  MONGODB_JSON: 'Industry source',
  DB_RECOMMENDED: 'Recommended variable',
  USER_SELECTED: 'User selected',
  USER_ADDED: 'Added by you',
};

const PII = /(^|_)(name|email|phone|msisdn|imsi|address|dob|birth|ssn|pan|aadhaar|passport|ip_address|device_id|national_id)(_|$)/i;
const FINANCIAL = /(amount|balance|price|fee|charge|income|salary|limit|credit|debit|cost|revenue|payment|currency)/i;

const list = (values: unknown[], max = 6): string => {
  const shown = values.slice(0, max).map(String).join(' | ');
  return values.length > max ? `${shown} | … (+${values.length - max})` : shown;
};

const num = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** The allowed values or range of a variable, from its generator and parameters. */
export function describeConstraints(variable: SchemaVariable): string {
  const params = (variable.params ?? {}) as Record<string, unknown>;
  switch (variable.gen) {
    case 'weighted_choice':
      return Array.isArray(params.choices) && params.choices.length ? `Enum: ${list(params.choices)}` : 'Enum';
    case 'uniform':
    case 'uniform_int':
      return num(params.min) && num(params.max) ? `Range: ${params.min} .. ${params.max}` : 'Numeric range';
    case 'recent_datetime':
      return num(params.days_back) ? `ISO 8601 timestamp, last ${params.days_back} days` : 'ISO 8601 timestamp';
    case 'prefixed_int':
      return `Prefix ${String(params.prefix ?? '')} + ${String(params.digits ?? '')} digits`;
    case 'prefixed_uuid':
      return `Prefix ${String(params.prefix ?? '')} + UUID`;
    case 'pattern_string':
      return `Pattern: ${String(params.pattern ?? '')}`;
    case 'constant':
      return `Constant: ${String(params.value ?? '')}`;
    case 'formula':
      return variable.formula ? `Formula: ${variable.formula}` : 'Derived (formula)';
    default:
      return variable.description?.toString() || (variable.gen ? String(variable.gen) : 'Unconstrained');
  }
}

/** How the values are generated, in a few words. */
export function describeDistribution(variable: SchemaVariable): string {
  const params = (variable.params ?? {}) as Record<string, unknown>;
  if (variable.gen === 'weighted_choice' && Array.isArray(params.weights) && params.weights.length) {
    const weights = params.weights.filter(num);
    const total = weights.reduce((sum, w) => sum + w, 0);
    if (total > 0) return `Categorical [${weights.map(w => `${Math.round((w / total) * 100)}%`).join(', ')}]`;
  }
  return variable.gen ? String(variable.gen).replace(/_/g, ' ') : 'Generated';
}

/**
 * The backend does not classify sensitivity, so this is a display hint from the variable's name only:
 * identifying fields show as PII, money fields as Financial, everything else as Operational.
 */
export function classifySensitivity(name: string): DataField['sensitivity'] {
  if (PII.test(name)) return 'PII / Masked';
  if (FINANCIAL.test(name)) return 'Financial';
  return 'Operational';
}

export function toDataField(variable: SchemaVariable, sources: Record<string, string>, entityKey: string | null): DataField {
  const name = String(variable.name);
  const source = sources[name.trim().toLowerCase()] ?? sources[name] ?? variable.source ?? '';
  return {
    id: `var-${name}`,
    name,
    standardRef: SOURCE_LABELS[String(source).toUpperCase()] ?? (source ? String(source) : 'Derived'),
    physicalType: String(variable.dtype ?? 'string').toUpperCase(),
    constraints: describeConstraints(variable),
    sensitivity: classifySensitivity(name),
    qaStatus: 'PASS',
    distribution: describeDistribution(variable),
    required: Boolean(variable.required) || (entityKey !== null && name === entityKey),
    sequence: typeof variable.sequence === 'number' && Number.isFinite(variable.sequence) ? variable.sequence : undefined,
  };
}

/** The fields in the order of their sequence (a field without one keeps its place after the numbered ones). */
export const bySequence = (fields: DataField[]): DataField[] =>
  fields
    .map((field, index) => ({ field, index }))
    .sort((a, b) => (a.field.sequence ?? Number.MAX_SAFE_INTEGER) - (b.field.sequence ?? Number.MAX_SAFE_INTEGER) || a.index - b.index)
    .map(({ field }) => field);

export const toDataFields = (variables: SchemaVariable[], sources: Record<string, string>, entityKey: string | null): DataField[] =>
  bySequence(variables.map(variable => toDataField(variable, sources, entityKey)));