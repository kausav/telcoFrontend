import React from 'react';

export interface StepIntroProps {
  /** Which of the four choices of Step 1 are made, in order: industry, use case, customer journey, type of data. */
  done: [boolean, boolean, boolean, boolean];
}

const ITEMS = ['Industry', 'Use case', 'Customer journey', 'Type of data'];

/** The dark side panel of Step 1: what this step is for, and how far along the person is. Hidden on narrow screens. */
export const StepIntro: React.FC<StepIntroProps> = ({ done }) => {
  const count = done.filter(Boolean).length;
  return (
    <aside className="wb-pane hidden lg:flex lg:col-span-2 2xl:col-span-3 h-full min-h-0 flex-col justify-between bg-[#0B0B0C] text-[#F1F0EC] rounded-xs p-4 overflow-hidden">
      <div>
        <p className="wb-cap text-[#F1F0EC]/60 flex items-center gap-2">
          <i className="inline-block w-[7px] h-[7px] bg-[#E31837]" aria-hidden="true" />
          Step 01 of 03
        </p>
        <h2 className="mt-3 font-medium tracking-[-0.012em] leading-[1.05] text-[clamp(22px,2.1vw,30px)]">
          Choose the industry and the story behind your data.
        </h2>
        <p className="wb-tall-only mt-3 text-[13px] leading-relaxed text-[#F1F0EC]/60">
          Pick a use case and a customer journey, then let us propose the schema for it, or upload a schema of your own.
        </p>
      </div>
      <div>
        <p className="wb-cap text-[#F1F0EC]/60 flex items-center justify-between">
          <span>Progress</span>
          <span className="text-[#F1F0EC]">{count} / 4</span>
        </p>
        <ol className="mt-2 border-t border-[#F1F0EC]/15">
          {ITEMS.map((label, i) => (
            <li key={label} className="flex items-center justify-between py-2 border-b border-[#F1F0EC]/15 text-[13px]">
              <span className="flex items-center gap-3">
                <span className="wb-cap text-[#F1F0EC]/50">{String(i + 1).padStart(2, '0')}</span>
                <span className={done[i] ? 'text-[#F1F0EC]' : 'text-[#F1F0EC]/55'}>{label}</span>
              </span>
              <i className={`inline-block w-[7px] h-[7px] transition-colors duration-500 ${done[i] ? 'bg-[#E31837]' : 'bg-[#F1F0EC]/20'}`} aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
};
