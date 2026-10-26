import { useEffect, useMemo, useRef } from 'react';
import type { ErGenerateResult } from '../../api/erTypes';

export const ER_MAX_ROWS_SHOWN = 200;

interface Props {
  result: ErGenerateResult;
  table: string;
  filter: string;
  highlight: string | null;
  /** Set after a foreign-key jump: where "back" returns to. */
  back: { table: string } | null;
  zipBusy: boolean;
  onSelectTable: (name: string) => void;
  onFilter: (value: string) => void;
  onJump: (table: string, key: string, from: string) => void;
  onBack: () => void;
  onDownloadCsv: () => void;
  onDownloadZip: () => void;
}

export function ErDataView({ result, table: tableName, filter, highlight, back, zipBusy, onSelectTable, onFilter, onJump, onBack, onDownloadCsv, onDownloadZip }: Props) {
  const table = result.tables[tableName] ?? result.tables[result.order[0]];
  const name = result.tables[tableName] ? tableName : result.order[0];
  const foreignKeys = useMemo(() => new Map(table.foreign_keys.map(f => [f.column, f] as const)), [table]);
  const matching = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return table.records;
    return table.records.filter(record => table.fields.some(field => String(record[field] ?? '').toLowerCase().includes(needle)));
  }, [table, filter]);
  const shown = matching.slice(0, ER_MAX_ROWS_SHOWN);

  const highlighted = useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    highlighted.current?.scrollIntoView?.({ block: 'nearest' });
  }, [highlight, name, filter]);

  const button = 'px-3.5 py-1.5 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#F6F2EA] text-[#29251D] cursor-pointer disabled:opacity-60 disabled:cursor-progress';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        {result.order.map(n => (
          <button
            key={n}
            type="button"
            aria-pressed={n === name}
            onClick={() => onSelectTable(n)}
            className={`px-3 py-1 rounded-full border font-semibold text-[12.5px] cursor-pointer ${n === name ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-[#E5DFD3] text-[#29251D] hover:bg-[#F6F2EA]'}`}
          >
            {n}
            <small className="ml-1.5 font-medium opacity-75">{result.tables[n].total_records.toLocaleString()}</small>
          </button>
        ))}
        <span className="flex-1" />
        {back && (
          <button type="button" onClick={onBack} className="px-2.5 py-1 rounded-lg border border-dashed border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold cursor-pointer">
            {`← back to ${back.table}`}
          </button>
        )}
        <input
          type="text"
          value={filter}
          onChange={event => onFilter(event.target.value)}
          placeholder={`Filter ${name} rows…`}
          aria-label="Filter rows"
          className="w-[230px] px-2.5 py-1.5 border border-[#E5DFD3] rounded-lg bg-white text-[13px]"
        />
        <button type="button" className={button} onClick={onDownloadCsv}>Download CSV</button>
        <button type="button" className={button} onClick={onDownloadZip} disabled={zipBusy}>{zipBusy ? 'Preparing…' : 'Download all (zip)'}</button>
      </div>

      <div className="overflow-auto border border-[#E5DFD3] rounded-lg max-h-[calc(100vh-330px)] min-h-[220px]">
        <table className="border-separate border-spacing-0 w-max min-w-full text-[12.5px]" data-testid="er-grid">
          <thead>
            <tr>
              {table.fields.map(field => {
                const isKey = field === table.primary_key;
                const isFk = foreignKeys.has(field);
                return (
                  <th key={field} className="sticky top-0 z-[1] bg-[#EFEAE0] text-left px-3 py-1.5 border-b border-[#E5DFD3] whitespace-nowrap font-semibold">
                    {isKey && <span className="text-[9px] font-extrabold mr-1.5 px-1.5 py-px rounded bg-white text-[#6B6557] border border-[#E5DFD3]">PK</span>}
                    {isFk && <span className="text-[9px] font-extrabold mr-1.5 px-1.5 py-px rounded bg-white text-indigo-600 border border-indigo-600">FK</span>}
                    {field}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shown.map((record, rowIndex) => {
              const isHit = highlight !== null && String(record[table.primary_key]) === highlight;
              return (
                <tr key={rowIndex} ref={isHit ? highlighted : undefined} data-hit={isHit ? 'true' : undefined} className={isHit ? 'bg-indigo-50' : 'hover:bg-[#F6F2EA]'}>
                  {table.fields.map(field => {
                    const value = record[field];
                    const fk = foreignKeys.get(field);
                    const cell = 'px-3 py-1 border-b border-[#E5DFD3] whitespace-nowrap';
                    if (value === null || value === undefined) return <td key={field} className={`${cell} text-[#6B6557]`}>—</td>;
                    if (fk) {
                      const parent = fk.references.split('.')[0];
                      return (
                        <td key={field} className={cell}>
                          <button type="button" title={`Open ${String(value)} in ${parent}`} onClick={() => onJump(parent, String(value), name)} className="text-indigo-600 font-semibold underline decoration-dotted hover:decoration-solid cursor-pointer">
                            {String(value)}
                          </button>
                        </td>
                      );
                    }
                    return (
                      <td key={field} className={`${cell} ${field === table.primary_key ? 'font-bold' : ''} ${typeof value === 'number' ? 'text-right tabular-nums' : ''}`}>
                        {String(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-[#6B6557] mt-2" data-testid="er-data-note">
        {`Showing ${shown.length.toLocaleString()} of ${matching.length.toLocaleString()} rows${filter.trim() ? ' matching' : ''}. Primary key: ${table.primary_key}.`}
        {table.foreign_keys.length > 0 && ` Foreign keys: ${table.foreign_keys.map(f => `${f.column} → ${f.references}`).join(', ')}. Click a foreign-key value to open its parent row.`}
      </p>
    </div>
  );
}
