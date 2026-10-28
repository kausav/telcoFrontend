// Editing an ER model without touching its JSON by hand: add, rename and delete tables, columns and relationships.
//
// Every function is pure. It takes the parsed model and returns either a new model (plus plain-language notes about anything it
// changed on its own) or an error. The rules mirror the backend's (er/model.py) so most mistakes are caught here, before a request;
// the backend still checks the final model and has the last word.
import type { ErModelJson } from '../api/erTypes';

export const MAX_ENTITIES = 30;
export const MAX_COLUMNS = 80;
export const MAX_ROOT_COUNT = 5000;
export const MAX_CARD = 500;
const DEFAULT_ROOT_COUNT = 50;
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

// ---- the model's shape --------------------------------------------------------------------------------------------------
export type RelType = 'one_to_many' | 'many_to_one' | 'many_to_many' | 'group';
export const REL_TYPES: RelType[] = ['one_to_many', 'many_to_one', 'many_to_many', 'group'];

export interface GenSpec { type: string; [key: string]: unknown }
export interface ColumnSpec { name: string; gen: GenSpec; description?: string; [key: string]: unknown }
export interface EntitySpec { name: string; key?: string; count?: number; columns: ColumnSpec[]; description?: string; [key: string]: unknown }
export interface RelSpec { name?: string; type: RelType; [key: string]: unknown }
export interface ConstraintSpec { type: string; relationship: string; [key: string]: unknown }
export interface ModelSpec { entities: EntitySpec[]; relationships: RelSpec[]; constraints: ConstraintSpec[]; [key: string]: unknown }

export interface EditOk { model: ErModelJson; notes: string[] }
export interface EditFail { error: string }
export type EditResult = EditOk | EditFail;
export const isFail = (result: EditResult): result is EditFail => 'error' in result;

export const isIdent = (value: unknown): value is string => typeof value === 'string' && IDENT.test(value);
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isInt = (value: unknown): value is number => isNum(value) && Number.isInteger(value);
const str = (value: unknown): string => (typeof value === 'string' ? value : '');

function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** The model in a form that is safe to edit (a private copy; unnamed relationships get their names), or why it cannot be edited. */
export function readModel(model: ErModelJson): { spec: ModelSpec } | { error: string } {
  if (!isObject(model)) return { error: 'The model must be a JSON object.' };
  const spec = clone(model) as Record<string, unknown>;
  if (!Array.isArray(spec.entities)) return { error: 'The model has no "entities" list yet.' };
  for (const entity of spec.entities) {
    if (!isObject(entity) || typeof entity.name !== 'string') return { error: 'Every table needs a name before the diagram can be edited.' };
    if (entity.columns === undefined) entity.columns = [];
    if (!Array.isArray(entity.columns) || entity.columns.some(c => !isObject(c) || typeof c.name !== 'string')) {
      return { error: `The columns of "${entity.name}" need names before the diagram can be edited.` };
    }
  }
  if (spec.relationships === undefined) spec.relationships = [];
  if (spec.constraints === undefined) spec.constraints = [];
  if (!Array.isArray(spec.relationships) || spec.relationships.some(r => !isObject(r))) return { error: 'The relationships must be a list of objects.' };
  if (!Array.isArray(spec.constraints) || spec.constraints.some(c => !isObject(c))) return { error: 'The constraints must be a list of objects.' };
  const typed = spec as ModelSpec;
  typed.relationships.forEach((rel, index) => {
    if (!rel.name) rel.name = `rel_${index + 1}`; // the backend names them this way, and the name must stay put when others are removed
  });
  return { spec: typed };
}

// ---- small lookups ------------------------------------------------------------------------------------------------------
export const keyOf = (entity: EntitySpec): string => (typeof entity.key === 'string' ? entity.key : `${entity.name}_id`);
const entityOf = (spec: ModelSpec, name: string): EntitySpec | undefined => spec.entities.find(e => e.name === name);
const relOf = (spec: ModelSpec, name: string): RelSpec | undefined => spec.relationships.find(r => r.name === name);

/** The tables a relationship reads or writes. */
export function relEntities(rel: RelSpec): string[] {
  if (rel.type === 'many_to_many') return [str(rel.left), str(rel.right), str(rel.through)];
  if (rel.type === 'group') return [str(rel.entity)];
  return [str(rel.parent), str(rel.child)];
}

/** The table that holds the foreign key(s) of a relationship, with the column names. */
function fkColumns(spec: ModelSpec, rel: RelSpec): { table: string; column: string }[] {
  if (rel.type === 'many_to_many') {
    const left = entityOf(spec, str(rel.left));
    const right = entityOf(spec, str(rel.right));
    return [
      { table: str(rel.through), column: str(rel.left_fk) || (left ? keyOf(left) : '') },
      { table: str(rel.through), column: str(rel.right_fk) || (right ? keyOf(right) : '') },
    ];
  }
  if (rel.type === 'group') {
    const entity = entityOf(spec, str(rel.entity));
    return [{ table: str(rel.entity), column: str(rel.fk) || (entity ? `parent_${keyOf(entity)}` : '') }];
  }
  const parent = entityOf(spec, str(rel.parent));
  return [{ table: str(rel.child), column: str(rel.fk) || (parent ? keyOf(parent) : '') }];
}

