import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { STEP_PATHS, type WorkflowStep } from '../routes';
import { useWorkspace } from './WorkspaceProvider';

/**
 * Shows a step only once it is unlocked. Opening /workspace/schema or /workspace/generate directly (a bookmark, a reload, a shared
 * link) finds no scenario or schema yet, because that work lives in the page, so it goes back to the first step it can show.
 */
export function RequireStep({ step, children }: { step: WorkflowStep; children: ReactNode }) {
  const { maxUnlockedStep } = useWorkspace();
  if (maxUnlockedStep < step) return <Navigate to={STEP_PATHS[1]} replace />;
  return <>{children}</>;
}

/** /workspace on its own: the step the person was last on (Step 1 for a new visit). */
export function ResumeStep() {
  const { resumeStep, maxUnlockedStep } = useWorkspace();
  const step = Math.min(resumeStep.current, maxUnlockedStep) as WorkflowStep;
  return <Navigate to={STEP_PATHS[step]} replace />;
}
