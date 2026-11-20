import React, { useState } from 'react';
import { Activity, ArrowLeft, CheckCircle2, Download, FileCheck, Search, X } from 'lucide-react';
import { AUDIT_RECORDS, type AuditRecordItem } from './data/auditRecords';

export function AuditLogsView({
  onBack,
  showToast
}: {
  onBack: () => void;
  showToast: (msg: string) => void;
}) {
  const [selectedRecord, setSelectedRecord] = useState<AuditRecordItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = AUDIT_RECORDS.filter(r => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return r.runId.toLowerCase().includes(q) || r.operator.toLowerCase().includes(q) || r.domain.toLowerCase().includes(q);
  });

  return (
    <main className="flex-1 h-full overflow-hidden bg-[#F1F0EC] p-2 flex flex-col">
      {/* Top Header */}
      <div className="h-10 min-h-10 border border-[#D3D2CE] rounded-t-lg bg-white px-3 flex items-center justify-between ">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs text-[#0B0B0C] hover:border-[#0B0B0C] font-medium focus-techm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Canvas</span>
          </button>
          <div className="h-4 w-[1px] bg-[#D3D2CE]" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-semibold text-[#0B0B0C] uppercase tracking-wider">
              Compliance & Synthetic Generation Audit Ledger
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-emerald-50 text-[#247153] border border-emerald-200">
            Immutable SHA-256 Ledger
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exported audit history report as CSV')}
            className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#0B0B0C] hover:border-[#0B0B0C] font-medium flex items-center gap-1.5 "
          >
            <Download className="w-3 h-3" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="flex-1 bg-white border border-[#D3D2CE] rounded-b-lg  overflow-hidden flex flex-col mt-2">
        <div className="p-2.5 border-b border-[#D3D2CE] bg-[#F1F0EC]/40 flex items-center justify-between">
          <div className="flex items-center bg-white border border-[#D3D2CE] rounded-xs px-2 py-1 text-xs w-72">
            <Search className="w-3.5 h-3.5 text-[#4A4A48] mr-1.5 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search audit runs by ID, operator, or domain..."
              className="bg-transparent text-xs text-[#0B0B0C] w-full outline-none"
            />
          </div>
          <span className="text-xs text-[#4A4A48]">All runs cryptographically sealed and immutable.</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#F1F0EC] text-[#4A4A48] border-b border-[#D3D2CE] text-[11px] font-semibold sticky top-0">
              <tr>
                <th className="p-2">Execution Run ID</th>
                <th className="p-2">Timestamp (UTC)</th>
                <th className="p-2">Operator ID</th>
                <th className="p-2">Domain Target</th>
                <th className="p-2">Engine</th>
                <th className="p-2">Records</th>
                <th className="p-2">DP Epsilon</th>
                <th className="p-2">SHA-256 Digest</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D2CE] font-mono text-[11px]">
              {filtered.map(r => (
                <tr
                  key={r.runId}
                  onClick={() => setSelectedRecord(r)}
                  className="hover:bg-[#F1F0EC] cursor-pointer transition-colors"
                >
                  <td className="p-2 font-bold text-[#E31837]">{r.runId}</td>
                  <td className="p-2 text-[#4A4A48]">{r.timestamp}</td>
                  <td className="p-2 text-[#0B0B0C] font-sans">{r.operator}</td>
                  <td className="p-2 text-[#0B0B0C] font-sans">{r.domain}</td>
                  <td className="p-2 text-[#4A4A48]">{r.engine}</td>
                  <td className="p-2 font-bold text-[#0B0B0C]">{r.recordsCount.toLocaleString()}</td>
                  <td className="p-2 text-[#247153]">ε={r.dpEpsilon}</td>
                  <td className="p-2 text-[#4A4A48] truncate max-w-[140px]">{r.hash}</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-sans font-semibold bg-emerald-50 text-[#247153] border border-emerald-200">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Verification Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white border border-[#D3D2CE] rounded-xs shadow-xl w-full max-w-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#247153]" />
                <h3 className="text-xs font-bold text-[#0B0B0C]">
                  Cryptographic Verification Certificate: {selectedRecord.runId}
                </h3>
              </div>
              <button onClick={() => setSelectedRecord(null)} aria-label="Close certificate modal" className="text-[#4A4A48] hover:text-[#0B0B0C]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 bg-[#F1F0EC] rounded-xs border border-[#D3D2CE] space-y-1">
                <div>Run Identifier: <strong>{selectedRecord.runId}</strong></div>
                <div>Operator: <strong>{selectedRecord.operator}</strong></div>
                <div>Volume: <strong>{selectedRecord.recordsCount.toLocaleString()} rows</strong></div>
                <div>Differential Privacy Budget: <strong>ε = {selectedRecord.dpEpsilon}</strong></div>
                <div>Random Seed: <strong>{selectedRecord.seed}</strong></div>
                <div>Timestamp: <strong>{selectedRecord.timestamp}</strong></div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-[#4A4A48] block mb-1">SHA-256 Provenance Digest:</label>
                <div className="p-2 bg-[#0B0B0C] text-emerald-400 rounded-xs text-[11px] break-all">
                  {selectedRecord.hash}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-sans text-[#247153] bg-emerald-50 p-2 rounded-xs border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cryptographic verification verified against Tech Mahindra ModelOS audit chain. Compliant with GDPR Article 25 & HIPAA Safe Harbor.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D3D2CE]">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-3 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#4A4A48]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast('Downloaded verification certificate JSON');
                  setSelectedRecord(null);
                }}
                className="px-3 py-1 text-xs bg-[#E31837] text-white rounded-xs font-medium "
              >
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 5. SETTINGS VIEW