/** The foreign key column names a relationship creates (two for a many-to-many), defaults included. */
export const relationshipFks = (spec: ModelSpec, rel: RelSpec): string[] => fkColumns(spec, rel).map(fk => fk.column);

/** Foreign key columns of one table (they are filled from the relationship, so a declared column may not reuse the name). */
function fkNames(spec: ModelSpec, table: string): string[] {
  return spec.relationships.flatMap(rel => fkColumns(spec, rel)).filter(fk => fk.table === table).map(fk => fk.column);
}

/** Writes every default (relationship names, foreign key names) into the model, so renaming a key later cannot silently move them. */
function materialize(spec: ModelSpec): void {
  for (const rel of spec.relationships) {
    const [first, second] = fkColumns(spec, rel);
    if (rel.type === 'many_to_many') {
      rel.left_fk = first.column;
      rel.right_fk = second.column;
    } else if (first.column) {
      rel.fk = first.column;
    }
  }
}

// ---- generators ---------------------------------------------------------------------------------------------------------
export const GEN_TYPES: { type: string; label: string; hint: string }[] = [
  { type: 'id', label: 'Identifier', hint: 'PREFIX000001, PREFIX000002, …' },
  { type: 'choice', label: 'Choice', hint: 'one of a list, optionally weighted' },
  { type: 'int', label: 'Whole number', hint: 'between a minimum and a maximum' },
  { type: 'float', label: 'Decimal number', hint: 'between a minimum and a maximum' },
  { type: 'date', label: 'Date', hint: 'between two dates' },
  { type: 'date_after', label: 'Date after another column', hint: 'a number of days after a date column above it' },
  { type: 'bool', label: 'Yes / no', hint: 'true with a chosen probability' },
  { type: 'const', label: 'Fixed value', hint: 'the same value in every row' },
  { type: 'digits', label: 'Digits', hint: 'a number string such as a phone number' },
];

/** A valid generator of a type, for a new column. `earlierDate` is a date column above it (used by "date after"). */
export function defaultGen(type: string, earlierDate = ''): GenSpec {
  switch (type) {
    case 'id': return { type, prefix: '', digits: 6, start: 1 };
    case 'choice': return { type, values: ['a', 'b', 'c'] };
    case 'int': return { type, min: 0, max: 100 };
    case 'float': return { type, min: 0, max: 100, round: 2 };
    case 'date': return { type, start: '2020-01-01', end: '2024-12-31' };
    case 'date_after': return { type, column: earlierDate, min_days: 0, max_days: 30 };
    case 'bool': return { type, p: 0.5 };
    case 'const': return { type, value: 0 };
    default: return { type: 'digits', length: 10 };
  }
}

const GEN_KEYS: Record<string, string[]> = {
  id: ['prefix', 'digits', 'start'],
  choice: ['weights', 'values'],
  int: ['min', 'max'],
  float: ['min', 'max', 'round'],
  date: ['start', 'end'],
  bool: ['p'],
  const: ['value'],
  date_after: ['column', 'min_days', 'max_days'],
  digits: ['length', 'prefix', 'unique'],
};

