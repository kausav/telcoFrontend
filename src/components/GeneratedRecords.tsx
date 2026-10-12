import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, FileJson, Search } from 'lucide-react';
import type { ScenarioGenerateResponse } from '../api/types';
import { notify } from '../lib/notify';

type AnyRecord = Record<string, any>;

interface GeneratedRecordsProps {
  result: ScenarioGenerateResponse;
}

const fmtCell = (val: unknown): string => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const matchesQuery = (record: AnyRecord, q: string, skipKey?: string): boolean =>
  Object.entries(record ?? {}).some(([key, val]) => {
    if (key === skipKey) return false;
    return key.toLowerCase().includes(q) || String(val ?? '').toLowerCase().includes(q);
  });

/** The records returned by POST /scenario/generate: one expandable block per user (transactional) or one table (aggregational). */
export const GeneratedRecords: React.FC<GeneratedRecordsProps> = ({ result }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<AnyRecord | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  const allRecords: AnyRecord[] = Array.isArray(result.records) ? result.records : [];
  const isTransactional = result.typeOfData === 'transactional';
  const recordsPerUser = Number(result.recordsPerUser ?? 10) || 10;
  const fields: string[] = result.fields ?? [];

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allRecords;
    return allRecords.filter(row => {
      if (!row || typeof row !== 'object') return false;
      if (!isTransactional) return matchesQuery(row, q);
      const history: AnyRecord[] = Array.isArray(row.records) ? row.records : [];
      return matchesQuery(row, q, 'records') || history.some(record => matchesQuery(record, q));
    });
  }, [allRecords, searchQuery, isTransactional]);

  return (
    <div className="space-y-3">
      {result.errors?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-800">{result.errors.length} generation error(s)</p>
            {result.errors.slice(0, 3).map((error: unknown, i: number) => (
              <p key={i} className="text-[11px] text-amber-700 break-words">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* The scroll areas below are sized to the visible pane, so their scroll bars stay on screen instead of sitting below the fold */}
      <div className="bg-white rounded-md border border-[#E5DFD3] shadow-2xs overflow-hidden">
        {/* Toolbar: search (downloads are in the right-hand panel) */}
        <div className="p-2.5 border-b border-[#E5DFD3] bg-[#F6F2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-[#4D4D4F] shrink-0" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white border border-[#E5DFD3] rounded px-2.5 py-1 text-xs text-[#29251D] focus-techm w-52"
            />
            <span className="text-[11px] text-[#4D4D4F] font-mono tabular-nums whitespace-nowrap">
              {isTransactional
                ? `${filteredRecords.length.toLocaleString()} / ${allRecords.length.toLocaleString()} users`
                : `${filteredRecords.length.toLocaleString()} / ${allRecords.length.toLocaleString()} rows`}
            </span>
          </div>
        </div>

        {isTransactional ? (
          /* Transactional: one expandable block per user, with that user's history inside */
          <div className="p-2.5 space-y-2 overflow-y-auto max-h-[max(240px,calc(100vh-360px))]">
            {filteredRecords.length === 0 && (
              <div className="text-xs text-[#4D4D4F] italic p-3 rounded-md border border-[#E5DFD3] bg-[#F6F2EA]/40">
                No user records match the current search.
              </div>
            )}

            {filteredRecords.map((entity, entityIdx) => {
              const keyValue = result.entityKey ? entity?.[result.entityKey] : undefined;
              const userKey = String(
                keyValue ??
                  entity?.subscriber_id ??
                  entity?.customer_id ??
                  entity?.entity_key ??
                  entity?.entityKey ??
                  entity?.account_id ??
                  `USER_${entityIdx + 1}`,
              );
              const history: AnyRecord[] = Array.isArray(entity?.records) ? entity.records : [];
              const entityFields = Object.entries(entity ?? {}).filter(([key]) => key !== 'records');
              const expanded = expandedUsers[userKey] ?? false;
              const historyFields = expanded ? Array.from(new Set(history.flatMap(record => Object.keys(record ?? {})))) : [];

              return (
                <div key={`${userKey}_${entityIdx}`} className="rounded-md border border-[#E5DFD3] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedUsers(prev => ({ ...prev, [userKey]: !prev[userKey] }))}
                    className="w-full px-3 py-2 bg-[#F6F2EA]/60 hover:bg-[#F6F2EA] text-left flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#4D4D4F] shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#4D4D4F] shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-[#29251D] truncate font-mono">{userKey}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#E31837] shrink-0">
                      {history.length} history record{history.length === 1 ? '' : 's'}
                    </span>
                  </button>

                  {expanded && (
                    <div className="bg-white p-2.5 space-y-2.5">
                      {entityFields.length > 0 && (
                        <div className="rounded-md border border-[#E5DFD3] bg-[#F6F2EA]/40 p-2.5">
                          <p className="text-[11px] font-semibold text-[#29251D] mb-1.5">User Details</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                            {entityFields.map(([key, value]) => (
                              <div key={`${userKey}_${key}`} className="rounded border border-[#E5DFD3] bg-white px-2 py-1.5 min-w-0">
                                <p className="text-[10px] text-[#4D4D4F] truncate" title={key}>{key}</p>
                                <p className="text-[11px] font-mono text-[#29251D] mt-0.5 truncate" title={fmtCell(value)}>{fmtCell(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="rounded-md border border-[#E5DFD3] bg-white overflow-hidden">
                        <div className="px-2.5 py-1.5 bg-[#F6F2EA]/60 border-b border-[#E5DFD3]">
                          <p className="text-[11px] font-semibold text-[#29251D]">Recent History</p>
                          <p className="text-[10px] text-[#4D4D4F]">Showing up to {recordsPerUser} records for this user</p>
                        </div>

                        {history.length === 0 ? (
                          <p className="text-[11px] text-[#4D4D4F] italic p-2.5">No history records available for this user.</p>
                        ) : (
                          <div className="overflow-auto max-h-[max(200px,calc(100vh-520px))]">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-[#F6F2EA] text-[#4D4D4F] border-b border-[#E5DFD3] sticky top-0 z-20">
                                <tr>
                                  <th className="px-2 py-1.5 sticky left-0 bg-[#F6F2EA] z-10">#</th>
                                  {historyFields.map(field => (
                                    <th key={`${userKey}_${field}`} className="px-2 py-1.5 font-mono whitespace-nowrap">
                                      {field}
                                    </th>
                                  ))}
                                  <th className="px-2 py-1.5">JSON</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5DFD3] font-mono text-[#29251D]">
                                {history.map((record, recIdx) => (
                                  <tr key={`${userKey}__record_${recIdx}`} className="hover:bg-[#F6F2EA]/40 transition-colors">
                                    <td className="px-2 py-1.5 text-[#4D4D4F] font-bold sticky left-0 bg-white">#{recIdx + 1}</td>
                                    {historyFields.map(field => {
                                      const value = record?.[field];
                                      const isNull = value === null || value === undefined;
                                      return (
                                        <td
                                          key={`${userKey}__record_${recIdx}_${field}`}
                                          title={fmtCell(value)}
                                          className={`px-2 py-1.5 whitespace-nowrap max-w-[260px] truncate ${isNull ? 'text-[#8E8B82] italic' : ''}`}
                                        >
                                          {fmtCell(value)}
                                        </td>
                                      );
                                    })}
                                    <td className="px-2 py-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedRow(record)}
                                        className="px-2 py-0.5 rounded bg-[#29251D] text-white hover:bg-[#E31837] text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                                      >
                                        <FileJson className="w-3 h-3 text-amber-300" />
                                        View
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Aggregational: one table, one row per record */
          <div className="overflow-auto max-h-[max(240px,calc(100vh-360px))]">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#F6F2EA] text-[#4D4D4F] border-b border-[#E5DFD3] sticky top-0 z-20">
                <tr>
                  <th className="p-2 sticky left-0 bg-[#F6F2EA] z-10">#</th>
                  {fields.map(f => (
                    <th key={f} className="p-2 font-mono whitespace-nowrap">
                      {f}
                    </th>
                  ))}
                  <th className="p-2">JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3] font-mono text-[#29251D]">
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={fields.length + 2} className="p-3 text-xs text-[#4D4D4F] italic font-sans">
                      No rows match the current search.
                    </td>
                  </tr>
                )}
                {filteredRecords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F6F2EA]/40 transition-colors">
                    <td className="p-2 text-[#4D4D4F] font-bold sticky left-0 bg-white">#{idx + 1}</td>
                    {fields.map(f => {
                      const val = row?.[f];
                      const isNull = val === null || val === undefined;
                      return (
                        <td key={f} title={fmtCell(val)} className={`p-2 whitespace-nowrap max-w-[260px] truncate ${isNull ? 'text-[#8E8B82] italic' : ''}`}>
                          {fmtCell(val)}
                        </td>
                      );
                    })}
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className="px-2 py-0.5 rounded bg-[#29251D] text-white hover:bg-[#E31837] text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileJson className="w-3 h-3 text-amber-300" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row JSON modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1E1B18] text-white rounded-lg border border-white/20 w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#29251D]">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-[#E31837]" />
                <h3 className="text-sm font-bold text-white">Record JSON</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(JSON.stringify(selectedRow, null, 2))
                      .then(() => notify('Record copied to the clipboard.', 'success'))
                      .catch(() => notify('Could not copy the record.', 'error'));
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-mono text-amber-300 rounded border border-white/10 transition-colors cursor-pointer"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
                  className="px-3 py-1 bg-[#E31837] hover:bg-red-700 text-xs font-bold text-white rounded transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs text-amber-200/90 bg-[#12100E] leading-relaxed">
              <pre className="whitespace-pre-wrap">{JSON.stringify(selectedRow, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
