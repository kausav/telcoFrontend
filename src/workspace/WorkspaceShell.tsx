import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { lazyNamed } from '../lib/lazyNamed';
import { ROUTES } from '../routes';
import { SideRail } from './SideRail';
import { Workbench } from './Workbench';
import { WorkspaceHeader } from './WorkspaceHeader';
import { useWorkspace } from './WorkspaceProvider';

// Dialogs are downloaded the first time they are opened.
const GlobalSearch = lazyNamed(() => import('./GlobalSearch'), 'GlobalSearch');
const VariableModal = lazy(() => import('../components/VariableModal'));

/** The workspace frame: top bar, side rail, the canvas, and the dialogs that sit above it. */
export function WorkspaceShell() {
  const navigate = useNavigate();
  const { draft, variableModal, setVariableModal, accessOf, variableFor, fields, handleSaveVariable, globalSearchOpen } = useWorkspace();
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F1F0EC] text-[#0B0B0C] font-sans select-none">
      <WorkspaceHeader />

      <div className="flex flex-1 h-[calc(100vh-48px)] overflow-hidden">
        <SideRail onHome={() => navigate(ROUTES.home)} />
        <Workbench />
      </div>

      {globalSearchOpen && (
        <Suspense fallback={null}>
          <GlobalSearch />
        </Suspense>
      )}

      {variableModal && draft && (
        <Suspense fallback={null}>
          <VariableModal
            mode={variableModal.mode}
            access={variableModal.mode === 'add' ? 'full' : accessOf(variableModal.name)}
            variable={variableModal.mode === 'edit' ? variableFor(variableModal.name) : undefined}
            columnNames={fields.map(f => f.name)}
            transactional={draft.typeOfData !== 'aggregational'}
            onSave={handleSaveVariable}
            onClose={() => setVariableModal(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
