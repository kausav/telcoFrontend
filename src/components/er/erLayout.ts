import type { ErPlan, ErPlanColumn, ErPlanEntity, ErPlanRelationship } from '../../api/erTypes';
import { erRangeShort } from '../../lib/erText';

export const BOX_W = 218;
export const HEAD_H = 42;
export const ROW_H = 22;
export const GAP_X = 84;
export const GAP_Y = 30;
export const MAX_COLS = 13;

export interface LaidBox {
  entity: ErPlanEntity;
  x: number;
  y: number;
  height: number;
  shown: ErPlanColumn[];
  hiddenColumns: number;
}

export interface LaidEdge {
  key: string;
  /** A foreign key to another table, or a group loop back to its own table. */
  kind: 'link' | 'group';
  path: string;
  /** Cardinality labels: "1" at the parent end, "1..4" / "N" at the child end. */
  parentLabel?: { x: number; y: number; text: string };
  childLabel?: { x: number; y: number; text: string };
}

export interface Layout {
  width: number;
  height: number;
  boxes: LaidBox[];
  edges: LaidEdge[];
}

const tableOf = (reference: string): string => reference.split('.')[0];
const columnOf = (reference: string): string => reference.slice(reference.indexOf('.') + 1);

/** Where each table sits: a column per depth (parents left, children right), tables ordered to keep the links short. */
export function layoutDiagram(plan: ErPlan): Layout {
  const byName = new Map(plan.entities.map(e => [e.name, e] as const));
  const parentsOf = (e: ErPlanEntity): string[] =>
    e.columns.filter(c => c.kind === 'fk' && c.references).map(c => tableOf(c.references as string)).filter(p => p !== e.name);

  const level = new Map<string, number>();
  for (const name of plan.order) {
    const entity = byName.get(name);
    if (!entity) continue;
    const parents = parentsOf(entity);
    level.set(name, parents.length ? 1 + Math.max(...parents.map(p => level.get(p) ?? 0)) : 0);
  }
  const maxLevel = Math.max(0, ...level.values());

  const shownOf = (e: ErPlanEntity): ErPlanColumn[] => e.columns.slice(0, MAX_COLS);
  const heightOf = (e: ErPlanEntity): number => HEAD_H + (shownOf(e).length + (e.columns.length > MAX_COLS ? 1 : 0)) * ROW_H + 10;

  const pos = new Map<string, { x: number; y: number }>();
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
      const entity = byName.get(n);
      if (!entity) continue;
      pos.set(n, { x: 30 + lv * (BOX_W + GAP_X), y });
      centerY.set(n, y + heightOf(entity) / 2);
      y += heightOf(entity) + GAP_Y;
    }
  }

  const boxes: LaidBox[] = plan.order.flatMap(name => {
    const entity = byName.get(name);
    const at = pos.get(name);
    if (!entity || !at) return [];
    return [{ entity, x: at.x, y: at.y, height: heightOf(entity), shown: shownOf(entity), hiddenColumns: Math.max(0, entity.columns.length - MAX_COLS) }];
  });
  const boxOf = new Map(boxes.map(b => [b.entity.name, b] as const));

  const headY = (name: string): number => (boxOf.get(name)?.y ?? 0) + 20; // parent links leave from the title row
  const rowY = (name: string, column: string): number => {
    const box = boxOf.get(name);
    if (!box) return 0;
    const index = Math.max(0, box.shown.findIndex(c => c.name === column));
    return box.y + HEAD_H + index * ROW_H + ROW_H / 2;
  };
  const relationships = new Map<string, ErPlanRelationship>(plan.relationships.map(r => [r.name, r] as const));

  const edges: LaidEdge[] = [];
  for (const box of boxes) {
    for (const column of box.entity.columns) {
      if (column.kind !== 'fk' || !column.references) continue;
      const parentName = tableOf(column.references);
      const rel = column.relationship ? relationships.get(column.relationship) : undefined;
      const child = box.entity.name;
      const x2 = box.x;
      const y2 = rowY(child, column.name);
      const key = `${child}.${column.name}`;
      if (parentName === child) {
        // A group: a loop on the right side, from the member's foreign key to the main row's key.
        const x = box.x + BOX_W;
        const y1 = rowY(child, columnOf(column.references));
        edges.push({ key, kind: 'group', path: `M${x},${y2} C${x + 46},${y2} ${x + 46},${y1} ${x},${y1}` });
        continue;
      }
      const parentBox = boxOf.get(parentName);
      if (!parentBox) continue;
      const x1 = parentBox.x + BOX_W;
      const y1 = headY(parentName);
      const dx = Math.max(40, (x2 - x1) / 2);
      let childEnd = 'N';
      if (rel?.type === 'one_to_many') childEnd = erRangeShort(rel.children);
      edges.push({
        key,
        kind: 'link',
        path: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`,
        parentLabel: { x: x1 + 6, y: y1 - 6, text: '1' },
        childLabel: { x: x2 - 8, y: y2 - 6, text: childEnd },
      });
    }
  }

  const width = 30 + (maxLevel + 1) * (BOX_W + GAP_X) + 40;
  const height = Math.max(0, ...boxes.map(b => b.y + b.height)) + 30;
  return { width, height, boxes, edges };
}
