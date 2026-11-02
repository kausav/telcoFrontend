import React from 'react';

export interface ContextItem {
  label: string;
  value: string;
}

/** One slim line on Steps 2 and 3 that repeats the choices made in Step 1, with a way back to change them. */
export const ContextBar: React.FC<{ items: ContextItem[]; onEdit: () => void }> = ({ items, onEdit }) => (
  <div className="wb-pane col-span-12 bg-[#0B0B0C] text-[#F1F0EC] rounded-xs px-3 py-1.5 flex items-center gap-x-5 gap-y-1 flex-wrap min-h-9">
    <span className="wb-cap text-[#F1F0EC]/50 flex items-center gap-2">
      <i className="inline-block w-[6px] h-[6px] bg-[#E31837]" aria-hidden="true" />
      Your scenario
    </span>
    {items.map(item => (
      <span key={item.label} className="flex items-baseline gap-2 min-w-0">
        <span className="wb-cap text-[#F1F0EC]/45">{item.label}</span>
        <span className="text-[12px] font-medium truncate max-w-[22ch]" title={item.value}>{item.value}</span>
      </span>
    ))}
    <button type="button" onClick={onEdit} className="wb-link ml-auto text-[#F1F0EC]/75 hover:text-[#F1F0EC] focus-techm">
      Edit
    </button>
  </div>
);
