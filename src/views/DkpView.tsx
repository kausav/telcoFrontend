import React, { useState } from 'react';
import { ArrowLeft, Network, RefreshCw } from 'lucide-react';
import { DKP_PACKAGES } from './data/dkpPackages';

export function DkpView({
  onBack,
  onMount,
  showToast
}: {
  onBack: () => void;
  onMount: (pkgName: string) => void;
  showToast: (msg: string) => void;
}) {
  const [selectedPkgId, setSelectedPkgId] = useState<string>('dkp-1');
  const [isSyncing, setIsSyncing] = useState(false);

  const selectedPkg = DKP_PACKAGES.find(p => p.id === selectedPkgId) || DKP_PACKAGES[0];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Synced all Domain Knowledge Packages with upstream Git & SQLite repository.');
    }, 1200);
  };

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
            <Network className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-semibold text-[#0B0B0C] uppercase tracking-wider">
              Domain Knowledge Packages (DKP) & SID Ontology Engine
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-blue-50 text-[#185F8D] border border-blue-200">
            Vector Index: 15,560 Triples
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#0B0B0C] hover:border-[#0B0B0C] font-medium flex items-center gap-1.5  disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Git/SQLite...' : 'Sync Upstream'}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Body */}
      <div className="flex-1 grid grid-cols-12 gap-2 pt-2 overflow-hidden">
        {/* Left Column: DKP Packages List (Span 4) */}
        <section className="col-span-4 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs  overflow-hidden">
          <div className="p-2.5 border-b border-[#D3D2CE] bg-[#F1F0EC]/40">
            <span className="text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider">
              Installed Knowledge Packages
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {DKP_PACKAGES.map(pkg => {
              const isSelected = selectedPkg.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`p-3 rounded-xs border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F1F0EC] border-[#0B0B0C] '
                      : 'bg-white border-[#D3D2CE] hover:border-[#4A4A48]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-[#0B0B0C]">{pkg.name}</span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-xs border ${
                        pkg.status === 'SYNCED'
                          ? 'bg-emerald-50 text-[#247153] border-emerald-200'
                          : pkg.status === 'MOUNTED'
                          ? 'bg-blue-50 text-[#185F8D] border-blue-200'
                          : 'bg-gray-50 text-[#4A4A48] border-gray-200'
                      }`}
                    >
                      {pkg.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4A4A48] line-clamp-2 leading-tight mb-2">{pkg.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#4A4A48] font-mono pt-1 border-t border-[#D3D2CE]">
                    <span>{pkg.entitiesCount.toLocaleString()} Entities</span>
                    <span>{pkg.triplesCount.toLocaleString()} Triples</span>
                    <span>Sync: {pkg.lastSync}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Interactive Ontology Graph & Hierarchy Inspector (Span 8) */}
        <section className="col-span-8 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs  overflow-hidden">
          <div className="p-3 border-b border-[#D3D2CE] bg-[#F1F0EC]/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-xs font-bold text-[#0B0B0C]">{selectedPkg.name}</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white border border-[#D3D2CE] rounded-xs text-[#4A4A48]">
                  {selectedPkg.version}
                </span>
              </div>
              <p className="text-[11px] text-[#4A4A48]">{selectedPkg.description}</p>
            </div>

            <button
              onClick={() => onMount(selectedPkg.name)}
              className="px-3 py-1.5 bg-[#E31837] hover:bg-[#C8102E] text-white rounded-xs font-medium text-xs flex items-center gap-1.5  focus-techm transition-colors shrink-0"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Mount to Stage 1 Pipeline</span>
            </button>
          </div>

          {/* Interactive Graph Node Explorer */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider mb-2">
                Ontology Entity Relational Graph
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selectedPkg.ontologyNodes.map(node => (
                  <div key={node.name} className="p-2.5 rounded-xs border border-[#D3D2CE] bg-[#F1F0EC]/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold font-mono text-[#0B0B0C]">{node.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-white border border-[#D3D2CE] text-[#4A4A48]">
                        {node.category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-[#4A4A48] uppercase">Graph Predicates:</span>
                      {node.relationships.map(rel => (
                        <div key={rel} className="text-[11px] font-mono text-[#185F8D] bg-white px-2 py-0.5 rounded-xs border border-[#D3D2CE]">
                          ──&gt; {rel}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RAG Vector Embedding Index Stats */}
            <div className="p-3 rounded-xs border border-[#D3D2CE] bg-white space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0B0B0C]">
                <span>RAG Vector Similarity Sub-Schema Pruning</span>
                <span className="text-[#247153] font-mono">Cosine Threshold: 0.84</span>
              </div>
              <p className="text-[11px] text-[#4A4A48] leading-relaxed">
                When business input prompts are submitted, ModelOS queries this package's vector embeddings (FAISS/SQLite) to extract only the minimum sub-schema subtree, pruning 95% of irrelevant SID entities prior to LLM schema parameterization.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// 3. QUALITY GATES VIEW
