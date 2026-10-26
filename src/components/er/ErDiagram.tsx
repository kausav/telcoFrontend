import type { KeyboardEvent } from 'react';
import type { ErGenerateResult, ErPlan, ErPlanRelationship } from '../../api/erTypes';
import { erRangeShort } from '../../lib/erText';
import { BOX_W, HEAD_H, MAX_COLS, ROW_H, layoutDiagram } from './erLayout';

interface Props {
  plan: ErPlan;
  /** Real row counts once data has been generated; before that the plan's expected counts are shown with a "~". */
  result: ErGenerateResult | null;
  fit: boolean;
  onToggleFit: () => void;
  onOpenTable: (name: string) => void;
}

const ROLE_STYLE = {
  root: { fill: '#E8F0FE', stroke: '#9DB6F0' },
  child: { fill: '#FFFFFF', stroke: '#B9C1CE' },
  junction: { fill: '#FFF4DC', stroke: '#E0B15A' },
} as const;

const ACCENT = '#4F46E5';
const INK = '#29251D';
const MUTED = '#6B6557';

export function ErDiagram({ plan, result, fit, onToggleFit, onOpenTable }: Props) {
  const { width, height, boxes, edges } = layoutDiagram(plan);
  const relationships = new Map<string, ErPlanRelationship>(plan.relationships.map(r => [r.name, r] as const));
  const activate = (name: string) => (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenTable(name);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6B6557] mb-2.5">
        <span><i className="inline-block w-3 h-3 rounded-[3px] mr-1.5 align-[-2px] border-[1.4px]" style={{ background: ROLE_STYLE.root.fill, borderColor: ROLE_STYLE.root.stroke }} />root table (has its own count)</span>
        <span><i className="inline-block w-3 h-3 rounded-[3px] mr-1.5 align-[-2px] border-[1.4px]" style={{ background: ROLE_STYLE.child.fill, borderColor: ROLE_STYLE.child.stroke }} />created from a parent</span>
        <span><i className="inline-block w-3 h-3 rounded-[3px] mr-1.5 align-[-2px] border-[1.4px]" style={{ background: ROLE_STYLE.junction.fill, borderColor: ROLE_STYLE.junction.stroke }} />many-to-many link table</span>
        <span>dashed loop = rows of one table grouped under a main row</span>
        <span>click a table to open its data</span>
        <span className="flex-1" />
        <button type="button" onClick={onToggleFit} className="px-2.5 py-0.5 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#F6F2EA] text-[#29251D] cursor-pointer">
          {fit ? 'Actual size' : 'Fit to width'}
        </button>
      </div>
      <div className="overflow-auto">
        <svg
          width={fit ? '100%' : width}
          height={fit ? undefined : height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Entity-relationship diagram"
          style={fit ? { maxWidth: width, display: 'block' } : { display: 'block' }}
          fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        >
          <defs>
            <marker id="er-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={8} markerHeight={8} orient="auto-start-reverse">
              <path d="M0,1 L10,5 L0,9 z" fill="#7A869A" />
            </marker>
          </defs>
          <g>
            {edges.map(edge => (
              <path
                key={edge.key}
                d={edge.path}
                fill="none"
                stroke={edge.kind === 'group' ? ACCENT : '#7A869A'}
                strokeWidth={1.4}
                strokeDasharray={edge.kind === 'group' ? '5 4' : undefined}
                markerEnd="url(#er-arrow)"
              />
            ))}
          </g>
          {boxes.map(box => {
            const { entity } = box;
            const style = ROLE_STYLE[entity.role];
            const rows = result ? result.tables[entity.name]?.total_records ?? entity.rows_expected : entity.rows_expected;
            const prefix = entity.role === 'junction' ? 'many-to-many link · ' : '';
            return (
              <g
                key={entity.name}
                data-table={entity.name}
                tabIndex={0}
                role="button"
                aria-label={`${entity.name}: open its data`}
                className="cursor-pointer"
                onClick={() => onOpenTable(entity.name)}
                onKeyDown={activate(entity.name)}
              >
                <rect x={box.x} y={box.y} width={BOX_W} height={box.height} rx={9} fill={style.fill} stroke={style.stroke} strokeWidth={1.4} />
                <text x={box.x + 12} y={box.y + 20} fontSize={13} fontWeight={700} fill={INK}>{entity.name}</text>
                <text x={box.x + 12} y={box.y + 34} fontSize={10.5} fill={MUTED}>{`${prefix}${result ? '' : '~'}${rows.toLocaleString()} rows`}</text>
                <line x1={box.x} x2={box.x + BOX_W} y1={box.y + HEAD_H - 2} y2={box.y + HEAD_H - 2} stroke="#DFE3EA" />
                {box.shown.map((column, index) => {
                  const cy = box.y + HEAD_H + index * ROW_H + 15;
                  const isFk = column.kind === 'fk';
                  const target = column.references ? column.references.split('.')[0] : '';
                  const relationship = column.relationship ? relationships.get(column.relationship) : undefined;
                  const selfRef = isFk && target === entity.name && relationship?.type === 'group';
                  const right = selfRef && relationship?.type === 'group' ? `↺ ${erRangeShort(relationship.members)}` : isFk ? `→ ${target}` : column.generator ?? '';
                  return (
                    <g key={column.name}>
                      <text x={box.x + 12} y={cy} fontSize={9} fontWeight={700} fill={isFk ? ACCENT : MUTED}>{column.kind === 'key' ? 'PK' : isFk ? 'FK' : ''}</text>
                      <text x={box.x + 36} y={cy} fontSize={12} fontWeight={isFk ? 600 : 400} fill={isFk ? ACCENT : INK}>{column.name}</text>
                      <text x={box.x + BOX_W - 10} y={cy} fontSize={10.5} fill={MUTED} textAnchor="end">{right}</text>
                    </g>
                  );
                })}
                {box.hiddenColumns > 0 && (
                  <text x={box.x + 36} y={box.y + HEAD_H + MAX_COLS * ROW_H + 15} fontSize={10.5} fill={MUTED}>{`+ ${box.hiddenColumns} more columns`}</text>
                )}
              </g>
            );
          })}
          <g>
            {edges.flatMap(edge => [
              edge.parentLabel && (
                <text key={`${edge.key}-p`} x={edge.parentLabel.x} y={edge.parentLabel.y} fontSize={10.5} fontWeight={700} fill={ACCENT} stroke="#FFFFFF" strokeWidth={4} paintOrder="stroke">{edge.parentLabel.text}</text>
              ),
              edge.childLabel && (
                <text key={`${edge.key}-c`} x={edge.childLabel.x} y={edge.childLabel.y} fontSize={10.5} fontWeight={700} fill={ACCENT} stroke="#FFFFFF" strokeWidth={4} paintOrder="stroke" textAnchor="end">{edge.childLabel.text}</text>
              ),
            ])}
          </g>
        </svg>
      </div>
    </div>
  );
}
