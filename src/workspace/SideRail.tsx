import { ChevronLeft, ChevronRight, FlaskConical, Layers } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';

/** The left rail: Home and Canvas. It is collapsed by default; the small tab at the left edge opens it. */
export function SideRail({ onHome }: { onHome: () => void }) {
  const { sidebarCollapsed, setSidebarCollapsed } = useWorkspace();
  return (
    <>
      <aside
        className={`${
          sidebarCollapsed ? 'w-0 min-w-0 opacity-0 overflow-hidden pointer-events-none' : 'w-[64px] min-w-[64px]'
        } bg-white text-[#0B0B0C] border-r border-[#D3D2CE] flex flex-col items-center py-2 justify-between z-10 transition-all duration-300 relative shrink-0`}
      >
        <div className="flex flex-col items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            title="Hide side panel"
            aria-label="Hide side panel"
            className="w-full h-6 flex items-center justify-center text-[#0B0B0C]/60 hover:text-[#E31837] transition-colors cursor-pointer border-b border-[#0B0B0C]/10 focus-techm"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onHome}
            title="Back to the ModelOS Source home page"
            aria-label="Front Page"
            className="w-full h-11 flex flex-col items-center justify-center relative focus-techm transition-colors cursor-pointer text-[#0B0B0C]/65 hover:text-[#0B0B0C] hover:bg-[#0B0B0C]/5"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="wb-cap text-[9px] mt-0.5">Home</span>
          </button>
          <div className="w-8 h-px bg-[#0B0B0C]/10 my-0.5" />

          <button
            type="button"
            title="Workbench: scenario, schema and data generation"
            aria-label="Workbench"
            aria-current="page"
            className="w-full h-12 flex flex-col items-center justify-center relative focus-techm transition-colors cursor-pointer text-[#0B0B0C] bg-[#0B0B0C]/5"
          >
            <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#E31837]" />
            <Layers className="w-5 h-5" />
            <span className="wb-cap text-[9px] mt-0.5">Canvas</span>
          </button>
        </div>
      </aside>

      {sidebarCollapsed && (
        <div className="z-20 self-center relative flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            title="Show side navigation"
            aria-label="Show side navigation"
            className="h-14 w-4 bg-white border border-l-0 border-[#D3D2CE] rounded-r-xs flex items-center justify-center text-[#0B0B0C] hover:text-[#E31837] transition-colors cursor-pointer focus-techm"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
