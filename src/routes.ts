/** Every address of the UI, in one place. These are paths inside the app: the router adds the deployment prefix (/source) itself. */
export const ROUTES = {
  home: '/',
  workspace: '/workspace',
  scenario: '/workspace/scenario',
  schema: '/workspace/schema',
  generate: '/workspace/generate'
} as const;

export type WorkflowStep = 1 | 2 | 3;

/** The address of each step of the workflow. Keep the first segment ("workspace") in step with UI_APP_ROUTES on the backend. */
export const STEP_PATHS: Record<WorkflowStep, string> = {
  1: ROUTES.scenario,
  2: ROUTES.schema,
  3: ROUTES.generate
};

/** True for /workspace and everything below it. */
export const isWorkspacePath = (pathname: string): boolean => pathname === ROUTES.workspace || pathname.startsWith(`${ROUTES.workspace}/`);

/** The step an address shows (Step 1 for any address that is not a step). */
export function stepFromPath(pathname: string): WorkflowStep {
  const clean = pathname.replace(/\/+$/, '');
  return (([1, 2, 3] as const).find(step => STEP_PATHS[step] === clean) ?? 1) as WorkflowStep;
}
