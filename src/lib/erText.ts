import type { ErPlanConstraint, ErPlanRelationship, ErRange } from '../api/erTypes';

/** A piece of a sentence: plain text, or a table / column name that the screen shows as code. */
export type ErTextPart = string | { code: string };

export const erRange = (range: Pick<ErRange, 'min' | 'max'>): string => (range.min === range.max ? `${range.min}` : `${range.min} to ${range.max}`);

/** "1..4": the short form used on the diagram. */
export const erRangeShort = (range: Pick<ErRange, 'min' | 'max'>): string => erRange(range).replace(' to ', '..');

const percent = (share: number): number => Math.round(share * 100);

/** A relationship in plain words. */
export function describeRelationship(r: ErPlanRelationship): ErTextPart[] {
  switch (r.type) {
    case 'one_to_many': {
      const weights = r.children.weights
        ? ` (weighted: ${Object.entries(r.children.weights).map(([count, share]) => `${count}→${percent(share)}%`).join(', ')})`
        : '';
      return ['Each ', { code: r.parent }, ` has ${erRange(r.children)} `, { code: r.child }, ` rows${weights}`];
    }
    case 'many_to_one':
      return [
        'Each ',
        { code: r.child },
        ' points at one ',
        { code: r.parent },
        r.skew ? ` (some ${r.parent} rows are used far more than others)` : '',
        r.null_share ? `; ${percent(r.null_share)}% have none` : '',
      ];
    case 'many_to_many':
      return [
        'Each ',
        { code: r.right },
        ` is linked to ${erRange(r.per_right)} `,
        { code: r.left },
        ' rows through ',
        { code: r.through },
        r.cover_left ? `; every ${r.left} is linked to at least one ${r.right} when possible` : '',
      ];
    case 'group':
      return [
        `About ${percent(r.share)}% of `,
        { code: r.entity },
        ` rows are main rows; each main has ${erRange(r.members)} member rows of the same table, listed after it`,
      ];
  }
}

const childOf = (r: ErPlanRelationship | undefined): string => (r ? ('child' in r ? r.child : 'entity' in r ? r.entity : r.through) : '?');
const parentOf = (r: ErPlanRelationship | undefined): string => (r ? ('parent' in r ? r.parent : 'entity' in r ? r.entity : r.right) : '?');

/** A business rule in plain words. */
export function describeConstraint(c: ErPlanConstraint, relationships: ErPlanRelationship[]): ErTextPart[] {
  const rel = relationships.find(r => r.name === c.relationship);
  const child = childOf(rel);
  const parent = parentOf(rel);
  const ref = (table: string, column: string): ErTextPart => ({ code: `${table}.${column}` });
  switch (c.type) {
    case 'date_not_before_parent':
      return [ref(child, c.column), ' is never before ', ref(parent, c.parent_column)];
    case 'same_as_parent':
      return [ref(child, c.column), ' is copied from ', ref(parent, c.parent_column)];
    case 'status_follows_parent':
      return ['When ', ref(parent, c.parent_column), ` is ${c.when.map(v => `'${String(v)}'`).join(' or ')}, `, ref(child, c.column), ` becomes '${String(c.set)}'`];
    case 'aggregate':
      return [ref(parent, c.parent_column), ` = ${c.fn} of `, c.child_column ? ref(child, c.child_column) : { code: `${child} rows` }];
  }
}

/** Compact value for the integrity table (expected / observed can be a number, a list or an object). */
export function formatCheckValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)}`)
      .join(' · ');
  }
  return String(value);
}
