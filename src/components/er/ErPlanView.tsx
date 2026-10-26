import type { ErPlan, ErTableRole } from '../../api/erTypes';
import { describeConstraint, describeRelationship } from '../../lib/erText';
import { ErSentence } from './ErText';

const ROLE_LABEL: Record<ErTableRole, string> = { root: 'Own count', child: 'From a parent', junction: 'Links two tables' };
const ROLE_TAG: Record<ErTableRole, string> = { root: 'bg-[#E8F0FE] text-indigo-700', child: 'bg-[#EEF1F6] text-slate-600', junction: 'bg-[#FFF4DC] text-amber-800' };

const H3 = 'text-[12px] font-semibold uppercase tracking-wider text-[#6B6557] mt-6 mb-2';
const TH = 'text-left px-2.5 py-1.5 border-b border-[#E5DFD3] text-[11px] uppercase tracking-wide text-[#6B6557] font-semibold';
const TD = 'text-left px-2.5 py-1.5 border-b border-[#E5DFD3] align-top';
const TAG = 'inline-block text-[10.5px] font-bold uppercase tracking-wide px-2 py-px rounded-full mr-2';

export function ErPlanView({ plan }: { plan: ErPlan }) {
  return (
    <div className="text-[13px]">
      <h3 className={`${H3} mt-0`}>Tables are created in this order (parents first)</h3>
      <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="er-order">
        {plan.order.map((name, index) => (
          <span key={name} className="flex items-center gap-2">
            {index > 0 && <span className="text-[#6B6557]">→</span>}
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[12.5px]">{name}</span>
          </span>
        ))}
      </div>

      <h3 className={H3}>{`Tables · about ${plan.projected_rows.toLocaleString()} rows in total`}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>{['Table', 'How its rows are decided', 'Expected rows', 'Key', 'Foreign keys'].map(t => <th key={t} className={TH}>{t}</th>)}</tr>
          </thead>
          <tbody>
            {plan.entities.map(entity => (
              <tr key={entity.name}>
                <td className={TD}><b>{entity.name}</b></td>
                <td className={TD}>
                  <span className={`${TAG} ${ROLE_TAG[entity.role]}`}>{ROLE_LABEL[entity.role]}</span>
                  {entity.created_by && <code className="font-mono text-[12px]">{entity.created_by}</code>}
                </td>
                <td className={TD}>{entity.rows_expected.toLocaleString()}</td>
                <td className={TD}><code className="font-mono text-[12px]">{entity.key}</code></td>
                <td className={TD}>
                  {entity.columns.filter(c => c.kind === 'fk').map(c => (
                    <div key={c.name}><code className="font-mono text-[12px]">{c.name}</code>{` → ${c.references ?? ''}`}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className={H3}>Relationships</h3>
      <ul className="grid gap-1.5" data-testid="er-relationships">
        {plan.relationships.map(r => (
          <li key={r.name} className="px-2.5 py-2 bg-[#F6F2EA] rounded-lg">
            <span className={`${TAG} bg-[#EEF1F6] text-slate-600`}>{r.type.replace(/_/g, ' ')}</span>
            <ErSentence parts={describeRelationship(r)} />
          </li>
        ))}
      </ul>

      {plan.constraints.length > 0 && (
        <>
          <h3 className={H3}>Business rules</h3>
          <ul className="grid gap-1.5" data-testid="er-rules">
            {plan.constraints.map(c => (
              <li key={c.name} className="px-2.5 py-2 bg-[#F6F2EA] rounded-lg">
                <span className={`${TAG} bg-[#EEF1F6] text-slate-600`}>{c.type.replace(/_/g, ' ')}</span>
                <ErSentence parts={describeConstraint(c, plan.relationships)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
