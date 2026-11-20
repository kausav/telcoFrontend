import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ChunkErrorBoundary } from '../components/ChunkErrorBoundary';
import { ContextBar } from '../components/ContextBar';
import { RouteFallback } from '../components/RouteFallback';
import { StepIntro } from '../components/StepIntro';
import { useWorkspace } from './WorkspaceProvider';

/** The canvas frame shared by the three steps. The step itself comes from the route (see App.tsx). */
export function Workbench() {
  const { workflowStep, maxUnlockedStep, contextItems, stepOneDone, setWorkflowStep } = useWorkspace();
  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#F1F0EC]">
      <main
        className={`flex-1 min-h-0 grid grid-cols-12 gap-2.5 p-2.5 h-full overflow-hidden ${
          workflowStep === 1 ? 'grid-rows-[minmax(0,1fr)]' : 'grid-rows-[auto_minmax(0,1fr)]'
        }`}
      >
        {workflowStep >= 2 && maxUnlockedStep >= 2 && <ContextBar items={contextItems} onEdit={() => setWorkflowStep(1)} />}
        {workflowStep === 1 && <StepIntro done={stepOneDone} />}
        {/* The frame stays while a step's code downloads, and a step that fails to download does not take the frame with it. */}
        <ChunkErrorBoundary inline>
          <Suspense fallback={<RouteFallback inline />}>
            <Outlet />
          </Suspense>
        </ChunkErrorBoundary>
      </main>
    </div>
  );
}
