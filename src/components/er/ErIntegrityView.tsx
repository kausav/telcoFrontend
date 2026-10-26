import type { ErCheck, ErCheckStatus, ErIntegrityReport } from '../../api/erTypes';
import { formatCheckValue } from '../../lib/erText';

export type ErStatusFilter = 'all' | ErCheckStatus;

const FILTERS: [ErStatusFilter, string][] = [['all', 'All'], ['fail', 'Failed'], ['warn', 'Warnings'], ['info', 'Facts'], ['pass', 'Passed']];
const GROUPS: [ErCheck['kind'], string][] = [['relationship', 'Relationships'], ['constraint', 'Business rules'], ['column', 'Columns'], ['table', 'Tables and keys']];
const STATUS_STYLE: Record<ErCheckStatus, string> = {
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-700',
  warn: 'bg-amber-100 text-amber-800',
  info: 'bg-slate-100 text-slate-600',
};
const TH = 'text-left px-2.5 py-1.5 border-b border-[#E5DFD3] text-[11px] uppercase tracking-wide text-[#6B6557] font-semibold';
const TD = 'text-left px-2.5 py-1.5 border-b border-[#E5DFD3] align-top';

interface Props {
  report: ErIntegrityReport;
  filter: ErStatusFilter;
  onFilter: (filter: ErStatusFilter) => void;
}

export function ErIntegrityView({ report, filter, onFilter }: Props) {
  const { summary } = report;
  const keep = (check: ErCheck) => filter === 'all' || check.status === filter;
  return (
    <div className="text-[13px]">
      <div data-testid="er-banner" className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 rounded-xl mb-3.5 ${report.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
        <span className="text-xl font-extrabold">{report.passed ? 'PASS' : 'FAIL'}</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>{`${summary.checks} checks`}</span>
          <span>{`${summary.passed} passed`}</span>
          <span>{`${summary.failed} failed`}</span>
          <span>{`${summary.warnings} warnings`}</span>
          <span>{`${summary.tables} tables`}</span>
          <span>{`${summary.total_rows.toLocaleString()} rows`}</span>
        </div>
      </div>
      <p className="text-[12px] text-[#6B6557] mb-2.5">These checks are made by a separate checker that reads only the delivered tables, not how they were generated.</p>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => onFilter(id)}
            className={`px-3 py-1 rounded-full border font-semibold text-[12.5px] cursor-pointer ${filter === id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-[#E5DFD3] text-[#29251D] hover:bg-[#F6F2EA]'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {GROUPS.map(([kind, title]) => {
        const checks = report.checks.filter(c => c.kind === kind && keep(c));
        if (checks.length === 0) return null;
        return (
          <section key={kind}>
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#6B6557] mt-5 mb-2">{title}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>{['Result', 'What is checked', 'Expected', 'Found'].map(t => <th key={t} className={TH}>{t}</th>)}</tr>
                </thead>
                <tbody>
                  {checks.map(check => (
                    <tr key={check.id}>
                      <td className={TD}>
                        <span className={`inline-block min-w-[46px] text-center text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE[check.status]}`}>{check.status}</span>
                      </td>
                      <td className={TD}>{check.description}</td>
                      <td className={`${TD} font-mono text-[11.5px] text-[#6B6557]`}>{formatCheckValue(check.expected)}</td>
                      <td className={`${TD} font-mono text-[11.5px] text-[#6B6557]`}>
                        {formatCheckValue(check.observed) + (check.rows_checked != null ? ` (${check.rows_checked} rows checked)` : '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
