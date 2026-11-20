import React, { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';

export function SettingsView({
  onBack,
  showToast
}: {
  onBack: () => void;
  showToast: (msg: string) => void;
}) {
  const [duckdbMemory, setDuckdbMemory] = useState('4096');
  const [polarsThreads, setPolarsThreads] = useState('8');
  const [defaultEpsilon, setDefaultEpsilon] = useState('0.5');

  const handleSave = () => {
    showToast('Saved ModelOS engine settings.');
    onBack();
  };

  return (
    <main className="flex-1 h-full overflow-hidden bg-[#F1F0EC] p-2 flex flex-col">
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
            <Settings className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-semibold text-[#0B0B0C] uppercase tracking-wider">
              ModelOS Workbench Settings & Engine Configurations
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-[#D3D2CE] rounded-b-lg  p-4 max-w-xl space-y-4 text-xs mt-2 overflow-y-auto">
        <div>
          <label className="font-semibold text-[#0B0B0C] block mb-1">DuckDB Memory Limit (MB)</label>
          <input
            type="number"
            value={duckdbMemory}
            onChange={e => setDuckdbMemory(e.target.value)}
            className="w-full p-2 border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
          />
          <span className="text-[10px] text-[#4A4A48]">Max in-memory buffer allocated for high-speed DuckDB synthetic aggregation.</span>
        </div>

        <div>
          <label className="font-semibold text-[#0B0B0C] block mb-1">Polars Thread Pool Worker Count</label>
          <input
            type="number"
            value={polarsThreads}
            onChange={e => setPolarsThreads(e.target.value)}
            className="w-full p-2 border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
          />
          <span className="text-[10px] text-[#4A4A48]">Number of parallel Rayon worker threads for vectorized Parquet generation.</span>
        </div>

        <div>
          <label className="font-semibold text-[#0B0B0C] block mb-1">Default Differential Privacy Budget (ε)</label>
          <input
            type="number"
            step="0.1"
            value={defaultEpsilon}
            onChange={e => setDefaultEpsilon(e.target.value)}
            className="w-full p-2 border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
          />
          <span className="text-[10px] text-[#4A4A48]">Standard privacy noise parameter applied to continuous numerical telemetry.</span>
        </div>

        <div className="pt-2 border-t border-[#D3D2CE] flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#E31837] text-white rounded-xs font-medium  hover:bg-[#C8102E]"
          >
            Save Configurations
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-[#D3D2CE] rounded-xs text-[#4A4A48]"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}