/** Why a generator is not acceptable, or null. `earlier` maps the columns above it to their generator type. */
export function checkGen(gen: unknown, earlier: Map<string, string>): string | null {
  if (!isObject(gen) || typeof gen.type !== 'string') return 'needs a generator type';
  const allowed = GEN_KEYS[gen.type];
  if (!allowed) return `unknown generator "${gen.type}"`;
  const unknown = Object.keys(gen).filter(k => k !== 'type' && k !== 'null_share' && !allowed.includes(k));
  if (unknown.length) return `${gen.type} does not take ${unknown.join(', ')}`;
  if ('null_share' in gen && !(isNum(gen.null_share) && gen.null_share >= 0 && gen.null_share <= 1)) return 'share of empty cells must be from 0 to 1';
  switch (gen.type) {
    case 'id':
      if (gen.prefix !== undefined && typeof gen.prefix !== 'string') return 'prefix must be text';
      if (gen.digits !== undefined && !(isInt(gen.digits) && gen.digits >= 1 && gen.digits <= 12)) return 'digits must be a whole number from 1 to 12';
      if (gen.start !== undefined && !(isInt(gen.start) && gen.start >= 0)) return 'start must be a whole number, 0 or more';
      return null;
    case 'choice': {
      const hasW = gen.weights !== undefined;
      const hasV = gen.values !== undefined;
      if (hasW === hasV) return 'a choice needs either values or weights';
      if (hasW) {
        if (!isObject(gen.weights) || Object.keys(gen.weights).length === 0 || !Object.values(gen.weights).every(v => isNum(v) && v > 0)) {
          return 'weights must be labels with a positive number each';
        }
      } else if (!Array.isArray(gen.values) || gen.values.length === 0) {
        return 'a choice needs at least one value';
      }
      return null;
    }
    case 'int':
    case 'float': {
      const whole = gen.type === 'int';
      const ok = whole ? isInt(gen.min) && isInt(gen.max) : isNum(gen.min) && isNum(gen.max);
      if (!ok) return `minimum and maximum must be ${whole ? 'whole numbers' : 'numbers'}`;
      if ((gen.max as number) < (gen.min as number)) return 'maximum is below minimum';
      if (!whole && gen.round !== undefined && !(isInt(gen.round) && gen.round >= 0 && gen.round <= 8)) return 'decimals must be a whole number from 0 to 8';
      return null;
    }
    case 'date':
      if (!isIsoDate(gen.start)) return 'start must be a date like 2024-01-31';
      if (!isIsoDate(gen.end)) return 'end must be a date like 2024-01-31';
      return (gen.end as string) < (gen.start as string) ? 'end is before start' : null;
    case 'bool':
      return gen.p === undefined || (isNum(gen.p) && gen.p >= 0 && gen.p <= 1) ? null : 'probability must be from 0 to 1';
    case 'const':
      return gen.value === undefined || isObject(gen.value) || Array.isArray(gen.value) ? 'a fixed value must be a single value' : null;
    case 'date_after': {
      const base = str(gen.column);
      if (!earlier.has(base)) return 'pick a date column that is above this one in the table';
      if (earlier.get(base) !== 'date' && earlier.get(base) !== 'date_after') return `"${base}" is not a date column`;
      const lo = gen.min_days === undefined ? 0 : gen.min_days;
      const hi = gen.max_days === undefined ? 365 : gen.max_days;
      if (!(isInt(lo) && lo >= 0)) return 'minimum days must be a whole number, 0 or more';
      if (!(isInt(hi) && hi >= (lo as number))) return 'maximum days must be a whole number, not below the minimum';
      return null;
    }
    default: {
      const n = gen.length;
      if (!(isInt(n) && n >= 1 && n <= 18)) return 'length must be a whole number from 1 to 18';
      const prefix = gen.prefix === undefined ? '' : gen.prefix;
      if (typeof prefix !== 'string' || !/^\d*$/.test(prefix)) return 'prefix must be digits only';
      if (prefix.length >= n) return 'prefix must be shorter than the length';
      if (gen.unique !== undefined && typeof gen.unique !== 'boolean') return 'unique must be yes or no';
      return null;
    }
  }
}

/** A choice generator as editable text: `a, b, c` for values, `a:3, b:1` for weights. */
export function choiceText(gen: GenSpec): { weighted: boolean; text: string } {
  if (isObject(gen.weights)) return { weighted: true, text: Object.entries(gen.weights).map(([label, weight]) => `${label}:${String(weight)}`).join(', ') };
  return { weighted: false, text: Array.isArray(gen.values) ? gen.values.map(String).join(', ') : '' };
}

/** The reverse of `choiceText`. Values that look like numbers stay text, which is what the backend expects of a choice. */
export function parseChoice(weighted: boolean, text: string): { values: string[] } | { weights: Record<string, number> } | { error: string } {
  const parts = text.split(',').map(p => p.trim()).filter(p => p !== '');
  if (parts.length === 0) return { error: weighted ? 'write at least one label:weight' : 'write at least one value' };
  if (!weighted) return { values: parts };
  const weights: Record<string, number> = {};
  for (const part of parts) {
    const at = part.lastIndexOf(':');
    const label = at < 0 ? '' : part.slice(0, at).trim();
    const weight = at < 0 ? NaN : Number(part.slice(at + 1));
    if (!label || !(weight > 0)) return { error: `"${part}" is not label:weight with a positive weight` };
    weights[label] = weight;
  }
  return { weights };
}

// ---- checking the whole structure ---------------------------------------------------------------------------------------
function checkCard(card: unknown, label: string, floor: number): string | null {
  if (!isObject(card)) return `${label}: needs a minimum and a maximum`;
  if (!isInt(card.min) || !isInt(card.max)) return `${label}: the minimum and maximum must be whole numbers`;
  if (card.min < floor) return `${label}: the minimum must be at least ${floor}`;
  if (card.max < card.min) return `${label}: the maximum is below the minimum`;
  if (card.max > MAX_CARD) return `${label}: the maximum must not exceed ${MAX_CARD}`;
  if (card.weights !== undefined) {
    if (!isObject(card.weights)) return `${label}: weights must be counts with a positive number each`;
    for (const [count, weight] of Object.entries(card.weights)) {
      const n = Number(count);
      if (!Number.isInteger(n) || n < card.min || n > card.max) return `${label}: the weight for ${count} is outside ${card.min}..${card.max}`;
      if (!(isNum(weight) && weight > 0)) return `${label}: weights must be positive numbers`;
    }
  }
  return null;
}

