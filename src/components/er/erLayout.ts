import type { ErPlan, ErPlanColumn, ErPlanEntity, ErPlanRelationship } from '../../api/erTypes';
import { erRangeShort } from '../../lib/erText';

export const BOX_W = 218;
export const HEAD_H = 42;
export const ROW_H = 22;
export const GAP_X = 84;
export const GAP_Y = 30;
export const MAX_COLS = 13;
const MAX_COLS_COMPACT = 9;

/** The ways the same model can be drawn. */
export type DiagramView = 'layered' | 'tree' | 'star' | 'circular' | 'snowflake';

export const VIEWS: { id: DiagramView; label: string; hint: string }[] = [
  { id: 'layered', label: 'Layered', hint: 'Parents on the left, the tables made from them to the right' },
  { id: 'tree', label: 'Top-down tree', hint: 'Parents at the top, the tables made from them below' },
  { id: 'star', label: 'Star', hint: 'The best-connected table in the centre, the others in rings around it' },
  { id: 'circular', label: 'Circular', hint: 'All tables on one circle, linked tables next to each other' },
  { id: 'snowflake', label: 'Snowflake', hint: 'The fact table in the centre; each dimension and its sub-dimensions fan out in their own direction' },
];

/** Top-left corner of a table box, in diagram units. */
export interface Point { x: number; y: number }
export type Positions = Record<string, Point>;

export interface LaidBox {
  entity: ErPlanEntity;
  x: number;
  y: number;
  height: number;
  shown: ErPlanColumn[];
  hiddenColumns: number;
  /** Set in the snowflake view on the table the others are arranged around. */
  tag?: 'fact';
}

export interface EdgeLabel { x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end' }

export interface LaidEdge {
  key: string;
  /** A foreign key to another table, or a group loop back to its own table. */
  kind: 'link' | 'group';
  path: string;
  /** The table the foreign key points at, and the table that holds it (for highlighting while one is selected). */
  from: string;
  to: string;
  /** The relationship this key belongs to, if the plan names one. */
  relationship?: string;
  /** Cardinality labels: "1" at the parent end, "1..4" / "N" at the child end. */
  parentLabel?: EdgeLabel;
  childLabel?: EdgeLabel;
}

export interface Layout {
  width: number;
  height: number;
  boxes: LaidBox[];
  edges: LaidEdge[];
}

type Side = 'left' | 'right' | 'top' | 'bottom';
interface Anchor { x: number; y: number; side: Side }

const NORMAL: Record<Side, { x: number; y: number }> = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 } };

const tableOf = (reference: string): string => reference.split('.')[0];
const columnOf = (reference: string): string => reference.slice(reference.indexOf('.') + 1);

const parentsOf = (e: ErPlanEntity): string[] =>
  e.columns.filter(c => c.kind === 'fk' && c.references).map(c => tableOf(c.references as string)).filter(p => p !== e.name);

/** Depth of every table: 0 for a table with no parent, otherwise one more than its deepest parent. */
function levelsOf(plan: ErPlan, byName: Map<string, ErPlanEntity>): Map<string, number> {
  const level = new Map<string, number>();
  for (const name of plan.order) {
    const entity = byName.get(name);
    if (!entity) continue;
    const parents = parentsOf(entity);
    level.set(name, parents.length ? 1 + Math.max(...parents.map(p => level.get(p) ?? 0)) : 0);
  }
  return level;
}

/** Tables that share a link, either direction. */
function neighboursOf(plan: ErPlan): Map<string, string[]> {
  const out = new Map<string, Set<string>>(plan.order.map(n => [n, new Set<string>()] as const));
  for (const entity of plan.entities) {
    for (const parent of parentsOf(entity)) {
      out.get(entity.name)?.add(parent);
      out.get(parent)?.add(entity.name);
    }
  }
  return new Map([...out].map(([name, set]) => [name, [...set]] as const));
}

