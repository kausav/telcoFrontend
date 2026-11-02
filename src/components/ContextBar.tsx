import React from 'react';

export interface ContextBarItem {
  label: string;
  value: string;
}

/**
 * The ink strip that tops the schema and generation steps: what was chosen on the first step, read-only,
 * with one way back to change it. It replaces the copy of the whole form that used to sit in a side column.
 */
export const ContextBar: React.FC<{ items: ContextBarItem[]; onEdit: () => void }> = ({ items, onEdit }) => (
  <div className="wb-pane col-span-12 bg-[#0B0B0C] text-[#F1F0EC] rounded-xs px-4 py-2 flex items-center gap-x-6 gap-y-2 flex-wrap">
    <span className="wb-cap text-[#F1F0EC]/60 mr-1">Your scenario</span>
    {items.map(item => (
      <div key={item.label} className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#F1F0EC]/40">{item.label}</p>
        <p className="text-[13px] font-medium tracking-[-0.01em] truncate max-w-[22ch]" title={item.value}>
          {item.value}
        </p>
      </div>
    ))}
    <button
      type="button"
      onClick={onEdit}
      className="wb-link ml-auto font-mono text-[11px] uppercase tracking-[0.06em] text-[#F1F0EC] hover:text-[#E31837] transition-colors cursor-pointer focus-techm"
    >
      Edit
    </button>
  </div>
);
