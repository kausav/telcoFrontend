import React from 'react';
import { Check, Lock } from 'lucide-react';
import { BrandHeader } from '../components/BrandHeader';
import { useWorkspace } from './WorkspaceProvider';

export function WorkspaceHeader() {
  const {
    maxUnlockedStep,
    setMaxUnlockedStep,
    setWorkflowStep,
    showToast,
    workflowStep,
  } = useWorkspace();
  return (
    <header className="h-12 min-h-12 bg-white text-[#0B0B0C] border-b border-[#D3D2CE] px-3 sm:px-4 flex items-center gap-2 sm:gap-4 z-20">
      <h1 className="sr-only">ModelOS Source - Synthetic Data Generator</h1>
      <BrandHeader />

      <nav aria-label="Workflow" className="flex items-stretch self-stretch ml-1 sm:ml-4 min-w-0">
        {([
          { n: 1, label: 'Scenario' },
          { n: 2, label: 'Schema' },
          { n: 3, label: 'Generate' }
        ] as const).map((step, i) => {
          const unlocked = maxUnlockedStep >= step.n;
          const current = workflowStep === step.n;
          const done = maxUnlockedStep > step.n;
          return (
            <React.Fragment key={step.n}>
              {i > 0 && <span className="hidden md:block self-center w-5 lg:w-8 h-px bg-[#0B0B0C]/15" aria-hidden="true" />}
              <button
                type="button"
                onClick={() => {
                  if (unlocked) setWorkflowStep(step.n);
                  else showToast(step.n === 2 ? 'Choose a scenario and continue to the schema first' : 'Approve the schema first');
                }}
                aria-current={current ? 'step' : undefined}
                aria-disabled={!unlocked}
                title={unlocked ? undefined : 'Locked until the earlier step is done'}
                className={`group relative px-2 sm:px-3 flex items-center gap-2 transition-colors focus-techm ${
                  unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                } ${current ? 'text-[#0B0B0C]' : unlocked ? 'text-[#0B0B0C]/65 hover:text-[#0B0B0C]' : 'text-[#0B0B0C]/35'}`}
              >
                <span className={`wb-cap ${current ? 'text-[#E31837]' : ''}`}>{String(step.n).padStart(2, '0')}</span>
                <span className="hidden sm:inline text-[14px] font-medium tracking-[-0.01em]">{step.label}</span>
                {!unlocked ? <Lock className="w-3 h-3" aria-hidden="true" /> : done ? <Check className="w-3.5 h-3.5 text-[#E31837]" aria-hidden="true" /> : null}
                <span
                  aria-hidden="true"
                  className={`absolute left-2 right-2 sm:left-3 sm:right-3 -bottom-px h-[2px] bg-[#E31837] origin-left transition-transform duration-500 ${current ? 'scale-x-100' : 'scale-x-0'}`}
                />
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3 shrink-0">
        <>
          {maxUnlockedStep > 1 && (
            <button
              type="button"
              onClick={() => {
                setMaxUnlockedStep(1);
                setWorkflowStep(1);
                showToast('Reset workflow to Step 1');
              }}
              className="wb-link text-[#0B0B0C]/70 hover:text-[#0B0B0C] focus-techm"
            >
              Reset steps
            </button>
          )}
          <span className="wb-cap text-[#0B0B0C]/55 hidden sm:inline">Step {workflowStep} of 3</span>
        </>
      </div>
    </header>
  );
}
