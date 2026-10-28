import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { ErGenerateResult, ErPlan, ErPlanRelationship } from '../../api/erTypes';
import { erRangeShort } from '../../lib/erText';
import { BOX_W, HEAD_H, ROW_H, VIEWS, layoutDiagram, type DiagramView, type LaidBox, type Point, type Positions } from './erLayout';

/** What is picked on the diagram while editing. */
export type DiagramSelection = { kind: 'table'; name: string } | { kind: 'relationship'; name: string } | null;

interface Props {
  plan: ErPlan;
  /** Real row counts once data has been generated; before that the plan's expected counts are shown with a "~". */
  result: ErGenerateResult | null;
  fit: boolean;
  onToggleFit: () => void;
  onOpenTable: (name: string) => void;
  view: DiagramView;
  onView: (view: DiagramView) => void;
  /** Tables the user has dragged in this view. */
  positions: Positions;
  onMove: (name: string, to: Point) => void;
  onResetLayout: () => void;
  editing: boolean;
  onToggleEdit: () => void;
  /** Why editing is not possible right now (for example the JSON cannot be read), or null. */
  editBlocked: string | null;
  selection: DiagramSelection;
  onSelect: (selection: DiagramSelection) => void;
  /** The plan shown is the last valid one, because the model has a problem right now. */
  outdated: boolean;
  /** The editing panel, shown beside the diagram while editing. */
  inspector?: ReactNode;
}

interface Drag {
  name: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  moved: boolean;
  /** The size of the drawing when the drag began, kept so the picture does not rescale under the pointer. */
  width: number;
  height: number;
}

const ROLE_STYLE = {
  root: { fill: '#E8F0FE', stroke: '#9DB6F0' },
  child: { fill: '#FFFFFF', stroke: '#B9C1CE' },
  junction: { fill: '#FFF4DC', stroke: '#E0B15A' },
} as const;

const ACCENT = '#4F46E5';
const INK = '#29251D';
const MUTED = '#6B6557';
const DRAG_THRESHOLD = 4; // below this a press is a click, not a drag