/** Problems with one constraint (a rule of the model), or null. */
function constraintProblem(spec: ModelSpec, constraint: ConstraintSpec): string | null {
  const rel = relOf(spec, constraint.relationship);
  if (!rel) return `relationship "${constraint.relationship}" is gone`;
  if (rel.type === 'many_to_many') return 'rules on a many-to-many link are not supported';
  const childName = rel.type === 'group' ? str(rel.entity) : str(rel.child);
  const parentName = rel.type === 'group' ? str(rel.entity) : str(rel.parent);
  const child = entityOf(spec, childName);
  const parent = entityOf(spec, parentName);
  if (!child || !parent) return 'a table it uses is gone';
  const find = (entity: EntitySpec, column: unknown): ColumnSpec | undefined => entity.columns.find(c => c.name === column);
  const need = (entity: EntitySpec, key: string, dates: boolean): string | null => {
    const column = find(entity, constraint[key]);
    if (!column) return `column "${String(constraint[key])}" of ${entity.name} is gone`;
    if (dates && column.gen.type !== 'date' && column.gen.type !== 'date_after') return `column "${column.name}" is no longer a date`;
    return null;
  };
  switch (constraint.type) {
    case 'date_not_before_parent': return need(child, 'column', true) ?? need(parent, 'parent_column', true);
    case 'same_as_parent':
    case 'status_follows_parent': return need(child, 'column', false) ?? need(parent, 'parent_column', false);
    case 'aggregate': return need(parent, 'parent_column', false) ?? (constraint.child_column == null ? null : need(child, 'child_column', false));
    default: return null;
  }
}

