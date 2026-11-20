import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPage } from '../components/landing/LandingPage';
import { ROUTES } from '../routes';
import { loadScenarioStep, loadWorkspaceShell } from '../workspace/loaders';

/** The front page. The landing page scrolls with the window (its pinned sections need that), so no scroll container wraps it. */
export function LandingRoute() {
  const navigate = useNavigate();
  // Once the page is idle, fetch the workspace's first screen in the background so "Go to workspace" opens without a wait.
  useEffect(() => {
    const prefetch = () => void Promise.all([loadWorkspaceShell(), loadScenarioStep()]).catch(() => undefined);
    const idle = (window as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(prefetch, { timeout: 4000 });
    else setTimeout(prefetch, 2000);
  }, []);
  return <LandingPage onOpenWorkspace={() => navigate(ROUTES.workspace)} />;
}
