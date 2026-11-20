import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { STEP_PATHS, isWorkspacePath, stepFromPath, type WorkflowStep } from '../routes';
import { useWorkspaceState, type WorkspaceValue } from './useWorkspaceState';

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

/**
 * Holds the workspace state (catalog choices, schema draft, generated data) above the routes, so it survives moving between pages:
 * going to the landing page and back keeps the work. The current step is not stored here; it is read from the address.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navigateToStep = useCallback((step: WorkflowStep) => navigate(STEP_PATHS[step]), [navigate]);
  const value = useWorkspaceState({ studioOpen: isWorkspacePath(pathname), step: stepFromPath(pathname), navigateToStep });
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  return value;
}
