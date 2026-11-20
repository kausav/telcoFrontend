// The workspace is loaded in pieces, when its address is first opened. The loaders live here so the landing page can also
// start them early (see pages/LandingRoute.tsx): the browser reuses the downloaded file when the person clicks "Go to workspace".
export const loadWorkspaceShell = () => import('./WorkspaceShell');
export const loadScenarioStep = () => import('./steps/ScenarioStep');
export const loadSchemaStep = () => import('./steps/SchemaStep');
export const loadGenerateStep = () => import('./steps/GenerateStep');
