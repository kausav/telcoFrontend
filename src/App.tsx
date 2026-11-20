import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary';
import { RouteFallback } from './components/RouteFallback';
import { lazyNamed } from './lib/lazyNamed';
import { ROUTES } from './routes';
import { ResumeStep, RequireStep } from './workspace/StepGuards';
import { loadGenerateStep, loadScenarioStep, loadSchemaStep, loadWorkspaceShell } from './workspace/loaders';
import { WorkspaceProvider } from './workspace/WorkspaceProvider';

// Each page is its own download, fetched when its address is first opened (the landing page's animation libraries are not
// loaded for someone who goes straight to the workspace, and the other way round).
const LandingRoute = lazyNamed(() => import('./pages/LandingRoute'), 'LandingRoute');
const WorkspaceShell = lazyNamed(loadWorkspaceShell, 'WorkspaceShell');
const ScenarioStep = lazyNamed(loadScenarioStep, 'ScenarioStep');
const SchemaStep = lazyNamed(loadSchemaStep, 'SchemaStep');
const GenerateStep = lazyNamed(loadGenerateStep, 'GenerateStep');

/**
 * The pages of the app. Addresses are in routes.ts (the backend must serve the UI for /workspace and below: UI_APP_ROUTES).
 *   /                      front page
 *   /workspace/scenario    Step 1: industry, use case, journey, scenario
 *   /workspace/schema      Step 2: review the proposed schema
 *   /workspace/generate    Step 3: schema beside the generation settings and the generated data
 */
export default function App() {
  return (
    <WorkspaceProvider>
      <ChunkErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path={ROUTES.home} element={<LandingRoute />} />
            <Route path={ROUTES.workspace} element={<WorkspaceShell />}>
              <Route index element={<ResumeStep />} />
              <Route path="scenario" element={<ScenarioStep />} />
              <Route
                path="schema"
                element={
                  <RequireStep step={2}>
                    <SchemaStep />
                  </RequireStep>
                }
              />
              <Route
                path="generate"
                element={
                  <RequireStep step={3}>
                    <SchemaStep />
                    <GenerateStep />
                  </RequireStep>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
          </Routes>
        </Suspense>
      </ChunkErrorBoundary>
    </WorkspaceProvider>
  );
}