/** Every problem the structure has, in plain words. Mirrors the backend; not exhaustive (the backend still validates). */
export function checkStructure(spec: ModelSpec): string[] {
  const problems: string[] = [];
  if (spec.entities.length > MAX_ENTITIES) problems.push(`A model can have at most ${MAX_ENTITIES} tables.`);
  const names = new Set<string>();
  for (const entity of spec.entities) {
    if (!isIdent(entity.name)) problems.push(`"${entity.name}" is not a valid table name (letters, digits and underscores, not starting with a digit).`);
    if (names.has(entity.name)) problems.push(`The table "${entity.name}" appears twice.`);
    names.add(entity.name);
    if (!isIdent(keyOf(entity))) problems.push(`${entity.name}: "${String(entity.key)}" is not a valid key column name.`);
    if (entity.count !== undefined && !(isInt(entity.count) && entity.count >= 1 && entity.count <= MAX_ROOT_COUNT)) problems.push(`${entity.name}: the row count must be a whole number from 1 to ${MAX_ROOT_COUNT}.`);
    if (entity.columns.length > MAX_COLUMNS) problems.push(`${entity.name}: at most ${MAX_COLUMNS} columns.`);
    const fks = fkNames(spec, entity.name);
    const seen = new Set<string>();
    const earlier = new Map<string, string>();
    for (const column of entity.columns) {
      if (!isIdent(column.name)) problems.push(`${entity.name}: "${column.name}" is not a valid column name.`);
      if (seen.has(column.name)) problems.push(`${entity.name}: the column "${column.name}" appears twice.`);
      seen.add(column.name);
      if (column.name === keyOf(entity)) {
        if (column.gen?.type !== 'id') problems.push(`${entity.name}: the key "${column.name}" must be an identifier so every row is unique.`);
      } else if (fks.includes(column.name)) {
        problems.push(`${entity.name}: "${column.name}" is already a foreign key column, so it cannot also be a data column.`);
      } else {
        const bad = checkGen(column.gen, earlier);
        if (bad) problems.push(`${entity.name}.${column.name}: ${bad}.`);
      }
      earlier.set(column.name, column.gen?.type ?? '');
    }
    if (fks.includes(keyOf(entity))) problems.push(`${entity.name}: the key "${keyOf(entity)}" is also a foreign key.`);
  }

  const drivers = new Map<string, string[]>();
  const fkSeen = new Set<string>();
  const relNames = new Set<string>();
  const edges: [string, string][] = [];
  for (const rel of spec.relationships) {
    const label = `Relationship ${rel.name}`;
    if (!isIdent(rel.name)) problems.push(`${label}: the name must be letters, digits and underscores.`);
    if (relNames.has(str(rel.name))) problems.push(`${label} appears twice.`);
    relNames.add(str(rel.name));
    if (!REL_TYPES.includes(rel.type)) {
      problems.push(`${label}: unknown type "${String(rel.type)}".`);
      continue;
    }
    const missing = relEntities(rel).filter(n => !entityOf(spec, n));
    if (missing.length) {
      problems.push(`${label}: the table ${missing.map(m => `"${m}"`).join(', ')} does not exist.`);
      continue;
    }
    if ((rel.type === 'one_to_many' || rel.type === 'many_to_one') && rel.parent === rel.child) {
      problems.push(`${label}: a table cannot be its own parent here; use a group for rows of one table that belong together.`);
      continue;
    }
    if (rel.type === 'many_to_many') {
      if (new Set([rel.left, rel.right, rel.through]).size < 3) {
        problems.push(`${label}: the two sides and the link table must be three different tables.`);
        continue;
      }
      const [a, b] = fkColumns(spec, rel);
      if (a.column === b.column) {
        problems.push(`${label}: the two foreign key columns must have different names.`);
        continue;
      }
    }
    for (const fk of fkColumns(spec, rel)) {
      if (!isIdent(fk.column)) {
        problems.push(`${label}: "${fk.column}" is not a valid foreign key column name.`);
        continue;
      }
      const child = entityOf(spec, fk.table);
      if (child && fk.column === keyOf(child)) problems.push(`${label}: the foreign key "${fk.column}" is the same as the key of ${fk.table}.`);
      if (fkSeen.has(`${fk.table}.${fk.column}`)) problems.push(`${label}: ${fk.table} already has a foreign key "${fk.column}".`);
      fkSeen.add(`${fk.table}.${fk.column}`);
    }
    if (rel.type === 'many_to_many') {
      const bad = checkCard(rel.per_right, `${label} (per ${str(rel.right)})`, 1);
      if (bad) problems.push(`${bad}.`);
      if (rel.cover_left !== undefined && typeof rel.cover_left !== 'boolean') problems.push(`${label}: "every left row is linked" must be yes or no.`);
      drivers.set(str(rel.through), [...(drivers.get(str(rel.through)) ?? []), str(rel.name)]);
      edges.push([str(rel.left), str(rel.through)], [str(rel.right), str(rel.through)]);
    } else if (rel.type === 'one_to_many') {
      const bad = checkCard(rel.children, `${label} (children per ${str(rel.parent)})`, 0);
      if (bad) problems.push(`${bad}.`);
      drivers.set(str(rel.child), [...(drivers.get(str(rel.child)) ?? []), str(rel.name)]);
      edges.push([str(rel.parent), str(rel.child)]);
    } else if (rel.type === 'many_to_one') {
      if (!(isNum(rel.null_share ?? 0) && Number(rel.null_share ?? 0) >= 0 && Number(rel.null_share ?? 0) <= 1)) problems.push(`${label}: the share without a parent must be from 0 to 1.`);
      if (!(isNum(rel.skew ?? 0) && Number(rel.skew ?? 0) >= 0 && Number(rel.skew ?? 0) <= 2)) problems.push(`${label}: skew must be from 0 to 2.`);
      edges.push([str(rel.parent), str(rel.child)]);
    } else {
      if (!(isNum(rel.share ?? 0.2) && Number(rel.share ?? 0.2) > 0 && Number(rel.share ?? 0.2) <= 0.9)) problems.push(`${label}: the share of rows that start a group must be above 0 and at most 0.9.`);
      const bad = checkCard(rel.members, `${label} (members per group)`, 1);
      if (bad) problems.push(`${bad}.`);
      if (spec.relationships.some(other => other !== rel && other.type === 'group' && other.entity === rel.entity)) problems.push(`${label}: ${str(rel.entity)} already has a group.`);
    }
  }
  for (const entity of spec.entities) {
    const rels = drivers.get(entity.name) ?? [];
    if (rels.length > 1) problems.push(`${entity.name} would get its rows from more than one relationship (${rels.join(', ')}); only one may create its rows.`);
    else if (rels.length === 0 && entity.count === undefined) problems.push(`${entity.name} needs a row count because no parent creates its rows.`);
  }
  const loop = findLoop(spec.entities.map(e => e.name), edges);
  if (loop.length) problems.push(`The relationships form a loop between ${loop.join(', ')}. A parent must exist before its child: remove one link or make it a many-to-one lookup.`);
  return problems;
}

/** The tables left over when parents are placed before children, i.e. the ones caught in a loop. */
function findLoop(names: string[], edges: [string, string][]): string[] {
  const remaining = [...names];
  for (;;) {
    const ready = remaining.findIndex(n => !edges.some(([a, b]) => b === n && remaining.includes(a)));
    if (ready < 0) return remaining;
    remaining.splice(ready, 1);
    if (remaining.length === 0) return [];
  }
}

// ---- finishing an edit -------------------------------------------------------------------------------------------------
function drivenTables(spec: ModelSpec): Set<string> {
  const out = new Set<string>();
  for (const rel of spec.relationships) {
    if (rel.type === 'one_to_many') out.add(str(rel.child));
    if (rel.type === 'many_to_many') out.add(str(rel.through));
  }
  return out;
}

/** A table that gained a parent drops its own row count; one that lost its parent gets one. */
function reconcileCounts(before: Set<string>, spec: ModelSpec, notes: string[]): void {
  const after = drivenTables(spec);
  for (const entity of spec.entities) {
    if (after.has(entity.name) && !before.has(entity.name) && entity.count !== undefined) {
      delete entity.count;
      notes.push(`${entity.name} now gets its rows from its parent, so its own row count was removed.`);
    } else if (!after.has(entity.name) && before.has(entity.name) && entity.count === undefined) {
      entity.count = DEFAULT_ROOT_COUNT;
      notes.push(`${entity.name} no longer gets its rows from a parent, so it was given ${DEFAULT_ROOT_COUNT} rows of its own.`);
    }
  }
}

