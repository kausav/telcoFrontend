import React, { useState } from 'react';
import { ArrowLeft, Copy, Download, FileSpreadsheet, Play, Search, X } from 'lucide-react';
import { CONTRACTS_CATALOG, type ContractItem } from './data/contractsCatalog';

export function ContractsView({
  onBack,
  onLoadContract,
  showToast
}: {
  onBack: () => void;
  onLoadContract: (contract: ContractItem) => void;
  showToast: (msg: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>('c1');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [contractTab, setContractTab] = useState<'fields' | 'pydantic' | 'json'>('fields');

  const selectedContract = CONTRACTS_CATALOG.find(c => c.id === selectedId) || CONTRACTS_CATALOG[0];

  const filteredContracts = CONTRACTS_CATALOG.filter(c => {
    if (filterDomain !== 'all' && c.domain !== filterDomain) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.standard.toLowerCase().includes(q);
    }
    return true;
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
            <FileSpreadsheet className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-semibold text-[#0B0B0C] uppercase tracking-wider">
              Enterprise Schema Contracts Repository
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-emerald-50 text-[#247153] border border-emerald-200">
            5 Verified Contracts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exported all 5 schema contracts as ZIP')}
            className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#0B0B0C] hover:border-[#0B0B0C] font-medium flex items-center gap-1.5 "
          >
            <Download className="w-3 h-3" />
            <span>Export Catalog</span>
          </button>
        </div>
      </div>

      {/* 2-Column Body */}
      <div className="flex-1 grid grid-cols-12 gap-2 pt-2 overflow-hidden">
        {/* Left Column: Contracts List (Span 5) */}
        <section className="col-span-5 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs  overflow-hidden">
          <div className="p-2.5 border-b border-[#D3D2CE] space-y-2 bg-[#F1F0EC]/40">
            <div className="flex items-center bg-white border border-[#D3D2CE] rounded-xs px-2 py-1 text-xs">
              <Search className="w-3.5 h-3.5 text-[#4A4A48] mr-1.5 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search contracts by name, standard, or code..."
                className="bg-transparent text-xs text-[#0B0B0C] w-full outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} aria-label="Clear contract search" className="text-[#4A4A48]">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {['all', 'telecom', 'bfsi', 'healthcare', 'manufacturing'].map(dom => (
                <button
                  key={dom}
                  onClick={() => setFilterDomain(dom)}
                  className={`text-[11px] px-2 py-0.5 rounded-xs border transition-colors capitalize ${
                    filterDomain === dom
                      ? 'bg-[#0B0B0C] text-white border-[#0B0B0C]'
                      : 'bg-white border-[#D3D2CE] text-[#4A4A48] hover:border-[#0B0B0C]'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredContracts.map(c => {
              const isSelected = selectedContract.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-2.5 rounded-xs border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F1F0EC] border-[#0B0B0C] '
                      : 'bg-white border-[#D3D2CE] hover:border-[#4A4A48]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-[#E31837]">{c.code}</span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-xs border ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-[#247153] border-emerald-200'
                          : c.status === 'CERTIFIED'
                          ? 'bg-blue-50 text-[#185F8D] border-blue-200'
                          : 'bg-amber-50 text-[#8A5200] border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-[#0B0B0C] leading-tight mb-1">{c.title}</h3>
                  <div className="flex items-center justify-between text-[11px] text-[#4A4A48]">
                    <span className="truncate">{c.standard}</span>
                    <span className="font-mono shrink-0">{c.fieldCount} fields</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Contract Inspector & Code Preview (Span 7) */}
        <section className="col-span-7 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs  overflow-hidden">
          {/* Inspector Header */}
          <div className="p-3 border-b border-[#D3D2CE] bg-[#F1F0EC]/40 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#0B0B0C]">{selectedContract.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-white border border-[#D3D2CE] text-[#4A4A48]">
                  {selectedContract.version}
                </span>
              </div>
              <p className="text-xs text-[#4A4A48] leading-tight mb-1.5">{selectedContract.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-[#4A4A48] font-mono">
                <span>Standard: <strong>{selectedContract.standard}</strong></span>
                <span>Checksum: <code>{selectedContract.checksum}</code></span>
              </div>
            </div>

            <button
              onClick={() => onLoadContract(selectedContract)}
              className="px-3 py-1.5 bg-[#E31837] hover:bg-[#C8102E] text-white rounded-xs font-medium text-xs flex items-center gap-1.5  focus-techm transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Load into Canvas</span>
            </button>
          </div>

          {/* Sub-view Tab Switcher */}
          <div className="h-9 min-h-9 px-3 border-b border-[#D3D2CE] flex items-center justify-between bg-white">
            <div className="flex items-center gap-1 bg-[#F1F0EC] p-0.5 rounded-xs border border-[#D3D2CE]">
              <button
                onClick={() => setContractTab('fields')}
                className={`px-2.5 py-0.5 text-xs rounded-xs transition-colors ${
                  contractTab === 'fields' ? 'bg-white text-[#0B0B0C] font-semibold ' : 'text-[#4A4A48]'
                }`}
              >
                Field Specifications ({selectedContract.fields.length})
              </button>
              <button
                onClick={() => setContractTab('pydantic')}
                className={`px-2.5 py-0.5 text-xs rounded-xs transition-colors ${
                  contractTab === 'pydantic' ? 'bg-white text-[#0B0B0C] font-semibold ' : 'text-[#4A4A48]'
                }`}
              >
                Pydantic v2 Model
              </button>
              <button
                onClick={() => setContractTab('json')}
                className={`px-2.5 py-0.5 text-xs rounded-xs transition-colors ${
                  contractTab === 'json' ? 'bg-white text-[#0B0B0C] font-semibold ' : 'text-[#4A4A48]'
                }`}
              >
                JSON Schema Spec
              </button>
            </div>

            <button
              onClick={() => showToast(`Copied ${selectedContract.code} schema to clipboard`)}
              className="text-xs text-[#4A4A48] hover:text-[#0B0B0C] flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Schema</span>
            </button>
          </div>

          {/* Inspector Body Content */}
          <div className="flex-1 overflow-y-auto p-3 text-xs">
            {contractTab === 'fields' && (
              <div className="border border-[#D3D2CE] rounded-xs overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F1F0EC] text-[#4A4A48] border-b border-[#D3D2CE] text-[11px] font-semibold">
                    <tr>
                      <th className="p-2">Field Name</th>
                      <th className="p-2">Physical Type</th>
                      <th className="p-2">Constraints & Bounds</th>
                      <th className="p-2">Sensitivity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D3D2CE] font-mono text-[11px]">
                    {selectedContract.fields.map(f => (
                      <tr key={f.name} className="hover:bg-[#F1F0EC]/40">
                        <td className="p-2 font-semibold text-[#0B0B0C]">{f.name}</td>
                        <td className="p-2 text-[#4A4A48]">{f.type}</td>
                        <td className="p-2 text-[#0B0B0C]">{f.constraints}</td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded-xs text-[10px] font-sans ${
                              f.sensitivity.includes('PII')
                                ? 'bg-red-50 text-[#9C1936] border border-red-200'
                                : f.sensitivity.includes('Financial')
                                ? 'bg-amber-50 text-[#8A5200] border border-amber-200'
                                : 'bg-gray-50 text-[#4A4A48] border border-gray-200'
                            }`}
                          >
                            {f.sensitivity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {contractTab === 'pydantic' && (
              <pre className="p-3 bg-[#0B0B0C] text-emerald-400 rounded-xs font-mono text-xs leading-relaxed overflow-x-auto">
                {selectedContract.pydanticCode}
              </pre>
            )}

            {contractTab === 'json' && (
              <pre className="p-3 bg-[#0B0B0C] text-blue-300 rounded-xs font-mono text-xs leading-relaxed overflow-x-auto">
                {JSON.stringify(
                  {
                    $schema: 'https://json-schema.org/draft/2020-12/schema',
                    title: selectedContract.title,
                    type: 'object',
                    standard: selectedContract.standard,
                    version: selectedContract.version,
                    properties: selectedContract.fields.reduce((acc, f) => {
                      acc[f.name] = { type: f.type, constraints: f.constraints, sensitivity: f.sensitivity };
                      return acc;
                    }, {} as Record<string, any>)
                  },
                  null,
                  2
                )}
              </pre>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// 2. DKP MANAGER VIEW
