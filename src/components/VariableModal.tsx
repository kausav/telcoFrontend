import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { SchemaVariable } from '../api/types';

/**
 * Add or edit one variable of the schema being reviewed (step 2, before POST /scenario/confirm).
 *
 * What a reviewer may change follows the backend:
 *  - `full`    a variable the reviewer added: everything.
 *  - `limited` a proposed variable the application owns: description, nullable, its generation parameters (the keys it already
 *              has) and, optionally, its sequence.
 *  - `locked`  a variable owned by the database: only its sequence (change the definition in the database instead).
 *
 * Where a column sits in the delivered data is set by the system (customer before account, a start date before its end date, ...).
 * The reviewer is never asked for it: the field is optional and only there to override the automatic place.
 */
export type VariableAccess = 'full' | 'limited' | 'locked';

export type VariableSave =
  | { kind: 'definition'; definition: Record<string, unknown> }
  | { kind: 'changes'; changes: Record<string, unknown> };

interface Props {
  mode: 'add' | 'edit';
  access: VariableAccess;
  /** The definition being edited (edit) */
  variable?: SchemaVariable;
  /** Names of every column in the schema, to pick dependencies from and to refuse duplicates */
  columnNames: string[];
  transactional: boolean;
  onSave: (result: VariableSave) => void;
  onClose: () => void;
}

type ParamField = { key: string; label: string; kind: 'number' | 'text' | 'list'; hint?: string; required?: boolean };
interface Generator {
  value: string;
  label: string;
  dtype: string;
  params: ParamField[];
  help: string;
}

const DTYPES = ['string', 'integer', 'float', 'boolean', 'date', 'datetime'];

/** The generators a reviewer can set up with a few plain fields. The rest are offered under "Advanced" with a JSON box. */
const GENERATORS: Generator[] = [
  { value: 'weighted_choice', label: 'Pick from a list of values', dtype: 'string', help: 'Each row gets one of the values; weights make some more common.',
    params: [{ key: 'choices', label: 'Values', kind: 'list', hint: 'comma separated, e.g. web, app, branch', required: true },
             { key: 'weights', label: 'Weights', kind: 'list', hint: 'optional, one per value, e.g. 0.6, 0.3, 0.1' }] },
  { value: 'uniform_int', label: 'Whole number in a range', dtype: 'integer', help: 'Evenly spread between a minimum and a maximum.',
    params: [{ key: 'min', label: 'Minimum', kind: 'number', required: true }, { key: 'max', label: 'Maximum', kind: 'number', required: true }] },
  { value: 'uniform', label: 'Decimal number in a range', dtype: 'float', help: 'Evenly spread between a minimum and a maximum.',
    params: [{ key: 'min', label: 'Minimum', kind: 'number', required: true }, { key: 'max', label: 'Maximum', kind: 'number', required: true }] },
  { value: 'prefixed_int', label: 'Identifier: prefix + number', dtype: 'string', help: 'Like C000123: a fixed prefix and a number of a set length.',
    params: [{ key: 'prefix', label: 'Prefix', kind: 'text', required: true }, { key: 'digits', label: 'Digits', kind: 'number', required: true }] },
  { value: 'pattern_string', label: 'Text from a pattern', dtype: 'string', help: 'Letters and digits laid out as the pattern says.',
    params: [{ key: 'pattern', label: 'Pattern', kind: 'text', hint: 'e.g. AA-9999', required: true }] },
  { value: 'recent_datetime', label: 'Recent date and time', dtype: 'datetime', help: 'A timestamp within the last number of days.',
    params: [{ key: 'days_back', label: 'Days back', kind: 'number', required: true }] },
  { value: 'recent_date', label: 'Recent date', dtype: 'date', help: 'A date within the last number of days.',
    params: [{ key: 'days_back', label: 'Days back', kind: 'number', required: true }] },
  { value: 'constant', label: 'Same value on every row', dtype: 'string', help: 'One fixed value.',
    params: [{ key: 'value', label: 'Value', kind: 'text', required: true }] },
  { value: 'formula', label: 'Calculated from other columns', dtype: 'float', help: 'An expression over other columns, e.g. transaction_amount * 0.02.', params: [] },
  { value: 'semantic_string', label: 'Realistic text', dtype: 'string', help: 'Free text that fits the column name and description.', params: [] },
  { value: 'uuid_string', label: 'Unique id (UUID)', dtype: 'string', help: 'A random unique identifier.', params: [] },
];
const SIMPLE = new Set(GENERATORS.map(g => g.value));
const ADVANCED = ['beta', 'dependent_choice', 'e164_phone', 'generic', 'id_mirror', 'ipv4_string', 'ipv6_string', 'lognormal', 'lognormal_int',
  'prefixed_uuid', 'segment_range', 'semantic_event', 'ts_add_field', 'ts_offset', 'date_offset', 'date_offset_range', 'tx_id', 'uniform_bounded',
  'uri_string', 'weighted_bucket', 'email_string'];

