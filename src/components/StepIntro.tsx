import React from 'react';

export interface StepIntroItem {
  label: string;
  done: boolean;
}

/**
 * The dark panel beside step 1, the workspace's counterpart to the landing page's dark sections:
 * a big headline, one line of guidance and a checklist that fills in as the choices on the right are made.
 */
export const StepIntro: React.FC<{ items: StepIntroItem[] }> = ({ items }) => {
  const done = items.filter(item => item.done).length;
  return (
    <aside className="wb-pane hidden lg:flex lg:col-span-2 2xl:col-span-3 h-full flex-col justify-between bg-[#0B0B0C] text-[#F1F0EC] rounded-xs p-4 overflow-hidden relative">
      <div>
        <p className="wb-cap text-[#F1F0EC]/60">Step 01 of 03</p>
        <h2 className="mt-4 text-[clamp(22px,2.1vw,30px)] font-medium leading-[1.08] tracking-[-0.035em]">
          Choose the industry and the story behind your data.
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-[#F1F0EC]/62 wb-tall-only">
          Pick a domain, a use case and a customer journey. Next you review the schema we propose, or bring your own CSV,
          and then generate.
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between border-t border-[#F1F0EC]/13 pt-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#F1F0EC]/40">Progress</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#F1F0EC]/60">
            {done} / {items.length}
          </span>
        </div>
        <ol className="mt-1">
          {items.map((item, i) => (
            <li
              key={item.label}
              className={`flex items-center gap-3 py-2 border-b border-[#F1F0EC]/13 transition-colors ${
                item.done ? 'text-[#F1F0EC]' : 'text-[#F1F0EC]/40'
              }`}
            >
              <span className="font-mono text-[11px] tracking-[0.06em] w-5">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-[13px] tracking-[-0.01em]">{item.label}</span>
              <span
                aria-hidden="true"
                className={`w-2 h-2 transition-all duration-500 ${item.done ? 'bg-[#E31837] scale-100' : 'bg-transparent border border-[#F1F0EC]/30 scale-90'}`}
              />
              <span className="sr-only">{item.done ? 'done' : 'not done yet'}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
};