/** Breadth-first rings around the table with the most neighbours. Tables that cannot be reached are returned separately. */
function ringsFrom(plan: ErPlan): { hub: string; rings: string[][]; alone: string[] } {
  const neighbours = neighboursOf(plan);
  const hub = [...plan.order].sort((a, b) => (neighbours.get(b)?.length ?? 0) - (neighbours.get(a)?.length ?? 0) || plan.order.indexOf(a) - plan.order.indexOf(b))[0] ?? '';
  const seen = new Set<string>(hub ? [hub] : []);
  const rings: string[][] = [];
  let edge = hub ? [hub] : [];
  while (edge.length) {
    const next: string[] = [];
    for (const name of edge) {
      for (const other of [...(neighbours.get(name) ?? [])].sort((a, b) => plan.order.indexOf(a) - plan.order.indexOf(b))) {
        if (!seen.has(other)) {
          seen.add(other);
          next.push(other);
        }
      }
    }
    if (next.length) rings.push(next);
    edge = next;
  }
  return { hub, rings, alone: plan.order.filter(n => !seen.has(n)) };
}

/** The table a snowflake is drawn around: the one that points at the most other tables (a fact table), else the best connected one. */
export function factTable(plan: ErPlan): string {
  const parents = new Map(plan.entities.map(e => [e.name, new Set(parentsOf(e)).size] as const));
  const best = [...plan.entities].sort((a, b) => (parents.get(b.name) ?? 0) - (parents.get(a.name) ?? 0) || b.rows_expected - a.rows_expected || plan.order.indexOf(a.name) - plan.order.indexOf(b.name))[0];
  if (best && (parents.get(best.name) ?? 0) > 0) return best.name;
  return ringsFrom(plan).hub;
}

/** Pushes overlapping boxes apart (the fixed one stays put) until none overlap or the passes run out. */
function separate(at: Positions, fixed: string, heightByName: (n: string) => number): void {
  const names = Object.keys(at);
  const margin = 28;
  for (let pass = 0; pass < 120; pass += 1) {
    let moved = false;
    for (let i = 0; i < names.length; i += 1) {
      for (let j = i + 1; j < names.length; j += 1) {
        const a = at[names[i]];
        const b = at[names[j]];
        const ox = Math.min(a.x + BOX_W + margin - b.x, b.x + BOX_W + margin - a.x);
        const oy = Math.min(a.y + heightByName(names[i]) + margin - b.y, b.y + heightByName(names[j]) + margin - a.y);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        const horizontal = ox < oy;
        const sign = horizontal ? (a.x + BOX_W / 2 <= b.x + BOX_W / 2 ? 1 : -1) : a.y + heightByName(names[i]) / 2 <= b.y + heightByName(names[j]) / 2 ? 1 : -1;
        const push = (horizontal ? ox : oy) / 2 + 1;
        const share = names[i] === fixed ? [0, 2] : names[j] === fixed ? [2, 0] : [1, 1];
        if (horizontal) {
          a.x -= sign * push * share[0];
          b.x += sign * push * share[1];
        } else {
          a.y -= sign * push * share[0];
          b.y += sign * push * share[1];
        }
      }
    }
    if (!moved) return;
  }
}

/**
 * A snowflake: the fact table in the middle, each of its dimensions in a direction of its own, and the dimensions' own lookups
 * (sub-dimensions) further out along the same direction. The directions are spread evenly round the circle.
 */