/** Drops the rules that were fine before this edit and cannot work after it. */
function pruneConstraints(previous: ModelSpec, spec: ModelSpec, notes: string[]): void {
  spec.constraints = spec.constraints.filter(constraint => {
    const was = constraintProblem(previous, constraint);
    const now = constraintProblem(spec, constraint);
    if (was === null && now !== null) {
      notes.push(`A ${constraint.type.replace(/_/g, ' ')} rule on ${constraint.relationship} was removed: ${now}.`);
      return false;
    }
    return true;
  });
}

/** Builds the result of an edit, refusing it if it creates a problem the model did not already have. */
function finish(previous: ModelSpec, next: ModelSpec, notes: string[]): EditResult {
  const had = new Set(checkStructure(previous));
  // the relationship's own message is the useful one when it also breaks a table rule
  const fresh = checkStructure(next).filter(problem => !had.has(problem)).sort((a, b) => Number(b.startsWith('Relationship')) - Number(a.startsWith('Relationship')));
  if (fresh.length) return { error: fresh[0] };
  return { model: next as ErModelJson, notes };
}

function begin(model: ErModelJson): { previous: ModelSpec; next: ModelSpec } | EditFail {
  const read = readModel(model);
  if ('error' in read) return read;
  const next = clone(read.spec);
  materialize(next);
  return { previous: read.spec, next };
}

// ---- tables -------------------------------------------------------------------------------------------------------------
const keyColumn = (name: string, key: string): ColumnSpec => ({ name: key, gen: { type: 'id', prefix: name.replace(/_/g, '').slice(0, 3).toUpperCase(), digits: 6, start: 1 } });

export function addEntity(model: ErModelJson, name: string): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  const clean = name.trim();
  if (!isIdent(clean)) return { error: 'A table name uses letters, digits and underscores, and does not start with a digit.' };
  if (entityOf(next, clean)) return { error: `There is already a table called "${clean}".` };
  if (next.entities.length >= MAX_ENTITIES) return { error: `A model can have at most ${MAX_ENTITIES} tables.` };
  next.entities.push({ name: clean, key: `${clean}_id`, count: DEFAULT_ROOT_COUNT, columns: [keyColumn(clean, `${clean}_id`)] });
  return finish(previous, next, [`${clean} was added with ${DEFAULT_ROOT_COUNT} rows and a key column.`]);
}

export function renameEntity(model: ErModelJson, from: string, to: string): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  const clean = to.trim();
  const entity = entityOf(next, from);
  if (!entity) return { error: `There is no table "${from}".` };
  if (clean === from) return { model: next as ErModelJson, notes: [] };
  if (!isIdent(clean)) return { error: 'A table name uses letters, digits and underscores, and does not start with a digit.' };
  if (entityOf(next, clean)) return { error: `There is already a table called "${clean}".` };
  entity.key = keyOf(entity); // the key keeps its name; only the table is renamed
  entity.name = clean;
  for (const rel of next.relationships) {
    for (const field of ['parent', 'child', 'entity', 'left', 'right', 'through']) if (rel[field] === from) rel[field] = clean;
  }
  return finish(previous, next, []);
}

export function updateEntity(model: ErModelJson, name: string, patch: { key?: string; count?: number | null }): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  const entity = entityOf(next, name);
  if (!entity) return { error: `There is no table "${name}".` };
  const notes: string[] = [];
  if (patch.key !== undefined && patch.key !== keyOf(entity)) {
    const key = patch.key.trim();
    if (!isIdent(key)) return { error: 'A key column name uses letters, digits and underscores, and does not start with a digit.' };
    if (entity.columns.some(c => c.name === key)) return { error: `${name} already has a column "${key}".` };
    const old = keyOf(entity);
    const column = entity.columns.find(c => c.name === old);
    if (column) column.name = key;
    else entity.columns.unshift(keyColumn(name, key));
    entity.key = key;
    // relationships that pointed at the old key by default were written out by `materialize`, so they keep their column names
    notes.push(`The key of ${name} is now "${key}". Foreign keys in other tables keep their names.`);
  }
  if (patch.count !== undefined) {
    if (patch.count === null) {
      if (!drivenTables(next).has(name)) return { error: `${name} needs a row count because no parent creates its rows.` };
      delete entity.count;
    } else {
      entity.count = patch.count;
    }
  }
  return finish(previous, next, notes);
}