const NAME = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
const NUMERIC = new Set(['integer', 'int', 'float', 'decimal', 'number', 'numeric']);
const BOOLEAN = new Set(['boolean', 'bool']);
const TEMPORAL = new Set(['date', 'datetime', 'timestamp']);

/** The few name conventions the backend enforces, so a mismatch is caught here and not at approval. */
function nameProblem(name: string, dtype: string): string | null {
  const n = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if ((n.endsWith('_flag') || /^(is|has|can|should)_/.test(n)) && !BOOLEAN.has(dtype)) return `"${name}" reads like a yes/no column, so its type must be boolean`;
  if (/(_count|_days|_hours|_minutes|_seconds|_duration|_amount|_price|_balance|_rate|_score|_percent|_percentage|_ratio|_quantity|_limit)$/.test(n) && !NUMERIC.has(dtype))
    return `"${name}" reads like a number, so its type must be integer or float`;
  if (/(_timestamp|_datetime|_at|_date)$/.test(n) && !TEMPORAL.has(dtype)) return `"${name}" reads like a date, so its type must be date or datetime`;
  return null;
}

const scalar = (text: string, dtype: string): string | number | boolean => {
  const t = text.trim();
  if (NUMERIC.has(dtype)) return Number(t);
  if (BOOLEAN.has(dtype)) return t.toLowerCase() === 'true';
  return t;
};

const asText = (value: unknown): string => (Array.isArray(value) ? value.map(String).join(', ') : value === undefined || value === null ? '' : String(value));

const FIELD = 'w-full p-1.5 bg-white border border-[#E5DFD3] rounded text-xs focus-techm disabled:bg-[#F6F2EA] disabled:text-[#8E8B82]';
const LABEL = 'block text-[10px] font-mono text-[#4D4D4F] uppercase mb-0.5';

