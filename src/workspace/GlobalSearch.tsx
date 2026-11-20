import { Search } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';

export function GlobalSearch() {
  const {
    fields,
    globalSearchOpen,
    globalSearchTerm,
    setActiveTab,
    setGlobalSearchOpen,
    setGlobalSearchTerm,
    setSelectedFieldId,
  } = useWorkspace();
  if (!globalSearchOpen) return null;
  return (
    <div
      onClick={() => setGlobalSearchOpen(false)}
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-24 backdrop-blur-2xs"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white border border-[#D3D2CE] rounded-xs shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-100"
      >
        <div className="p-3 border-b border-[#D3D2CE] flex items-center gap-2">
          <Search className="w-4 h-4 text-[#4A4A48]" />
          <input
            type="text"
            autoFocus
            value={globalSearchTerm}
            onChange={e => setGlobalSearchTerm(e.target.value)}
            placeholder="Search contract fields..."
            className="w-full text-xs text-[#0B0B0C] outline-none"
          />
          <kbd className="text-[10px] font-mono bg-[#F1F0EC] text-[#4A4A48] border border-[#D3D2CE] px-1.5 py-0.5 rounded-xs">
            ESC
          </kbd>
        </div>

        <div className="p-2 max-h-64 overflow-y-auto text-xs divide-y divide-[#D3D2CE]">
          {/* DISABLED: fixed list of standards (static data)
          <div className="py-1">
            <div className="text-[10px] uppercase font-mono text-[#4A4A48] px-2 py-1">Standards Reference</div>
            {['TMF 622 Product Ordering', 'TMF 638 Service Inventory', '3GPP TS 32.298 5G CDR', 'BIAN v10 Payments', 'HL7 FHIR Patient']
              .filter(s => s.toLowerCase().includes(globalSearchTerm.toLowerCase()))
              .map(item => (
                <button
                  key={item}
                  onClick={() => {
                    setGlobalSearchOpen(false);
                    showToast(`Selected standard: ${item}`);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-xs hover:bg-[#F1F0EC] flex items-center justify-between text-[#0B0B0C]"
                >
                  <span>{item}</span>
                  <ChevronRight className="w-3 h-3 text-[#4A4A48]" />
                </button>
              ))}
          </div>
          */}

          <div className="py-1">
            <div className="text-[10px] uppercase font-mono text-[#4A4A48] px-2 py-1">Fields in Contract</div>
            {fields
              .filter(f => f.name.toLowerCase().includes(globalSearchTerm.toLowerCase()))
              .map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setGlobalSearchOpen(false);
                    setSelectedFieldId(f.id);
                    setActiveTab('table');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-xs hover:bg-[#F1F0EC] flex items-center justify-between font-mono"
                >
                  <span className="font-semibold text-[#0B0B0C]">{f.name}</span>
                  <span className="text-[#4A4A48] text-[11px]">{f.physicalType}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