export function removeEntity(model: ErModelJson, name: string): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  if (!entityOf(next, name)) return { error: `There is no table "${name}".` };
  const notes: string[] = [`Table ${name} is deleted.`];
  const driven = drivenTables(next);
  const gone = next.relationships.filter(rel => relEntities(rel).includes(name));
  next.entities = next.entities.filter(e => e.name !== name);
  next.relationships = next.relationships.filter(rel => !gone.includes(rel));
  for (const rel of gone) notes.push(`The relationship ${rel.name} (${describeEnds(rel)}) is deleted with it.`);
  const rules = next.constraints.filter(c => gone.some(rel => rel.name === c.relationship));
  next.constraints = next.constraints.filter(c => !rules.includes(c));
  if (rules.length) notes.push(`${rules.length} rule${rules.length === 1 ? '' : 's'} on those relationships ${rules.length === 1 ? 'is' : 'are'} deleted too.`);
  reconcileCounts(driven, next, notes);
  pruneConstraints(previous, next, notes);
  return finish(previous, next, notes);
}

function describeEnds(rel: RelSpec): string {
  if (rel.type === 'many_to_many') return `${str(rel.left)} ↔ ${str(rel.right)} via ${str(rel.through)}`;
  if (rel.type === 'group') return `${str(rel.entity)} groups`;
  return `${str(rel.parent)} → ${str(rel.child)}`;
}

// ---- columns ------------------------------------------------------------------------------------------------------------
export function addColumn(model: ErModelJson, table: string, column: { name: string; gen?: GenSpec }): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  const entity = entityOf(next, table);
  if (!entity) return { error: `There is no table "${table}".` };
  const name = column.name.trim();
  if (!isIdent(name)) return { error: 'A column name uses letters, digits and underscores, and does not start with a digit.' };
  if (entity.columns.some(c => c.name === name)) return { error: `${table} already has a column "${name}".` };
  if (fkNames(next, table).includes(name)) return { error: `"${name}" is a foreign key column of ${table}, filled from its relationship.` };
  if (entity.columns.length >= MAX_COLUMNS) return { error: `A table can have at most ${MAX_COLUMNS} columns.` };
  const lastDate = [...entity.columns].reverse().find(c => c.gen?.type === 'date' || c.gen?.type === 'date_after');
  entity.columns.push({ name, gen: column.gen ?? defaultGen('choice', lastDate?.name) });
  return finish(previous, next, []);
}

export function updateColumn(model: ErModelJson, table: string, name: string, patch: { name?: string; gen?: GenSpec }): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  const entity = entityOf(next, table);
  const column = entity?.columns.find(c => c.name === name);
  if (!entity || !column) return { error: `There is no column "${name}" in ${table}.` };
  const notes: string[] = [];
  if (patch.gen) {
    if (name === keyOf(entity) && patch.gen.type !== 'id') return { error: 'The key column must stay an identifier so every row is unique.' };
    column.gen = patch.gen;
  }
  if (patch.name !== undefined && patch.name.trim() !== name) {
    const to = patch.name.trim();
    if (!isIdent(to)) return { error: 'A column name uses letters, digits and underscores, and does not start with a digit.' };
    if (entity.columns.some(c => c.name === to)) return { error: `${table} already has a column "${to}".` };
    if (fkNames(next, table).includes(to)) return { error: `"${to}" is a foreign key column of ${table}.` };
    if (name === keyOf(entity)) return updateEntity(model, table, { key: to });
    column.name = to;
    for (const other of entity.columns) if (other.gen.type === 'date_after' && other.gen.column === name) other.gen.column = to;
    for (const rule of next.constraints) {
      const rel = relOf(next, rule.relationship);
      if (!rel || rel.type === 'many_to_many') continue;
      const childName = rel.type === 'group' ? str(rel.entity) : str(rel.child);
      const parentName = rel.type === 'group' ? str(rel.entity) : str(rel.parent);
      if (childName === table) for (const field of ['column', 'child_column']) if (rule[field] === name) rule[field] = to;
      if (parentName === table && rule.parent_column === name) rule.parent_column = to;
    }
  }
  pruneConstraints(previous, next, notes);
  return finish(previous, next, notes);
}

export function removeColumn(model: ErModelJson, table: string, name: string): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  const entity = entityOf(next, table);
  if (!entity || !entity.columns.some(c => c.name === name)) return { error: `There is no column "${name}" in ${table}.` };
  if (name === keyOf(entity)) return { error: `"${name}" is the key of ${table}; it cannot be deleted.` };
  const user = entity.columns.find(c => c.gen.type === 'date_after' && c.gen.column === name);
  if (user) return { error: `The column "${user.name}" is generated from "${name}". Change or delete "${user.name}" first.` };
  entity.columns = entity.columns.filter(c => c.name !== name);
  const notes: string[] = [];
  pruneConstraints(previous, next, notes);
  return finish(previous, next, notes);
}