export function ErDiagram({
  plan, result, fit, onToggleFit, onOpenTable, view, onView, positions, onMove, onResetLayout, editing, onToggleEdit, editBlocked, selection, onSelect, outdated, inspector,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const placed: Positions = drag?.moved ? { ...positions, [drag.name]: { x: drag.x, y: drag.y } } : positions;
  const layout = layoutDiagram(plan, view, placed);
  const { boxes, edges } = layout;
  const width = Math.max(layout.width, drag?.width ?? 0);
  const height = Math.max(layout.height, drag?.height ?? 0);
  const relationships = new Map<string, ErPlanRelationship>(plan.relationships.map(r => [r.name, r] as const));
  const selectedTable = selection?.kind === 'table' ? selection.name : null;
  const selectedRelationship = selection?.kind === 'relationship' ? selection.name : null;

  const activate = (name: string) => {
    if (editing) onSelect({ kind: 'table', name });
    else onOpenTable(name);
  };
  const onKey = (name: string) => (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(name);
    }
  };

  /** A pointer position in the drawing's own units, whatever the zoom. */
  const toDrawing = (event: { clientX: number; clientY: number }): Point | null => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const at = point.matrixTransform(matrix.inverse());
    return { x: at.x, y: at.y };
  };

  const startDrag = (event: PointerEvent<SVGGElement>, box: LaidBox) => {
    if (event.button !== 0) return;
    const at = toDrawing(event);
    if (!at) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ name: box.entity.name, startX: at.x, startY: at.y, originX: box.x, originY: box.y, x: box.x, y: box.y, moved: false, width: layout.width, height: layout.height });
  };
  const moveDrag = (event: PointerEvent<SVGGElement>) => {
    if (!drag) return;
    const at = toDrawing(event);
    if (!at) return;
    const dx = at.x - drag.startX;
    const dy = at.y - drag.startY;
    const moved = drag.moved || Math.hypot(dx, dy) > DRAG_THRESHOLD;
    if (!moved) return;
    setDrag({ ...drag, moved, x: Math.max(10, Math.round(drag.originX + dx)), y: Math.max(10, Math.round(drag.originY + dy)) });
  };
  const endDrag = (event: PointerEvent<SVGGElement>) => {
    if (!drag) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const finished = drag;
    setDrag(null);
    if (finished.moved) onMove(finished.name, { x: finished.x, y: finished.y });
    else activate(finished.name);
  };

  const hasMoved = Object.keys(positions).length > 0;
  const viewHint = VIEWS.find(v => v.id === view)?.hint ?? '';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2.5">
        <div role="group" aria-label="Diagram view" className="inline-flex rounded-lg border border-[#E5DFD3] overflow-hidden bg-white">
          {VIEWS.map(option => (
            <button
              key={option.id}
              type="button"
              aria-pressed={view === option.id}
              title={option.hint}
              onClick={() => onView(option.id)}
              className={`px-3 py-1 text-[12.5px] font-semibold cursor-pointer border-r last:border-r-0 border-[#E5DFD3] ${view === option.id ? 'bg-indigo-600 text-white' : 'text-[#29251D] hover:bg-[#F6F2EA]'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <button
          type="button"
          aria-pressed={editing}
          disabled={editBlocked !== null && !editing}
          title={editBlocked ?? 'Add, rename and delete tables, columns and relationships on the diagram'}
          onClick={onToggleEdit}
          className={`px-3 py-1 rounded-lg border text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${editing ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-[#E5DFD3] bg-white hover:bg-[#F6F2EA] text-[#29251D]'}`}
        >
          {editing ? 'Done editing' : 'Edit diagram'}
        </button>
        <button
          type="button"
          onClick={onResetLayout}
          disabled={!hasMoved}
          title="Put the tables back where this view places them"
          className="px-2.5 py-1 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#F6F2EA] text-[12.5px] text-[#29251D] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset layout
        </button>
        <button type="button" onClick={onToggleFit} className="px-2.5 py-1 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#F6F2EA] text-[12.5px] text-[#29251D] cursor-pointer">
          {fit ? 'Actual size' : 'Fit to width'}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6B6557] mb-2.5">
        <span><i className="inline-block w-3 h-3 rounded-[3px] mr-1.5 align-[-2px] border-[1.4px]" style={{ background: ROLE_STYLE.root.fill, borderColor: ROLE_STYLE.root.stroke }} />root table (has its own count)</span>
        <span><i className="inline-block w-3 h-3 rounded-[3px] mr-1.5 align-[-2px] border-[1.4px]" style={{ background: ROLE_STYLE.child.fill, borderColor: ROLE_STYLE.child.stroke }} />created from a parent</span>
        <span><i className="inline-block w-3 h-3 rounded-[3px] mr-1.5 align-[-2px] border-[1.4px]" style={{ background: ROLE_STYLE.junction.fill, borderColor: ROLE_STYLE.junction.stroke }} />many-to-many link table</span>
        <span>dashed loop = rows of one table grouped under a main row</span>
        <span>drag a table to move it</span>
        <span>{editing ? 'click a table or a line to edit it' : 'click a table to open its data'}</span>
        <span className="text-[#8A8373]">{viewHint}</span>
      </div>
      {outdated && (
        <div className="px-2.5 py-2 rounded-lg text-[12.5px] bg-amber-100 text-amber-800 mb-2.5" data-testid="er-diagram-outdated">
          The model has a problem right now (listed on the left), so this is the last good diagram. It updates as soon as the problem is fixed.
        </div>
      )}
      <div className="flex flex-col xl:flex-row gap-3 items-start">
        <div className="overflow-auto min-w-0 w-full flex-1">
          <svg
            ref={svgRef}
            data-testid="er-svg"
            data-view={view}
            width={fit ? '100%' : width}
            height={fit ? undefined : height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Entity-relationship diagram"
            style={fit ? { maxWidth: width, display: 'block' } : { display: 'block' }}
            fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            onClick={event => { if (editing && event.target === event.currentTarget) onSelect(null); }}
          >
            <defs>
              <marker id="er-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={8} markerHeight={8} orient="auto-start-reverse">
                <path d="M0,1 L10,5 L0,9 z" fill="#7A869A" />
              </marker>
              <marker id="er-arrow-hot" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={8} markerHeight={8} orient="auto-start-reverse">
                <path d="M0,1 L10,5 L0,9 z" fill={ACCENT} />
              </marker>
            </defs>
            <g>
              {edges.map(edge => {
                const hot = (selectedRelationship !== null && edge.relationship === selectedRelationship) || (selectedTable !== null && (edge.from === selectedTable || edge.to === selectedTable));
                return (
                  <g key={edge.key} data-edge={edge.key} data-relationship={edge.relationship ?? ''}>
                    <path
                      d={edge.path}
                      fill="none"
                      stroke={hot ? ACCENT : edge.kind === 'group' ? ACCENT : '#7A869A'}
                      strokeWidth={hot ? 2.4 : 1.4}
                      strokeDasharray={edge.kind === 'group' ? '5 4' : undefined}
                      markerEnd={hot ? 'url(#er-arrow-hot)' : 'url(#er-arrow)'}
                    />
                    {editing && edge.relationship && (
                      <path
                        d={edge.path}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={14}
                        className="cursor-pointer"
                        data-edge-hit={edge.relationship}
                        onClick={() => onSelect({ kind: 'relationship', name: edge.relationship as string })}
                      >
                        <title>{`Relationship ${edge.relationship}: click to edit`}</title>
                      </path>
                    )}
                  </g>
                );
              })}
            </g>
            {boxes.map(box => {
              const { entity } = box;
              const style = ROLE_STYLE[entity.role];
              const rows = result ? result.tables[entity.name]?.total_records ?? entity.rows_expected : entity.rows_expected;
              const prefix = entity.role === 'junction' ? 'many-to-many link · ' : '';
              const chosen = selectedTable === entity.name;
              return (
                <g
                  key={entity.name}
                  data-table={entity.name}
                  data-x={Math.round(box.x)}
                  data-y={Math.round(box.y)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${entity.name}: ${editing ? 'edit this table' : 'open its data'}`}
                  aria-pressed={editing ? chosen : undefined}
                  style={{ cursor: drag?.name === entity.name && drag.moved ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none' }}
                  onPointerDown={event => startDrag(event, box)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={() => setDrag(null)}
                  onKeyDown={onKey(entity.name)}
                >
                  <rect x={box.x} y={box.y} width={BOX_W} height={box.height} rx={9} fill={style.fill} stroke={chosen ? ACCENT : style.stroke} strokeWidth={chosen ? 2.6 : 1.4} />
                  <text x={box.x + 12} y={box.y + 20} fontSize={13} fontWeight={700} fill={INK}>{entity.name}</text>
                  <text x={box.x + 12} y={box.y + 34} fontSize={10.5} fill={MUTED}>{`${prefix}${result ? '' : '~'}${rows.toLocaleString()} rows`}</text>
                  {box.tag === 'fact' && <text x={box.x + BOX_W - 12} y={box.y + 34} fontSize={9} fontWeight={700} fill={ACCENT} textAnchor="end">FACT TABLE</text>}
                  <line x1={box.x} x2={box.x + BOX_W} y1={box.y + HEAD_H - 2} y2={box.y + HEAD_H - 2} stroke="#DFE3EA" />
                  {box.shown.map((column, index) => {
                    const cy = box.y + HEAD_H + index * ROW_H + 15;
                    const isFk = column.kind === 'fk';
                    const target = column.references ? column.references.split('.')[0] : '';
                    const relationship = column.relationship ? relationships.get(column.relationship) : undefined;
                    const selfRef = isFk && target === entity.name && relationship?.type === 'group';
                    const wanted = selfRef && relationship?.type === 'group' ? `↺ ${erRangeShort(relationship.members)}` : isFk ? `→ ${target}` : column.generator ?? '';
                    const room = Math.floor((BOX_W - 62 - column.name.length * (isFk ? 8 : 6.8)) / 5.6); // keep the note clear of a long column name
                    const right = wanted.length <= room ? wanted : room >= 4 ? `${wanted.slice(0, room - 1)}…` : '';
                    return (
                      <g key={column.name}>
                        <text x={box.x + 12} y={cy} fontSize={9} fontWeight={700} fill={isFk ? ACCENT : MUTED}>{column.kind === 'key' ? 'PK' : isFk ? 'FK' : ''}</text>
                        <text x={box.x + 36} y={cy} fontSize={12} fontWeight={isFk ? 600 : 400} fill={isFk ? ACCENT : INK}>{column.name}</text>
                        <text x={box.x + BOX_W - 10} y={cy} fontSize={10.5} fill={MUTED} textAnchor="end">{right}</text>
                      </g>
                    );
                  })}
                  {box.hiddenColumns > 0 && (
                    <text x={box.x + 36} y={box.y + HEAD_H + box.shown.length * ROW_H + 15} fontSize={10.5} fill={MUTED}>{`+ ${box.hiddenColumns} more columns`}</text>
                  )}
                </g>
              );
            })}
            <g pointerEvents="none">
              {edges.flatMap(edge => [
                edge.parentLabel && (
                  <text key={`${edge.key}-p`} x={edge.parentLabel.x} y={edge.parentLabel.y} fontSize={10.5} fontWeight={700} fill={ACCENT} stroke="#FFFFFF" strokeWidth={4} paintOrder="stroke" textAnchor={edge.parentLabel.anchor}>{edge.parentLabel.text}</text>
                ),
                edge.childLabel && (
                  <text key={`${edge.key}-c`} x={edge.childLabel.x} y={edge.childLabel.y} fontSize={10.5} fontWeight={700} fill={ACCENT} stroke="#FFFFFF" strokeWidth={4} paintOrder="stroke" textAnchor={edge.childLabel.anchor}>{edge.childLabel.text}</text>
                ),
              ])}
            </g>
          </svg>
        </div>
        {editing && inspector && <aside aria-label="Edit the model" className="w-full xl:w-[350px] xl:shrink-0">{inspector}</aside>}
      </div>
    </div>
  );
}