function snowflakePositions(plan: ErPlan, heightByName: (n: string) => number): { at: Positions; alone: string[] } {
  const fact = factTable(plan);
  const linked = neighboursOf(plan);
  const rank = (n: string): number => plan.order.indexOf(n);
  const depth = new Map<string, number>(fact ? [[fact, 0]] : []);
  const treeParent = new Map<string, string>();
  const queue = fact ? [fact] : [];
  for (let at = 0; at < queue.length; at += 1) {
    const name = queue[at];
    for (const other of [...(linked.get(name) ?? [])].sort((a, b) => rank(a) - rank(b))) {
      if (depth.has(other)) continue;
      depth.set(other, (depth.get(name) ?? 0) + 1);
      treeParent.set(other, name);
      queue.push(other);
    }
  }
  const heads = queue.filter(n => treeParent.get(n) === fact);
  const spacing = BOX_W + 72;
  const firstRadius = Math.max(310, heads.length > 1 ? spacing / (2 * Math.sin(Math.PI / heads.length)) : 0);
  const radiusAt = (d: number): number => firstRadius + (d - 1) * 300;

  const angle = new Map<string, number>();
  heads.forEach((head, i) => angle.set(head, -Math.PI / 2 + (i * 2 * Math.PI) / heads.length)); // the first branch points up, the rest are spread evenly
  const centres: Record<string, Point> = {};
  if (fact) centres[fact] = { x: 0, y: 0 };
  for (const name of queue.slice(1)) {
    const d = depth.get(name) as number;
    if (d > 1) {
      const parent = treeParent.get(name) as string;
      const siblings = queue.filter(n => treeParent.get(n) === parent);
      const step = Math.min(0.9, 280 / radiusAt(d));
      angle.set(name, (angle.get(parent) as number) + (siblings.indexOf(name) - (siblings.length - 1) / 2) * step);
    }
    const a = angle.get(name) as number;
    centres[name] = { x: radiusAt(d) * Math.cos(a), y: radiusAt(d) * Math.sin(a) };
  }
  const at: Positions = {};
  for (const [name, c] of Object.entries(centres)) at[name] = { x: c.x - BOX_W / 2, y: c.y - heightByName(name) / 2 };
  separate(at, fact, heightByName);
  const placed = shiftInto(at);
  const bottom = Math.max(0, ...Object.entries(placed).map(([n, p]) => p.y + heightByName(n)));
  const alone = plan.order.filter(n => !depth.has(n));
  alone.forEach((n, i) => {
    placed[n] = { x: 30 + i * (BOX_W + 44), y: Object.keys(centres).length ? bottom + 60 : 20 };
  });
  return { at: placed, alone };
}

