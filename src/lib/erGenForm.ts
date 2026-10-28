// Turns a column generator into the text boxes of an edit form and back. The form keeps everything as text so a half-typed number
// is never rejected while it is being typed; the conversion back reports what is wrong when the user saves.
import { choiceText, parseChoice, type GenSpec } from './erModelEdit';

export type GenFields = Record<string, string>;

/** Fields of each generator, in the order the form shows them. */
export type FieldKind = 'text' | 'number' | 'date' | 'bool' | 'column';
export interface FieldDef { key: string; label: string; kind: FieldKind; placeholder?: string }

export const GEN_FIELD_DEFS: Record<string, FieldDef[]> = {
  id: [
    { key: 'prefix', label: 'Prefix', kind: 'text', placeholder: 'e.g. CUS' },
    { key: 'digits', label: 'Digits', kind: 'number', placeholder: '6' },
    { key: 'start', label: 'Start at', kind: 'number', placeholder: '1' },
  ],
  int: [{ key: 'min', label: 'Minimum', kind: 'number' }, { key: 'max', label: 'Maximum', kind: 'number' }],
  float: [{ key: 'min', label: 'Minimum', kind: 'number' }, { key: 'max', label: 'Maximum', kind: 'number' }, { key: 'round', label: 'Decimals', kind: 'number', placeholder: '2' }],
  date: [{ key: 'start', label: 'From', kind: 'date' }, { key: 'end', label: 'To', kind: 'date' }],
  date_after: [
    { key: 'column', label: 'After column', kind: 'column' },
    { key: 'min_days', label: 'At least days', kind: 'number', placeholder: '0' },
    { key: 'max_days', label: 'At most days', kind: 'number', placeholder: '365' },
  ],
  bool: [{ key: 'p', label: 'Chance of yes (0–1)', kind: 'number', placeholder: '0.5' }],
  const: [{ key: 'value', label: 'Value', kind: 'text', placeholder: 'text, number, true or false' }],
  digits: [
    { key: 'length', label: 'Length', kind: 'number' },
    { key: 'prefix', label: 'Starts with (digits)', kind: 'text' },
    { key: 'unique', label: 'Every value different', kind: 'bool' },
  ],
};

export const hasEmptyShare = (type: string): boolean => type !== 'id';

export function genToFields(gen: GenSpec): GenFields {
  const out: GenFields = {};
  for (const [key, value] of Object.entries(gen)) {
    if (key === 'type' || key === 'weights' || key === 'values') continue;
    out[key] = typeof value === 'boolean' ? String(value) : value === null || value === undefined ? '' : String(value);
  }
  if (gen.type === 'choice') {
    const { weighted, text } = choiceText(gen);
    out.mode = weighted ? 'weights' : 'values';
    out.list = text;
  }
  return out;
}

const number = (text: string | undefined, label: string): { value: number | undefined } | { error: string } => {
  const t = (text ?? '').trim();
  if (t === '') return { value: undefined };
  const n = Number(t);
  return Number.isFinite(n) ? { value: n } : { error: `${label} must be a number.` };
};

/** The generator the form describes, or what is wrong with it. Rules (ranges and so on) are checked by the model edit. */
export function fieldsToGen(type: string, fields: GenFields): { gen: GenSpec } | { error: string } {
  const gen: GenSpec = { type };
  const defs = GEN_FIELD_DEFS[type] ?? [];
  if (type === 'choice') {
    const parsed = parseChoice(fields.mode === 'weights', fields.list ?? '');
    if ('error' in parsed) return parsed;
    Object.assign(gen, parsed);
  } else if (type === 'const') {
    const raw = fields.value ?? '';
    const n = Number(raw);
    gen.value = raw.trim() !== '' && Number.isFinite(n) ? n : raw === 'true' ? true : raw === 'false' ? false : raw;
  } else {
    for (const def of defs) {
      const text = fields[def.key] ?? '';
      if (def.kind === 'number') {
        const n = number(text, def.label);
        if ('error' in n) return n;
        if (n.value !== undefined) gen[def.key] = n.value;
      } else if (def.kind === 'bool') {
        if (text === 'true') gen[def.key] = true;
      } else if (text.trim() !== '' || def.kind === 'column' || def.kind === 'date') {
        gen[def.key] = text.trim();
      } else if (def.key === 'prefix' && type === 'id') {
        gen.prefix = '';
      }
    }
  }
  if (hasEmptyShare(type) && (fields.null_share ?? '').trim() !== '') {
    const n = number(fields.null_share, 'Empty cells');
    if ('error' in n) return n;
    gen.null_share = n.value;
  }
  return { gen };
}