// ---- relationships ------------------------------------------------------------------------------------------------------
/** What a new relationship of a type looks like before the user has chosen anything: tables left empty for the form to fill. */
export function blankRelationship(type: RelType, names: string[]): RelSpec {
  const [a = '', b = '', c = ''] = names;
  switch (type) {
    case 'one_to_many': return { type, parent: a, child: b, children: { min: 1, max: 3 } };
    case 'many_to_one': return { type, parent: a, child: b, null_share: 0, skew: 0 };
    case 'many_to_many': return { type, left: a, right: b, through: c, per_right: { min: 1, max: 2 }, cover_left: true };
    default: return { type, entity: a, share: 0.2, members: { min: 1, max: 5 } };
  }
}

function uniqueName(spec: ModelSpec, base: string): string {
  const taken = new Set(spec.relationships.map(r => r.name));
  let n = 1;
  let name = base;
  while (taken.has(name)) {
    n += 1;
    name = `${base}_${n}`;
  }
  return name;
}

/** A readable default name: `account_transactions` for account → transaction. */
function suggestName(rel: RelSpec): string {
  if (rel.type === 'many_to_many') return `${str(rel.left)}_${str(rel.right)}`;
  if (rel.type === 'group') return `${str(rel.entity)}_groups`;
  return `${str(rel.parent)}_${str(rel.child)}`;
}

export function addRelationship(model: ErModelJson, draft: RelSpec): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  const driven = drivenTables(next);
  const rel = clone(draft);
  const notes: string[] = [];
  const wanted = typeof rel.name === 'string' ? rel.name.trim() : '';
  if (wanted && !isIdent(wanted)) return { error: 'A relationship name uses letters, digits and underscores.' };
  if (wanted && relOf(next, wanted)) return { error: `There is already a relationship called "${wanted}".` };
  rel.name = wanted || uniqueName(next, suggestName(rel));
  if (rel.type === 'many_to_many') {
    const through = str(rel.through).trim();
    rel.through = through;
    if (isIdent(through) && !entityOf(next, through)) {
      if (next.entities.length >= MAX_ENTITIES) return { error: `A model can have at most ${MAX_ENTITIES} tables.` };
      next.entities.push({ name: through, key: `${through}_id`, columns: [keyColumn(through, `${through}_id`)] });
      notes.push(`The link table ${through} was created.`);
    }
  }
  for (const field of ['parent', 'child', 'entity', 'left', 'right']) if (typeof rel[field] === 'string' && !entityOf(next, str(rel[field]))) return { error: `Choose an existing table for "${field}".` };
  if (!REL_TYPES.includes(rel.type)) return { error: 'Choose a relationship type.' };
  next.relationships.push(rel);
  materialize(next);
  reconcileCounts(driven, next, notes);
  return finish(previous, next, notes);
}

export function updateRelationship(model: ErModelJson, name: string, patch: Record<string, unknown>): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  const rel = relOf(next, name);
  if (!rel) return { error: `There is no relationship "${name}".` };
  const driven = drivenTables(next);
  const notes: string[] = [];
  const newName = typeof patch.name === 'string' ? patch.name.trim() : name;
  if (newName !== name) {
    if (!isIdent(newName)) return { error: 'A relationship name uses letters, digits and underscores.' };
    if (relOf(next, newName)) return { error: `There is already a relationship called "${newName}".` };
    for (const rule of next.constraints) if (rule.relationship === name) rule.relationship = newName;
  }
  const rest = { ...patch };
  for (const field of ['children', 'per_right', 'members']) {
    const existing = rel[field];
    const given = rest[field];
    if (isObject(existing) && isObject(given)) rest[field] = { ...existing, ...given }; // a new range keeps the weights while they still fit
  }
  delete rest.name;
  delete rest.type; // a relationship keeps its type; to change it, delete it and add another
  Object.assign(rel, rest, { name: newName });
  // a changed card keeps its weights only while they still fit
  for (const field of ['children', 'per_right', 'members']) {
    const card = rel[field];
    if (isObject(card) && isObject(card.weights)) {
      const fits = Object.keys(card.weights).every(k => Number(k) >= Number(card.min) && Number(k) <= Number(card.max));
      if (!fits) {
        delete card.weights;
        notes.push('The weights no longer fit the new range, so they were removed.');
      }
    }
  }
  reconcileCounts(driven, next, notes);
  pruneConstraints(previous, next, notes);
  return finish(previous, next, notes);
}

export function removeRelationship(model: ErModelJson, name: string): EditResult {
  const started = begin(model);
  if ('error' in started) return started;
  const { previous, next } = started;
  const rel = relOf(next, name);
  if (!rel) return { error: `There is no relationship "${name}".` };
  const driven = drivenTables(next);
  next.relationships = next.relationships.filter(r => r !== rel);
  const notes: string[] = [`Relationship ${name} (${describeEnds(rel)}) is deleted.`];
  const rules = next.constraints.filter(c => c.relationship === name);
  next.constraints = next.constraints.filter(c => c.relationship !== name);
  if (rules.length) notes.push(`${rules.length} rule${rules.length === 1 ? '' : 's'} on it ${rules.length === 1 ? 'is' : 'are'} deleted too.`);
  reconcileCounts(driven, next, notes);
  pruneConstraints(previous, next, notes);
  return finish(previous, next, notes);
}