/** Where tables sit by default for a view: top-left corners, before the user has dragged anything. */
function basePositions(plan: ErPlan, view: DiagramView, byName: Map<string, ErPlanEntity>, heightOf: (e: ErPlanEntity) => number): Positions {
  const at: Positions = {};
  const heightByName = (n: string): number => {
    const entity = byName.get(n);
    return entity ? heightOf(entity) : 0;
  };

  if (view === 'layered') {
    const level = levelsOf(plan, byName);
    const maxLevel = Math.max(0, ...level.values());
    const centerY = new Map<string, number>();
    for (let lv = 0; lv <= maxLevel; lv += 1) {
      const names = plan.order.filter(n => level.get(n) === lv);
      const barycenter = (n: string): number => {
        const entity = byName.get(n);
        const parents = entity ? parentsOf(entity) : [];
        return parents.length ? parents.reduce((total, p) => total + (centerY.get(p) ?? 0), 0) / parents.length : 0;
      };
      if (lv > 0) names.sort((a, b) => barycenter(a) - barycenter(b));
      let y = 20;
      for (const n of names) {
        at[n] = { x: 30 + lv * (BOX_W + GAP_X), y };
        centerY.set(n, y + heightByName(n) / 2);
        y += heightByName(n) + GAP_Y;
      }
    }
    return at;
  }

  if (view === 'tree') {
    const level = levelsOf(plan, byName);
    const maxLevel = Math.max(0, ...level.values());
    const centerX = new Map<string, number>();
    const hGap = 44;
    const vGap = 76;
    let y = 20;
    for (let lv = 0; lv <= maxLevel; lv += 1) {
      const names = plan.order.filter(n => level.get(n) === lv);
      const wanted = (n: string): number => {
        const entity = byName.get(n);
        const parents = entity ? parentsOf(entity) : [];
        return parents.length ? parents.reduce((total, p) => total + (centerX.get(p) ?? 0), 0) / parents.length : Number.NaN;
      };
      const order = plan.order;
      if (lv > 0) names.sort((a, b) => (wanted(a) || 0) - (wanted(b) || 0) || order.indexOf(a) - order.indexOf(b));
      let nextFree = -Infinity;
      let rowHeight = 0;
      names.forEach((n, index) => {
        const want = Number.isNaN(wanted(n)) ? index * (BOX_W + hGap) + BOX_W / 2 : wanted(n);
        const x = Math.max(want - BOX_W / 2, nextFree);
        at[n] = { x, y };
        centerX.set(n, x + BOX_W / 2);
        nextFree = x + BOX_W + hGap;
        rowHeight = Math.max(rowHeight, heightByName(n));
      });
      y += rowHeight + vGap;
    }
    return shiftInto(at);
  }

  if (view === 'snowflake') return snowflakePositions(plan, heightByName).at;

  const { hub, rings, alone } = ringsFrom(plan);
  const centers: Record<string, Point> = {};
  const spacing = BOX_W + 72;
  const radiusFor = (count: number, atLeast: number): number => Math.max(atLeast, count > 1 ? spacing / (2 * Math.sin(Math.PI / count)) : 0);

  if (view === 'star') {
    if (hub) centers[hub] = { x: 0, y: 0 };
    let previousRadius = 0;
    const angleOf = new Map<string, number>();
    const linked = neighboursOf(plan);
    rings.forEach((ring, index) => {
      const radius = radiusFor(ring.length, previousRadius + (index === 0 ? 340 : 310));
      previousRadius = radius;
      // tables whose neighbours are already placed start next to them, which keeps the links short
      const wantedAngle = (n: string): number => {
        const mine = (linked.get(n) ?? []).filter(o => angleOf.has(o));
        return mine.length ? mine.reduce((total, o) => total + (angleOf.get(o) as number), 0) / mine.length : -Math.PI / 2;
      };
      const sorted = index === 0 ? ring : [...ring].sort((a, b) => wantedAngle(a) - wantedAngle(b));
      const start = index === 0 ? -Math.PI / 2 : sorted.length ? wantedAngle(sorted[0]) : 0;
      sorted.forEach((n, i) => {
        const angle = start + (i * 2 * Math.PI) / sorted.length;
        angleOf.set(n, angle);
        centers[n] = { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
      });
    });
    const placed = Object.entries(centers).map(([n, c]) => ({ n, c }));
    for (const { n, c } of placed) at[n] = { x: c.x - BOX_W / 2, y: c.y - heightByName(n) / 2 };
    const shifted = shiftInto(at);
    // tables with no link to the rest go in a row underneath
    const bottom = Math.max(0, ...Object.entries(shifted).map(([n, p]) => p.y + heightByName(n)));
    alone.forEach((n, i) => {
      shifted[n] = { x: 30 + i * (BOX_W + 44), y: (placed.length ? bottom + 60 : 20) };
    });
    return shifted;
  }

  // circular: one circle, in the order the breadth-first walk meets the tables, so linked tables sit side by side
  const around = [...(hub ? [hub] : []), ...rings.flat(), ...alone];
  const radius = radiusFor(around.length, 300);
  around.forEach((n, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / around.length;
    at[n] = { x: radius * Math.cos(angle) - BOX_W / 2, y: radius * Math.sin(angle) - heightByName(n) / 2 };
  });
  return shiftInto(at);
}

/** Moves a set of positions so the top-left of the drawing is at (30, 20). */
function shiftInto(at: Positions): Positions {
  const xs = Object.values(at).map(p => p.x);
  const ys = Object.values(at).map(p => p.y);
  if (!xs.length) return at;
  const dx = 30 - Math.min(...xs);
  const dy = 20 - Math.min(...ys);
  return Object.fromEntries(Object.entries(at).map(([n, p]) => [n, { x: p.x + dx, y: p.y + dy }]));
}

/**
 * Lays out the plan in one of the views. `moved` holds tables the user has dragged; they stay where they were put and every link
 * follows them.
 */
export function layoutDiagram(plan: ErPlan, view: DiagramView = 'layered', moved: Positions = {}): Layout {
  const byName = new Map(plan.entities.map(e => [e.name, e] as const));
  const limit = view === 'layered' ? MAX_COLS : MAX_COLS_COMPACT;
  const shownOf = (e: ErPlanEntity): ErPlanColumn[] => e.columns.slice(0, limit);
  const heightOf = (e: ErPlanEntity): number => HEAD_H + (shownOf(e).length + (e.columns.length > limit ? 1 : 0)) * ROW_H + 10;

  const base = basePositions(plan, view, byName, heightOf);
  const fact = view === 'snowflake' ? factTable(plan) : '';
  const boxes: LaidBox[] = plan.order.flatMap(name => {
    const entity = byName.get(name);
    const at = moved[name] ?? base[name];
    if (!entity || !at) return [];
    return [{ entity, x: at.x, y: at.y, height: heightOf(entity), shown: shownOf(entity), hiddenColumns: Math.max(0, entity.columns.length - limit), ...(name === fact ? { tag: 'fact' as const } : {}) }];
  });
  const boxOf = new Map(boxes.map(b => [b.entity.name, b] as const));
  const relationships = new Map<string, ErPlanRelationship>(plan.relationships.map(r => [r.name, r] as const));

  const rowY = (name: string, column: string): number => {
    const box = boxOf.get(name);
    if (!box) return 0;
    const index = Math.max(0, box.shown.findIndex(c => c.name === column));
    return box.y + HEAD_H + index * ROW_H + ROW_H / 2;
  };

  interface Link {
    column: ErPlanColumn;
    child: LaidBox;
    parent: LaidBox;
    relationship?: ErPlanRelationship;
    /** Whether the link can use the layered style: from the parent's title row to the foreign key row, left to right. */
    rowStyle: boolean;
    parentSide: Side;
    childSide: Side;
  }
  const links: Link[] = [];
  const edges: LaidEdge[] = [];

  for (const box of boxes) {
    for (const column of box.entity.columns) {
      if (column.kind !== 'fk' || !column.references) continue;
      const parentName = tableOf(column.references);
      const key = `${box.entity.name}.${column.name}`;
      const relationship = column.relationship ? relationships.get(column.relationship) : undefined;
      if (parentName === box.entity.name) {
        // A group: a loop on the right side, from the member's foreign key to the main row's key.
        const x = box.x + BOX_W;
        const y2 = rowY(box.entity.name, column.name);
        const y1 = rowY(box.entity.name, columnOf(column.references));
        edges.push({ key, kind: 'group', path: `M${x},${y2} C${x + 46},${y2} ${x + 46},${y1} ${x},${y1}`, from: parentName, to: box.entity.name, relationship: column.relationship });
        continue;
      }
      const parent = boxOf.get(parentName);
      if (!parent) continue;
      const rowStyle = view === 'layered' && parent.x + BOX_W + 24 <= box.x;
      // the sides that face each other, by whichever separation is larger relative to the boxes' size
      const dx = box.x + BOX_W / 2 - (parent.x + BOX_W / 2);
      const dy = box.y + box.height / 2 - (parent.y + parent.height / 2);
      const horizontal = Math.abs(dx) / BOX_W >= Math.abs(dy) / ((parent.height + box.height) / 2);
      const parentSide: Side = horizontal ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'bottom' : 'top';
      const childSide: Side = horizontal ? (dx >= 0 ? 'left' : 'right') : dy >= 0 ? 'top' : 'bottom';
      links.push({ column, child: box, parent, relationship, rowStyle, parentSide, childSide });
    }
  }

  // Several links on one side of a box are spread along it, in the order of the boxes they lead to, so they do not stack up.
  const spread = new Map<Link, { parent: number; child: number }>();
  const onSide = new Map<string, { link: Link; end: 'parent' | 'child'; along: number }[]>();
  for (const link of links) {
    if (link.rowStyle) continue;
    for (const end of ['parent', 'child'] as const) {
      const box = end === 'parent' ? link.parent : link.child;
      const other = end === 'parent' ? link.child : link.parent;
      const side = end === 'parent' ? link.parentSide : link.childSide;
      const along = side === 'left' || side === 'right' ? other.y + other.height / 2 : other.x + BOX_W / 2;
      const list = onSide.get(`${box.entity.name}|${side}`) ?? [];
      list.push({ link, end, along });
      onSide.set(`${box.entity.name}|${side}`, list);
    }
  }
  for (const list of onSide.values()) {
    list.sort((a, b) => a.along - b.along);
    list.forEach((item, index) => {
      const offset = (index - (list.length - 1) / 2) * 20;
      const entry = spread.get(item.link) ?? { parent: 0, child: 0 };
      entry[item.end] = offset;
      spread.set(item.link, entry);
    });
  }

  const anchorOf = (box: LaidBox, side: Side, offset: number): Anchor => {
    const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));
    if (side === 'left' || side === 'right') {
      return { x: side === 'left' ? box.x : box.x + BOX_W, y: box.y + clamp(box.height / 2 + offset, 24, box.height - 12), side };
    }
    return { x: box.x + clamp(BOX_W / 2 + offset, 18, BOX_W - 18), y: side === 'top' ? box.y : box.y + box.height, side };
  };

  const labelAt = (anchor: Anchor, text: string): EdgeLabel => {
    switch (anchor.side) {
      case 'right': return { x: anchor.x + 6, y: anchor.y - 6, text, anchor: 'start' };
      case 'left': return { x: anchor.x - 6, y: anchor.y - 6, text, anchor: 'end' };
      case 'bottom': return { x: anchor.x + 7, y: anchor.y + 15, text, anchor: 'start' };
      default: return { x: anchor.x + 7, y: anchor.y - 7, text, anchor: 'start' };
    }
  };

  for (const link of links) {
    const { column, child, parent, relationship } = link;
    const move = spread.get(link) ?? { parent: 0, child: 0 };
    let from: Anchor;
    let to: Anchor;
    if (link.rowStyle) {
      from = { x: parent.x + BOX_W, y: parent.y + 20, side: 'right' }; // parent links leave from the title row
      to = { x: child.x, y: rowY(child.entity.name, column.name), side: 'left' }; // and arrive at the foreign key row
    } else {
      from = anchorOf(parent, link.parentSide, move.parent);
      to = anchorOf(child, link.childSide, move.child);
    }
    const reach = Math.max(40, (Math.abs(to.x - from.x) + Math.abs(to.y - from.y)) / 3);
    const a = NORMAL[from.side];
    const b = NORMAL[to.side];
    const path = `M${from.x},${from.y} C${from.x + a.x * reach},${from.y + a.y * reach} ${to.x + b.x * reach},${to.y + b.y * reach} ${to.x},${to.y}`;
    const childEnd = relationship?.type === 'one_to_many' ? erRangeShort(relationship.children) : 'N';
    edges.push({
      key: `${child.entity.name}.${column.name}`,
      kind: 'link',
      path,
      from: parent.entity.name,
      to: child.entity.name,
      relationship: column.relationship,
      parentLabel: labelAt(from, '1'),
      childLabel: labelAt(to, childEnd),
    });
  }

  const width = Math.max(0, ...boxes.map(b => b.x + BOX_W)) + 40;
  const height = Math.max(0, ...boxes.map(b => b.y + b.height)) + 30;
  return { width: Math.max(width, 60), height: Math.max(height, 60), boxes, edges };
}