export default function VariableModal({ mode, access, variable, columnNames, transactional, onSave, onClose }: Props) {
  const full = access === 'full';
  const locked = access === 'locked';
  const initial = variable ?? ({ name: '' } as SchemaVariable);
  const initialGen = String(initial.gen ?? (full ? 'weighted_choice' : ''));
  const generator = GENERATORS.find(g => g.value === initialGen);

  const [name, setName] = useState(String(initial.name ?? ''));
  const [dtype, setDtype] = useState(String(initial.dtype ?? generator?.dtype ?? 'string').toLowerCase());
  const [gen, setGen] = useState(initialGen);
  const [description, setDescription] = useState(String(initial.description ?? ''));
  const [nullable, setNullable] = useState(Boolean(initial.nullable));
  const [formula, setFormula] = useState(String(initial.formula ?? ''));
  const [scope, setScope] = useState(String(initial.scope ?? 'transaction'));
  const [sequence, setSequence] = useState(typeof initial.sequence === 'number' ? String(initial.sequence) : '');
  const [dependsOn, setDependsOn] = useState<string[]>(Array.isArray(initial.depends_on) ? initial.depends_on.map(String) : []);
  const initialParams = (initial.params ?? {}) as Record<string, unknown>;
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(initialParams).map(([k, v]) => [k, asText(v)])));
  const [json, setJson] = useState(() => JSON.stringify(initialParams, null, 2));
  const [error, setError] = useState('');
  const firstField = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const current = GENERATORS.find(g => g.value === gen);
  const guided = SIMPLE.has(gen);
  const others = useMemo(() => columnNames.filter(c => c.toLowerCase() !== name.trim().toLowerCase()), [columnNames, name]);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pickGenerator = (value: string) => {
    setGen(value);
    setValues({});
    setJson('{}');
    const g = GENERATORS.find(x => x.value === value);
    if (g) setDtype(g.dtype);
    if (value !== 'formula') setFormula('');
  };

  /** The generation parameters as the form states them (the backend accepts only keys the variable already has when editing). */
  const buildParams = (): Record<string, unknown> => {
    if (!guided) {
      let parsed: unknown;
      try { parsed = json.trim() ? JSON.parse(json) : {}; } catch { throw new Error('Parameters must be valid JSON, e.g. {"min": 1, "max": 9}'); }
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('Parameters must be a JSON object');
      return parsed as Record<string, unknown>;
    }
    const params: Record<string, unknown> = {};
    for (const field of current?.params ?? []) {
      const raw = (values[field.key] ?? '').trim();
      if (!raw) {
        if (field.required && full) throw new Error(`${field.label} is required`);
        continue;
      }
      if (field.kind === 'number') {
        if (!Number.isFinite(Number(raw))) throw new Error(`${field.label} must be a number`);
        params[field.key] = Number(raw);
      } else if (field.kind === 'list') {
        const items = raw.split(',').map(s => s.trim()).filter(Boolean);
        if (field.key === 'weights') {
          const nums = items.map(Number);
          if (nums.some(n => !Number.isFinite(n) || n < 0)) throw new Error('Weights must be numbers of zero or more');
          params.weights = nums;
        } else {
          const typed = items.map(item => scalar(item, dtype));
          if ((NUMERIC.has(dtype)) && typed.some(v => !Number.isFinite(v as number))) throw new Error('Values must be numbers for this type');
          params[field.key] = typed;
        }
      } else {
        params[field.key] = field.key === 'value' ? scalar(raw, dtype) : raw;
      }
    }
    if (full && gen === 'weighted_choice') {
      const choices = (params.choices as unknown[]) ?? [];
      if (choices.length < 1) throw new Error('Give at least one value');
      const weights = params.weights as number[] | undefined;
      if (weights && weights.length !== choices.length) throw new Error(`Give ${choices.length} weights, one per value (or none)`);
      if (!weights) params.weights = choices.map(() => Number((1 / choices.length).toFixed(6)));
    }
    if ((gen === 'uniform' || gen === 'uniform_int') && 'min' in params && 'max' in params && Number(params.min) > Number(params.max)) throw new Error('Minimum cannot be above the maximum');
    if ((gen === 'recent_datetime' || gen === 'recent_date') && 'days_back' in params) {
      if (!(Number(params.days_back) > 0)) throw new Error('Days back must be above zero');
    }
    return params;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const seq = sequence.trim() === '' ? null : Number(sequence);
      if (seq !== null && !(Number.isInteger(seq) && seq >= 0)) throw new Error('Sequence must be a whole number of zero or more (or leave it empty)');
      if (locked) {
        if (seq === (typeof initial.sequence === 'number' ? initial.sequence : null)) { onClose(); return; }
        onSave({ kind: 'changes', changes: seq === null ? {} : { sequence: seq } });
        return;
      }
      if (full) {
        const clean = name.trim();
        if (!NAME.test(clean)) throw new Error('Name must start with a letter or underscore and use only letters, digits and underscores');
        if (columnNames.some(c => c.toLowerCase() === clean.toLowerCase() && !(mode === 'edit' && c === String(initial.name)))) throw new Error(`"${clean}" already exists in the schema`);
        const problem = nameProblem(clean, dtype);
        if (problem) throw new Error(problem);
        if (gen === 'formula' && !formula.trim()) throw new Error('A calculated column needs a formula');
        const params = gen === 'formula' ? {} : buildParams();
        const depends = dependsOn.filter(d => columnNames.some(c => c === d));
        const definition: Record<string, unknown> = { name: clean, dtype, gen, params, description: description.trim(), nullable, depends_on: depends };
        if (gen === 'formula') definition.formula = formula.trim();
        if (transactional) definition.scope = scope;
        if (seq !== null) definition.sequence = seq;
        onSave({ kind: 'definition', definition });
        return;
      }
      // limited: only what changed
      const changes: Record<string, unknown> = {};
      if (description.trim() !== String(initial.description ?? '').trim()) changes.description = description.trim();
      if (nullable !== Boolean(initial.nullable)) changes.nullable = nullable;
      if (guided || gen) {
        const params = buildParams();
        const before = (initial.params ?? {}) as Record<string, unknown>;
        const merged = Object.fromEntries(Object.keys(before).map(k => [k, k in params ? params[k] : before[k]]));
        if (JSON.stringify(merged) !== JSON.stringify(before)) changes.params = merged;
      }
      if (seq !== null && seq !== initial.sequence) changes.sequence = seq;
      if (Object.keys(changes).length === 0) { onClose(); return; }
      onSave({ kind: 'changes', changes });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check the fields and try again');
    }
  };

  const title = mode === 'add' ? 'Add variable' : locked ? `Variable: ${initial.name}` : `Edit variable: ${initial.name}`;
  const paramFields = !guided || gen === 'formula' ? [] : (current?.params ?? []);
  // For a proposed variable only the parameters it already has can be changed.
  const editableKeys = full ? null : new Set(Object.keys(initialParams));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs" role="presentation">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="variable-modal-title"
        className="bg-white border border-[#E5DFD3] rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-[#E5DFD3] px-4 py-3">
          <h3 id="variable-modal-title" className="text-sm font-semibold text-[#29251D]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[#4D4D4F] hover:text-[#29251D]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3 overflow-y-auto text-xs">
          {locked && (
            <p className="p-2 rounded bg-[#F6F2EA] border border-[#E5DFD3] text-[#4D4D4F]">
              This variable is defined in the database, so its definition cannot be changed here. Change it there, or delete it.
              You can only move it in the data.
            </p>
          )}
          {access === 'limited' && (
            <p className="p-2 rounded bg-[#F6F2EA] border border-[#E5DFD3] text-[#4D4D4F]">
              Name, type and generator are fixed for a proposed variable. You can change its description, whether it may be empty and its values.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className={LABEL} htmlFor="var-name">Name</label>
              <input id="var-name" ref={el => { firstField.current = el; }} value={name} onChange={e => setName(e.target.value)} disabled={!full}
                     placeholder="e.g. channel" className={`${FIELD} font-mono`} autoComplete="off" spellCheck={false} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={LABEL} htmlFor="var-type">Data type</label>
              <select id="var-type" value={dtype} onChange={e => setDtype(e.target.value)} disabled={!full} className={FIELD}>
                {[...new Set([dtype, ...DTYPES])].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL} htmlFor="var-gen">How values are produced</label>
            <select id="var-gen" value={gen} onChange={e => pickGenerator(e.target.value)} disabled={!full} className={FIELD}>
              <optgroup label="Common">
                {GENERATORS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </optgroup>
              <optgroup label="Advanced (JSON parameters)">
                {[...new Set([...ADVANCED, ...(gen && !SIMPLE.has(gen) && !ADVANCED.includes(gen) ? [gen] : [])])].map(g => <option key={g} value={g}>{g}</option>)}
              </optgroup>
            </select>
            {current && <p className="mt-1 text-[11px] text-[#8E8B82]">{current.help}</p>}
          </div>

          {gen === 'formula' && (
            <div>
              <label className={LABEL} htmlFor="var-formula">Formula</label>
              <input id="var-formula" value={formula} onChange={e => setFormula(e.target.value)} disabled={!full}
                     placeholder="e.g. transaction_amount * 0.02" className={`${FIELD} font-mono`} spellCheck={false} />
              <p className="mt-1 text-[11px] text-[#8E8B82]">Use column names with + - * / and min, max, round. The columns it reads are picked up automatically.</p>
            </div>
          )}

          {guided && paramFields.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {paramFields.map(field => {
                const readOnly = editableKeys !== null && !editableKeys.has(field.key);
                return (
                  <div key={field.key} className={field.kind === 'list' || field.kind === 'text' ? 'col-span-2' : ''}>
                    <label className={LABEL} htmlFor={`var-p-${field.key}`}>{field.label}{field.required && full ? ' *' : ''}</label>
                    <input
                      id={`var-p-${field.key}`}
                      type={field.kind === 'number' ? 'number' : 'text'}
                      value={values[field.key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      disabled={locked || readOnly}
                      title={readOnly ? 'This variable has no such parameter, so it cannot be added here' : undefined}
                      placeholder={field.hint}
                      className={`${FIELD} ${field.kind === 'number' ? 'font-mono' : ''}`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {!guided && gen !== '' && (
            <div>
              <label className={LABEL} htmlFor="var-json">Parameters (JSON)</label>
              <textarea id="var-json" value={json} onChange={e => setJson(e.target.value)} rows={4} disabled={locked}
                        className={`${FIELD} font-mono`} spellCheck={false} />
            </div>
          )}

          {full && gen !== 'formula' && others.length > 0 && (
            <div>
              <label className={LABEL}>Depends on (optional)</label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-[#E5DFD3] rounded">
                {others.map(c => {
                  const on = dependsOn.includes(c);
                  return (
                    <button type="button" key={c} onClick={() => setDependsOn(prev => (on ? prev.filter(x => x !== c) : [...prev, c]))} aria-pressed={on}
                            className={`px-1.5 py-0.5 rounded border text-[11px] font-mono cursor-pointer ${on ? 'bg-[#29251D] text-white border-[#29251D]' : 'bg-white text-[#4D4D4F] border-[#E5DFD3] hover:border-[#29251D]'}`}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className={LABEL} htmlFor="var-desc">Description</label>
            <textarea id="var-desc" ref={el => { if (!full) firstField.current = el; }} value={description} onChange={e => setDescription(e.target.value)} rows={2} disabled={locked}
                      placeholder="What this column means, in a sentence" className={FIELD} />
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <label className="flex items-center gap-2 text-xs text-[#29251D] cursor-pointer">
              <input type="checkbox" checked={nullable} onChange={e => setNullable(e.target.checked)} disabled={locked} />
              <span>May be empty on some rows</span>
            </label>
            {full && transactional && (
              <div>
                <label className={LABEL} htmlFor="var-scope">Changes</label>
                <select id="var-scope" value={scope} onChange={e => setScope(e.target.value)} className={FIELD}>
                  <option value="transaction">on every row</option>
                  <option value="entity">once per customer / entity</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className={LABEL} htmlFor="var-seq">Sequence (optional)</label>
            <input id="var-seq" type="number" min={0} step={1} value={sequence} onChange={e => setSequence(e.target.value)}
                   placeholder="automatic" className={`${FIELD} w-32 font-mono`} />
            <p className="mt-1 text-[11px] text-[#8E8B82]">
              Leave empty and the model places the column in the story of the data (a customer before its account, a start before its end,
              then each event). A number overrides that: smaller comes first.
            </p>
          </div>

          {error && <p role="alert" className="p-2 rounded bg-red-50 border border-red-200 text-[#9C1936]">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#E5DFD3] px-4 py-3">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#E5DFD3] rounded bg-white text-[#4D4D4F] cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-3 py-1.5 text-xs bg-[#E31837] text-white rounded font-medium shadow-xs cursor-pointer">
            {mode === 'add' ? 'Add variable' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}