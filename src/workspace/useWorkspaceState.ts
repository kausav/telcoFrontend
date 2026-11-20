import { useEffect, useId, useRef, useState } from 'react';
import { type CatalogCountry, type CatalogScenario, type CatalogScenarioDetail, type ScenarioConfirmResponse, type ScenarioDraftResponse, type ScenarioGenerateResponse, type SchemaVariable } from '../api/types';
import { type ContextItem } from '../components/ContextBar';
import { DEFAULT_COUNTRY, DEFAULT_RECORD_COUNT, ENABLED_INDUSTRIES, MAX_RECORDS_PER_USER, MAX_SEED, MAX_VOLUME, industryLabel, planGeneration } from './constants';
import { type DataField, bySequence, toDataField, toDataFields } from '../lib/schema';
import { type DownloadFormat, type PipelineStageId, type WorkbenchTab } from './types';
import { type WorkflowStep } from '../routes';
import { EXPORT_MIME, buildExport, downloadText, exportFileName } from '../lib/exportData';
import { type ToastKind, notify, notifyApiError } from '../lib/notify';
import { type VariableAccess, type VariableSave } from '../components/VariableModal';
import { confirmScenario, generateScenario, importScenarioCsv, proposeScenario } from '../api/scenarioApi';
import { getApiErrorMessage } from '../api/client';
import { getCountries, getScenarioDetail } from '../api/catalogApi';
import { useCatalog } from '../hooks/useCatalog';

/** What the router tells the workspace: whether a workspace address is open, which step it shows, and how to go to another step. */
export interface WorkspaceNav {
  studioOpen: boolean;
  step: WorkflowStep;
  navigateToStep: (step: WorkflowStep) => void;
}

export function useWorkspaceState({ studioOpen, step, navigateToStep }: WorkspaceNav) {
  // Navigation & Domain state
  // The cascading dropdowns (industry -> sub-domain -> use case -> journeys) come from the catalog API.
  const catalog = useCatalog();
  const activeDomain = catalog.industryId;
  const [countries, setCountries] = useState<CatalogCountry[]>([]);
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY);
  const useCaseId = catalog.useCaseId;
  const customerJourneys = catalog.journeys;
  const [activeStage, setActiveStage] = useState<PipelineStageId>(3);
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('table');

  // Progressive 3-Pane Sequential Workflow State
  // The step is the address in the browser (see routes.ts); changing step means going to that address.
  const workflowStep = step;
  const stepRef = useRef(step);
  stepRef.current = step;
  const studioOpenRef = useRef(studioOpen);
  studioOpenRef.current = studioOpen;
  // The step to come back to when the person returns to the workspace from the landing page.
  const resumeStep = useRef<WorkflowStep>(1);
  useEffect(() => {
    if (studioOpen) resumeStep.current = step;
  }, [studioOpen, step]);
  const setWorkflowStep = (next: WorkflowStep) => {
    if (!studioOpenRef.current) {
      resumeStep.current = next; // a late answer arriving while the person is on the landing page must not pull them back in
      return;
    }
    if (next !== stepRef.current) navigateToStep(next);
  };
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<1 | 2 | 3>(1);

  // Pipeline stage statuses
  const [stageStatuses, setStageStatuses] = useState<Record<PipelineStageId, 'COMPLETE' | 'WARNING' | 'PENDING' | 'READY'>>({
    1: 'READY',
    2: 'READY',
    3: 'READY',
    4: 'READY',
    5: 'READY'
  });

  // Business context state
  const [openJourneyIndex, setOpenJourneyIndex] = useState<number>(-1);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [scenarioDetail, setScenarioDetail] = useState<CatalogScenarioDetail | null>(null);
  const [isScenarioLoading, setIsScenarioLoading] = useState(false);
  const [inputMode, setInputMode] = useState<'prompt' | 'import'>('prompt');
  // The CSV chosen when the schema comes from the person's own file.
  const [csvFile, setCsvFile] = useState<File | null>(null);
  // Set when the server will not take a CSV for this industry (its variables come from registered sources).
  const [csvNotice, setCsvNotice] = useState<string | null>(null);
  const [importSubOption, setImportSubOption] = useState<'direct' | 'cloud'>('direct');
  const [cloudUri, setCloudUri] = useState('');
  const [promptText, setPromptText] = useState('');
  const [showPromptInfo, setShowPromptInfo] = useState(false);
  const [showCanvasToolbar, setShowCanvasToolbar] = useState(false);

  // Data contract fields state
  const [fields, setFields] = useState<DataField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  // Rows ticked in the variable table for "Delete selected" (variable ids).
  const [checkedFieldIds, setCheckedFieldIds] = useState<string[]>([]);
  const [fieldFilter, setFieldFilter] = useState<'all' | 'flagged' | 'pii'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Schema review (POST /scenario/propose -> /scenario/confirm)
  const [draft, setDraft] = useState<ScenarioDraftResponse | null>(null);
  const [confirmed, setConfirmed] = useState<ScenarioConfirmResponse | null>(null);
  const [deletedFieldNames, setDeletedFieldNames] = useState<string[]>([]);
  const [confirmedDeletions, setConfirmedDeletions] = useState('');
  // Variables the reviewer adds or changes before approving (sent with POST /scenario/confirm as add / edit)
  const [addedVariables, setAddedVariables] = useState<SchemaVariable[]>([]);
  const [variableEdits, setVariableEdits] = useState<Record<string, Record<string, unknown>>>({});
  useEffect(() => {
    setCheckedFieldIds([]); // a new proposal starts with nothing ticked
  }, [draft]);
  const [variableModal, setVariableModal] = useState<{ mode: 'add' } | { mode: 'edit'; name: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [generated, setGenerated] = useState<ScenarioGenerateResponse | null>(null);
  // Lets an answer that arrives after the user changed the selection be dropped.
  const pipelineTurn = useRef(0);
  const scenarioTurn = useRef(0);

  /* DISABLED: editing a field's constraints, adding a field by hand and the "Recommended Variables" dialog are not
     backed by the API yet (a confirmed schema accepts removals and description/nullable/params edits only).
    // Editing field modal state
  const [editingField, setEditingField] = useState<DataField | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('VARCHAR(64)');
  const [newFieldStandard, setNewFieldStandard] = useState('TMF 638');
  const [newFieldConstraint, setNewFieldConstraint] = useState('NOT NULL');

  // Recommended Scenario Variables Modal state (matches screenshot)
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [availableVars, setAvailableVars] = useState<ScenarioVariableOption[]>(AVAILABLE_SCENARIO_VARIABLES);
  const [recommendedVars, setRecommendedVars] = useState<ScenarioVariableOption[]>([]);
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<Set<string>>(new Set());
  const [selectedRecommendedIds, setSelectedRecommendedIds] = useState<Set<string>>(new Set());
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchRecommended, setSearchRecommended] = useState('');

  // Move all available to recommended (>>)
  const handleMoveAllToRecommended = () => {
    if (availableVars.length === 0) return;
    setRecommendedVars(prev => [...prev, ...availableVars]);
    setAvailableVars([]);
    setSelectedAvailableIds(new Set());
    setSelectedRecommendedIds(new Set());
  };

  // Move selected available to recommended (→)
  const handleMoveSelectedToRecommended = () => {
    if (selectedAvailableIds.size === 0) {
      showToast('Please select variables on the left first');
      return;
    }
    const toMove = availableVars.filter(v => selectedAvailableIds.has(v.id));
    const remaining = availableVars.filter(v => !selectedAvailableIds.has(v.id));
    setRecommendedVars(prev => [...prev, ...toMove]);
    setAvailableVars(remaining);
    setSelectedAvailableIds(new Set());
  };

  // Move selected recommended back to available (←)
  const handleMoveSelectedToAvailable = () => {
    if (selectedRecommendedIds.size === 0) {
      showToast('Please select variables on the right to move back');
      return;
    }
    const toMove = recommendedVars.filter(v => selectedRecommendedIds.has(v.id));
    const remaining = recommendedVars.filter(v => !selectedRecommendedIds.has(v.id));
    setAvailableVars(prev => [...prev, ...toMove]);
    setRecommendedVars(remaining);
    setSelectedRecommendedIds(new Set());
  };

  // Move all recommended back to available (<<)
  const handleMoveAllToAvailable = () => {
    if (recommendedVars.length === 0) return;
    setAvailableVars(prev => [...prev, ...recommendedVars]);
    setRecommendedVars([]);
    setSelectedAvailableIds(new Set());
    setSelectedRecommendedIds(new Set());
  };

  // Persist recommended variables into Data Contract Table
  const handleApplyRecommended = () => {
    if (recommendedVars.length === 0) {
      showToast('No recommended variables selected. Select variables first.');
      return;
    }
    const newFieldsToAdd: DataField[] = recommendedVars.map(v => ({
      id: `rec-${v.id}-${Date.now()}`,
      name: v.name,
      standardRef: v.standardRef || 'TM Forum SID',
      physicalType: v.type,
      constraints: v.constraints || 'Standard Schema Constraint',
      sensitivity: v.sensitivity || 'Operational',
      qaStatus: 'PASS',
      distribution: 'Normal distribution'
    }));
    const existingNames = new Set(fields.map(f => f.name));
    const toAdd = newFieldsToAdd.filter(f => !existingNames.has(f.name));
    if (toAdd.length > 0) {
      setFields(prev => [...prev, ...toAdd]);
      showToast(`Added ${toAdd.length} recommended variable${toAdd.length > 1 ? 's' : ''} to Standard Flow Schema Variables`);
    } else {
      showToast('Selected variables are already present in Schema Variables');
    }
    setShowRecommendModal(false);
  };
  */

  // Multi-modal parameters state
  const [targetEngine, setTargetEngine] = useState<'duckdb' | 'polars' | 'spark' | null>(null);
  // Only structured data is generated for now, so it is always selected (the other modalities are not offered).
  const [modalities, setModalities] = useState({
    structured: true,
    text: false,
    vision: false,
    telemetry: false
  });
  const [recordCount, setRecordCount] = useState<number | ''>('');
  const [recordsPerUser, setRecordsPerUser] = useState<number | ''>(MAX_RECORDS_PER_USER);
  const [typeOfData, setTypeOfData] = useState<'transactional' | 'aggregational' | ''>('');
  const [randomSeed, setRandomSeed] = useState<number | ''>('');
  const [modalitiesDropdownOpen, setModalitiesDropdownOpen] = useState(false);
  const [seedSectionExpanded, setSeedSectionExpanded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Hidden by default with side arrow option

  // Execution & results state
  const [pipelineRun, setPipelineRun] = useState(false);
  const [isPipelineRunning, setIsRunningPipeline] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExecutionComplete, setIsExecutionComplete] = useState(false);
  const [executionDrawerOpen, setExecutionDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('csv');

  /* DISABLED: static AST sandbox of the unused AST tab
  // AST Live Sandbox state
  const [sandboxExpr, setSandboxExpr] = useState("pa.Check(lambda s: s['account_balance'] >= 0, name='non_negative_balance')");
  const [sandboxValue, setSandboxValue] = useState('142.50');
  const [sandboxResult, setSandboxResult] = useState<{ passed: boolean; message: string }>({
    passed: true,
    message: 'Pandera AST Rule Evaluated: PASS (Value 142.50 satisfies predicate account_balance >= 0)'
  });
  */

  const recordCountInputId = useId();
  const recordsPerUserInputId = useId();
  const randomSeedInputId = useId();

  // Toast feedback helper (react-toastify)
  const showToast = (msg: string, kind: ToastKind = 'info') => notify(msg, kind);

  const allStagesReady = { 1: 'READY', 2: 'READY', 3: 'READY', 4: 'READY', 5: 'READY' } as const;

  // Forget everything derived from the current selection (schema draft, confirmation, generated data).
  const resetPipeline = () => {
    pipelineTurn.current += 1;
    setActiveTab('table');
    setPipelineRun(false);
    setIsRunningPipeline(false);
    setIsConfirming(false);
    setIsExecuting(false);
    setIsExecutionComplete(false);
    setDraft(null);
    setConfirmed(null);
    setDeletedFieldNames([]);
    setConfirmedDeletions('');
    setAddedVariables([]);
    setVariableEdits({});
    setVariableModal(null);
    setFields([]);
    setSelectedFieldId(null);
    setGenerated(null);
    setStageStatuses({ ...allStagesReady });
    setMaxUnlockedStep(1);
    setWorkflowStep(1);
  };

  const resetSelection = () => {
    scenarioTurn.current += 1;
    setIsScenarioLoading(false);
    setOpenJourneyIndex(-1);
    setSelectedScenario('');
    setScenarioDetail(null);
    setTypeOfData('');
    setCsvFile(null);
    setCsvNotice(null);
    setPromptText('');
    setShowPromptInfo(false);
  };

  // Handle Domain Change (industries come from GET /catalog/industries)
  const handleDomainChange = (industryId: string) => {
    resetPipeline();
    resetSelection();
    if (activeDomain === industryId) {
      void catalog.chooseIndustry(null);
      showToast('Deselected domain context');
      return;
    }
    void catalog.chooseIndustry(industryId);
    // const name = catalog.industries.find(item => item.id === industryId)?.name ?? 'domain';
    // showToast(`Activated ${name}`);
  };

  const handleSubDomainChange = (subDomainId: string) => {
    resetPipeline();
    resetSelection();
    void catalog.chooseSubDomain(subDomainId);
  };

  const handleUseCaseChange = (nextUseCaseId: string) => {
    resetPipeline();
    resetSelection();
    void catalog.chooseUseCase(nextUseCaseId);
    // const name = catalog.useCases.find(item => item.id === nextUseCaseId)?.name;
    // if (name) showToast(`Scoped use case: ${name} — customer journeys loaded`);
  };

  // Select (or deselect) a scenario; its propose defaults and business description come from GET /catalog/scenarios/{id}
  const handleScenarioSelect = async (scenario: CatalogScenario) => {
    resetPipeline();
    if (selectedScenario === scenario.scenarioId) {
      resetSelection();
      showToast(`Deselected scenario: ${scenario.label}`);
      return;
    }
    resetSelection();
    const turn = scenarioTurn.current;
    setSelectedScenario(scenario.scenarioId);
    setIsScenarioLoading(true);
    try {
      const detail = await getScenarioDetail(scenario.scenarioId);
      if (turn !== scenarioTurn.current) return;
      setScenarioDetail(detail);
      setTypeOfData(detail.proposeRequest.typeOfData);
      setPromptText(detail.proposeRequest.businessScenario ?? '');
      showToast(`Selected scenario: ${scenario.label} — specification loaded`, 'success');
    } catch (error) {
      if (turn !== scenarioTurn.current) return;
      setSelectedScenario('');
      notifyApiError(error, `Could not load scenario ${scenario.scenarioId}.`);
    } finally {
      if (turn === scenarioTurn.current) setIsScenarioLoading(false);
    }
  };

  // Load the industries when the studio opens.
  useEffect(() => {
    if (studioOpen && catalog.industriesState === 'idle') void catalog.loadIndustries();
  }, [studioOpen]);

  // Load the country choices once (GET /catalog/countries); keep the default if the call fails.
  const countriesRequested = useRef(false);
  useEffect(() => {
    if (!studioOpen || countriesRequested.current) return;
    countriesRequested.current = true;
    getCountries()
      .then(list => {
        setCountries(list);
        setCountryCode(prev => (list.some(c => c.code === prev) ? prev : list[0]?.code ?? prev));
      })
      .catch(error => {
        countriesRequested.current = false;
        notifyApiError(error, 'Could not load the country list.');
      });
  }, [studioOpen]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K, Cmd+Enter / Ctrl+Enter); the ref keeps the handler current.
  const runPipelineRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runPipelineRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Both ways of getting a draft (propose, or import a CSV) start the same way: forget the previous draft and show Step 2 working.
  const beginDraft = (message: string): number => {
    const turn = ++pipelineTurn.current;
    setDraft(null);
    setConfirmed(null);
    setDeletedFieldNames([]);
    setConfirmedDeletions('');
    setAddedVariables([]);
    setVariableEdits({});
    setVariableModal(null);
    setFields([]);
    setGenerated(null);
    setActiveTab('table');
    setIsExecutionComplete(false);
    setMaxUnlockedStep(prev => Math.max(prev, 2) as 1 | 2 | 3);
    setWorkflowStep(2);
    setIsRunningPipeline(true);
    setStageStatuses({ 1: 'COMPLETE', 2: 'PENDING', 3: 'PENDING', 4: 'PENDING', 5: 'READY' });
    setActiveStage(2);
    showToast(message);
    return turn;
  };

  // Step 1 -> 2: POST /scenario/propose proposes the schema for the selected scenario.
  const handleRunPipeline = async () => {
    if (isPipelineRunning) return;
    if (!activeDomain) {
      showToast('Please select an industry domain first', 'warning');
      return;
    }
    if (!scenarioDetail) {
      showToast(selectedScenario ? 'The scenario is still loading' : 'Please select a customer journey scenario first', 'warning');
      return;
    }
    const defaults = scenarioDetail.proposeRequest;
    const businessScenario = (promptText.trim() || defaults.businessScenario || '').trim();
    if (!businessScenario) {
      showToast('This scenario has no business description yet; add one to the catalog first', 'error');
      return;
    }
    const turn = beginDraft('Proposing the schema for this scenario...');
    try {
      const result = await proposeScenario({
        requestedScenarioId: defaults.requestedScenarioId,
        scenarioType: defaults.scenarioType,
        industryType: defaults.industryType,
        domain: defaults.domain,
        businessScenario,
        typeOfData: typeOfData || defaults.typeOfData,
        country: countryCode,
        useCase: defaults.useCase,
        ...(defaults.entityKey ? { entityKey: defaults.entityKey } : {})
      });
      if (turn !== pipelineTurn.current) return;
      setDraft(result);
      setFields(toDataFields(result.variables, result.variableSources, result.entityKey));
      setStageStatuses({ 1: 'COMPLETE', 2: 'COMPLETE', 3: 'PENDING', 4: 'PENDING', 5: 'READY' });
      setActiveStage(3);
      setPipelineRun(true);
      showToast(`Schema proposed: ${result.variables.length} variables. Review it, then approve.`, 'success');
    } catch (error) {
      if (turn !== pipelineTurn.current) return;
      setMaxUnlockedStep(1);
      setWorkflowStep(1);
      setStageStatuses({ ...allStagesReady });
      notifyApiError(error, 'Could not propose a schema for this scenario.');
    } finally {
      if (turn === pipelineTurn.current) setIsRunningPipeline(false);
    }
  };
  runPipelineRef.current = () => void (inputMode === 'import' ? handleImportCsv() : handleRunPipeline());

  // Step 1 -> 2, for a schema the person brings: POST /scenario/import-csv turns their CSV into the same kind of draft.
  const handleImportCsv = async () => {
    if (isPipelineRunning) return;
    if (!activeDomain) {
      showToast('Please select an industry domain first', 'warning');
      return;
    }
    if (!scenarioDetail) {
      showToast(selectedScenario ? 'The scenario is still loading' : 'Please select a customer journey scenario first', 'warning');
      return;
    }
    if (!csvFile) {
      showToast('Choose the CSV file to upload first', 'warning');
      return;
    }
    const defaults = scenarioDetail.proposeRequest;
    const turn = beginDraft(`Reading ${csvFile.name}...`);
    try {
      const result = await importScenarioCsv({
        file: csvFile,
        requestedScenarioId: defaults.requestedScenarioId,
        domain: defaults.domain,
        typeOfData: typeOfData || defaults.typeOfData,
        industryType: defaults.industryType,
        country: countryCode,
        businessScenario: (promptText.trim() || defaults.businessScenario || '').trim(),
        scenarioType: defaults.scenarioType,
        useCase: defaults.useCase,
        label: scenarioDetail.label || defaults.requestedScenarioId,
        entityKey: defaults.entityKey
      });
      if (turn !== pipelineTurn.current) return;
      setDraft(result);
      setFields(toDataFields(result.variables, result.variableSources, result.entityKey));
      setStageStatuses({ 1: 'COMPLETE', 2: 'COMPLETE', 3: 'PENDING', 4: 'PENDING', 5: 'READY' });
      setActiveStage(3);
      setPipelineRun(true);
      showToast(`Schema imported: ${result.variables.length} variables. Review it, then approve.`, 'success');
    } catch (error) {
      if (turn !== pipelineTurn.current) return;
      setMaxUnlockedStep(1);
      setWorkflowStep(1);
      setStageStatuses({ ...allStagesReady });
      const message = getApiErrorMessage(error, 'Could not read the CSV.');
      if (/cannot be defined through csv/i.test(message)) {
        setCsvNotice(`Your own schema is not available for ${activeIndustry ? industryLabel(activeIndustry.name) : 'this industry'} yet: its variables come from the registered industry sources. Choose "Propose a schema" instead.`);
      } else {
        notifyApiError(error, 'Could not read the CSV.');
      }
    } finally {
      if (turn === pipelineTurn.current) setIsRunningPipeline(false);
    }
  };

  // Step 2 -> 3: POST /scenario/confirm approves the draft, with the variables the reviewer removed.
  const handleApproveSchema = async () => {
    if (!draft) {
      showToast('Run the pipeline first to propose a schema', 'warning');
      return;
    }
    if (isConfirming) return;
    // What the reviewer changed travels with the approval: variables added (add) and variables changed (edit). Where a column sits is
    // set by the system, so a sequence is only sent when the reviewer overrode it.
    const addedNames = new Set(addedVariables.map(v => String(v.name)));
    const originalSequence = new Map(draft.variables.map(v => [String(v.name), typeof v.sequence === 'number' ? v.sequence : undefined]));
    const editMap = new Map<string, Record<string, unknown>>();
    for (const f of fields) {
      if (addedNames.has(f.name) || f.sequence === undefined || f.sequence === originalSequence.get(f.name)) continue;
      editMap.set(f.name, { sequence: f.sequence });
    }
    for (const [name, changes] of Object.entries(variableEdits) as [string, Record<string, unknown>][]) {
      if (deletedFieldNames.includes(name) || addedNames.has(name)) continue;
      editMap.set(name, { ...(editMap.get(name) ?? {}), ...changes });
    }
    const edits = [...editMap].map(([name, changes]) => ({ name, changes }));
    const additions = addedVariables.map(v => {
      const field = fields.find(f => f.name === v.name);
      return field?.sequence !== undefined && v.sequence === undefined ? { ...v, sequence: field.sequence } : v;
    });
    const deletions = [...deletedFieldNames].sort().join('|')
      + (edits.length ? `#${JSON.stringify(edits)}` : '')
      + (additions.length ? `+${JSON.stringify(additions)}` : '');
    if (confirmed && deletions === confirmedDeletions) {
      setActiveStage(4);
      setMaxUnlockedStep(3);
      setWorkflowStep(3);
      return;
    }
    const turn = pipelineTurn.current;
    setIsConfirming(true);
    try {
      const result = await confirmScenario({
        draft_id: draft.draft_id,
        delete: deletedFieldNames,
        ...(additions.length ? { add: additions } : {}),
        ...(edits.length ? { edit: edits } : {})
      });
      if (turn !== pipelineTurn.current) return;
      setConfirmed(result);
      setConfirmedDeletions(deletions);
      setFields(toDataFields(result.variables, result.variableSources, result.entityKey));
      setStageStatuses(prev => ({ ...prev, 3: 'COMPLETE', 4: 'COMPLETE' }));
      setActiveStage(4);
      setMaxUnlockedStep(3);
      setWorkflowStep(3);
      showToast('Schema approved. Core data generation is unlocked.', 'success');
      if (result.scenario_id_reassigned) showToast(`The scenario id was reassigned to ${result.scenario_id}`, 'warning');
    } catch (error) {
      if (turn !== pipelineTurn.current) return;
      notifyApiError(error, 'Could not approve the schema.');
    } finally {
      if (turn === pipelineTurn.current) setIsConfirming(false);
    }
  };

  // Step 3: POST /scenario/generate generates the validated dataset from the confirmed schema.
  const handleExecuteEngine = async () => {
    if (!confirmed) {
      showToast('Approve the schema first', 'warning');
      return;
    }
    if (isExecuting) return;
    const isTransactional = confirmed.typeOfData !== 'aggregational';
    const volume = typeof recordCount === 'number' && recordCount > 0 ? Math.floor(recordCount) : DEFAULT_RECORD_COUNT;
    if (volume > MAX_VOLUME) {
      showToast(`A run can generate at most ${MAX_VOLUME.toLocaleString()} ${isTransactional ? 'users' : 'rows'}`, 'error');
      return;
    }
    const perUser = typeof recordsPerUser === 'number' && recordsPerUser > 0 ? Math.floor(recordsPerUser) : MAX_RECORDS_PER_USER;
    if (isTransactional && perUser > MAX_RECORDS_PER_USER) {
      showToast(`Records per user can be at most ${MAX_RECORDS_PER_USER}`, 'error');
      return;
    }
    if (randomSeed !== '' && !(Number.isInteger(randomSeed) && randomSeed >= 0 && randomSeed <= MAX_SEED)) {
      showToast(`The seed must be a whole number from 0 to ${MAX_SEED.toLocaleString()}`, 'error');
      return;
    }
    const plan = planGeneration(volume, confirmed.typeOfData, perUser);
    const turn = pipelineTurn.current;
    setIsExecuting(true);
    setIsExecutionComplete(false);
    setGenerated(null);
    setActiveTab('table');
    try {
      const result = await generateScenario(
        { draftId: confirmed.draft_id, ...plan, ...(randomSeed !== '' ? { seed: randomSeed } : {}) },
        (seconds, attempt) => showToast(`The scenario behaviour is still being designed. Retrying in ${seconds}s (attempt ${attempt})...`)
      );
      if (turn !== pipelineTurn.current) return;
      setGenerated(result);
      setActiveTab('records');
      setIsExecutionComplete(true);
      setStageStatuses(s => ({ ...s, 5: 'COMPLETE' }));
      showToast(`Data generation complete: ${result.total_records.toLocaleString()} synthetic records generated.`, 'success');
      if (result.errors.length > 0) showToast(`The run reported ${result.errors.length} issue(s): ${result.errors[0]}`, 'warning');
    } catch (error) {
      if (turn !== pipelineTurn.current) return;
      notifyApiError(error, 'Data generation failed.');
    } finally {
      if (turn === pipelineTurn.current) setIsExecuting(false);
    }
  };

  // Download the generated records in the selected format (CSV, JSON, SQL, NDJSON)
  const handleDownloadSyntheticData = (formatToUse?: DownloadFormat) => {
    if (!generated) {
      showToast('Generate the data first', 'warning');
      return;
    }
    const fmt = formatToUse || downloadFormat;
    const text = buildExport(fmt, generated);
    if (!text) {
      showToast('There are no records to download.', 'warning');
      return;
    }
    downloadText(exportFileName(fmt, generated), text, EXPORT_MIME[fmt]);
    showToast(`Downloaded synthetic data in ${fmt.toUpperCase()} format (${generated.total_records.toLocaleString()} records).`, 'success');
  };

  // Remove the ticked variables from the schema; the removal is sent with the approval (POST /scenario/confirm).
  // Required variables and the entity key cannot be ticked, and are skipped here as well.
  const handleDeleteSelected = () => {
    const doomed = fields.filter(f => checkedFieldIds.includes(f.id) && !f.required);
    if (doomed.length === 0) return;
    const doomedIds = new Set(doomed.map(f => f.id));
    const doomedNames = new Set(doomed.map(f => f.name));
    // A variable the reviewer added has nothing to delete on the server: it is simply not sent.
    const addedNames = new Set(addedVariables.filter(v => doomedNames.has(v.name)).map(v => v.name));
    const serverNames = doomed.map(f => f.name).filter(name => !addedNames.has(name));
    setFields(prev => prev.filter(f => !doomedIds.has(f.id)));
    setVariableEdits(prev => Object.fromEntries(Object.entries(prev).filter(([name]) => !doomedNames.has(name))));
    setAddedVariables(prev => prev.filter(v => !addedNames.has(v.name)));
    setDeletedFieldNames(prev => [...prev, ...serverNames.filter(name => !prev.includes(name))]);
    setCheckedFieldIds([]);
    const what = doomed.length === 1 ? `field "${doomed[0].name}"` : `${doomed.length} fields`;
    showToast(serverNames.length === 0 ? `Removed ${what}.` : `Removed ${what}. Approve the schema to apply it.`);
  };

  // Variables can be added and changed until the schema is approved.
  const canReview = Boolean(draft) && !confirmed;
  const sourceOf = (name: string): string =>
    String(draft?.variableSources?.[name.trim().toLowerCase()] ?? draft?.variableSources?.[name] ?? '').toUpperCase();
  /** The definition shown for a variable: as proposed, with the reviewer's changes applied (or the variable the reviewer added). */
  const variableFor = (name: string): SchemaVariable | undefined => {
    const added = addedVariables.find(v => v.name === name);
    if (added) return added;
    const base = draft?.variables.find(v => v.name === name);
    return base ? { ...base, ...(variableEdits[name] ?? {}) } : undefined;
  };
  const accessOf = (name: string): VariableAccess => {
    if (addedVariables.some(v => v.name === name)) return 'full';
    return ['DB_RECOMMENDED', 'USER_SELECTED'].includes(sourceOf(name)) ? 'locked' : 'limited';
  };

  const handleSaveVariable = (save: VariableSave) => {
    const modal = variableModal;
    if (!modal || !draft) return;
    const entityKey = draft.entityKey ?? null;
    const sources = { ...draft.variableSources, ...Object.fromEntries(addedVariables.map(v => [String(v.name).toLowerCase(), 'USER_ADDED'])) };
    if (save.kind === 'definition') {
      const definition = save.definition as SchemaVariable;
      const row = toDataField({ ...definition, source: 'USER_ADDED' }, { ...sources, [String(definition.name).toLowerCase()]: 'USER_ADDED' }, entityKey);
      if (modal.mode === 'add') {
        setAddedVariables(prev => [...prev, definition]);
        setFields(prev => [...prev, row]); // placed at the end for now; the backend puts it in story order when the schema is approved
        showToast(`Added "${definition.name}". Approve the schema to apply it.`);
      } else {
        setAddedVariables(prev => prev.map(v => (v.name === modal.name ? definition : v)));
        setFields(prev => prev.map(f => (f.name === modal.name ? { ...row, sequence: definition.sequence ?? f.sequence } : f)));
        showToast(`Updated "${definition.name}".`);
      }
    } else if (modal.mode === 'edit') {
      const { sequence, ...others } = save.changes;
      const merged = Object.keys(others).length ? { ...(variableEdits[modal.name] ?? {}), ...others } : variableEdits[modal.name];
      if (merged) setVariableEdits(prev => ({ ...prev, [modal.name]: merged }));
      const base = draft.variables.find(v => v.name === modal.name);
      setFields(prev => {
        const next = prev.map(f => {
          if (f.name !== modal.name) return f;
          const shown = base ? toDataField({ ...base, ...(merged ?? {}) }, sources, entityKey) : f;
          return { ...shown, id: f.id, sequence: typeof sequence === 'number' ? sequence : f.sequence };
        });
        return typeof sequence === 'number' ? bySequence(next) : next;
      });
      showToast(`Updated "${modal.name}". Approve the schema to apply it.`);
    }
    setVariableModal(null);
  };

  // Filtered fields
  const filteredFields = fields.filter(f => {
    if (fieldFilter === 'flagged' && f.qaStatus !== 'FLAGGED') return false;
    if (fieldFilter === 'pii' && !f.sensitivity.includes('PII') && !f.sensitivity.includes('Financial')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.standardRef.toLowerCase().includes(q) || f.physicalType.toLowerCase().includes(q);
    }
    return true;
  });

  // Ticking rows for "Delete selected": required variables cannot be ticked, and the header box acts on the rows shown.
  const checkedFields = fields.filter(f => checkedFieldIds.includes(f.id) && !f.required);
  const shownRemovable = filteredFields.filter(f => !f.required);
  const allShownChecked = shownRemovable.length > 0 && shownRemovable.every(f => checkedFieldIds.includes(f.id));
  const someShownChecked = shownRemovable.some(f => checkedFieldIds.includes(f.id));
  const toggleChecked = (id: string) => setCheckedFieldIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleAllShown = () =>
    setCheckedFieldIds(prev =>
      allShownChecked ? prev.filter(id => !shownRemovable.some(f => f.id === id)) : [...prev, ...shownRemovable.map(f => f.id).filter(id => !prev.includes(id))],
    );

  /* DISABLED: recommended-variables dialog filters and the volume-calibrated seed suggestions (static content, not backed by the API)
  // Filtered recommended scenario variables (from modal search)
  const filteredAvailable = availableVars.filter(v =>
    v.name.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    v.description.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    v.type.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  const filteredRecommended = recommendedVars.filter(v =>
    v.name.toLowerCase().includes(searchRecommended.toLowerCase()) ||
    v.description.toLowerCase().includes(searchRecommended.toLowerCase()) ||
    v.type.toLowerCase().includes(searchRecommended.toLowerCase())
  );

  // Seed recommendations calibrated by record volume
  const getVolumeSeedSuggestions = (volume: number | '') => {
    const count = typeof volume === 'number' && volume > 0 ? volume : 100000;
    if (count <= 10000) {
      return [
        {
          seed: 10421,
          tag: 'Fast Baseline',
          category: 'Deterministic Prototyping',
          desc: 'Calibrated for 10K rapid synthesis with zero empty categorical buckets.',
          rationale: 'Minimizes hash collisions on small MSISDN lookup tables'
        },
        {
          seed: 13370,
          tag: 'Anomaly Stress',
          category: 'Edge-Case Injection',
          desc: 'Exercises extreme distribution boundaries for stress validation.',
          rationale: 'Forces 30% boundary anomaly cases into the first 1,000 batches'
        },
        {
          seed: 42001,
          tag: 'Balanced Spread',
          category: 'Uniform Stratification',
          desc: 'Deterministic uniform distribution across subscriber balance tiers.',
          rationale: 'Guarantees equal coverage across low balance and credit tiers'
        }
      ];
    } else if (count <= 50000) {
      return [
        {
          seed: 50892,
          tag: 'Cross-Validation',
          category: 'K-Fold Stratification',
          desc: 'Optimized for 50K multi-fold splits with balanced demographic strata.',
          rationale: 'Preserves identical demographic distribution across 5 cross-validation folds'
        },
        {
          seed: 54321,
          tag: '5G Telemetry',
          category: 'Markov Process',
          desc: 'Smooth Markov transition matrix for high-frequency CDR streams.',
          rationale: 'Generates realistic session handoff chains between cell towers'
        },
        {
          seed: 77104,
          tag: 'Low Drift',
          category: 'Distribution Stability',
          desc: 'Minimizes empirical KS-statistic across 50K generated samples.',
          rationale: 'Ensures KS-test p-value > 0.20 against baseline CDR tables'
        }
      ];
    } else if (count <= 100000) {
      return [
        {
          seed: 42901,
          tag: 'TM Forum Standard',
          category: 'Enterprise SID v22.5',
          desc: 'Recommended TM Forum SID baseline seed for enterprise compliance.',
          rationale: 'Calibrated to production telco subscriber base distributions'
        },
        {
          seed: 99120,
          tag: 'Longitudinal Cohort',
          category: 'Multi-Day Temporal',
          desc: 'Preserves multi-day subscriber journey correlation at 100K records.',
          rationale: 'Simulates 30-day top-up lifecycle with realistic decay rate'
        },
        {
          seed: 10042,
          tag: 'Diff-Privacy Certified',
          category: 'GDPR / HIPAA Safe',
          desc: 'Ensures ε ≤ 0.5 differential privacy budget bounds strictly hold.',
          rationale: 'Guarantees Laplacian noise scale meets zero re-identification criteria'
        }
      ];
    } else {
      return [
        {
          seed: 88204,
          tag: 'High-Scale Stress',
          category: 'High Throughput',
          desc: 'Optimized for 500K+ high-throughput DuckDB/Polars IPC buffers.',
          rationale: 'Prevents PRNG cycle exhaustion and aligns multi-threaded memory buffers'
        },
        {
          seed: 52941,
          tag: 'Weibull Hazard',
          category: 'Survival Analysis',
          desc: 'Ensures asymptotic convergence for churn hazard regression models.',
          rationale: 'Stabilizes heavy-tailed Pareto distributions for extreme data usage'
        },
        {
          seed: 98765,
          tag: 'Slice Distribution',
          category: '5G Network Slicing',
          desc: 'Uniform partition across 5G network slices (eMBB, URLLC, MIoT).',
          rationale: 'Preserves QoS telemetry across enterprise and IoT sub-networks'
        }
      ];
    }
  };
  */

  // Only the enabled industries are offered (see ENABLED_INDUSTRIES).
  const visibleIndustries = catalog.industries.filter(item => ENABLED_INDUSTRIES.some(pattern => pattern.test(item.name)));

  // The sub-domain choice is hidden for now: once an industry's sub-domains are loaded, the first one is picked so use cases still load.
  useEffect(() => {
    if (catalog.industryId && catalog.subDomainsState === 'ready' && !catalog.subDomainId && catalog.subDomains.length > 0) {
      void catalog.chooseSubDomain(catalog.subDomains[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.industryId, catalog.subDomainsState, catalog.subDomainId, catalog.subDomains]);

  // What Steps 2 and 3 repeat about Step 1.
  const activeIndustry = catalog.industries.find(item => item.id === activeDomain);
  const activeUseCase = catalog.useCases.find(item => item.id === useCaseId);
  const activeJourney = customerJourneys.find(j => j.scenarios.some(sc => sc.scenarioId === selectedScenario));
  const contextItems: ContextItem[] = [
    { label: 'Industry', value: activeIndustry ? industryLabel(activeIndustry.name) : '-' },
    { label: 'Use case', value: activeUseCase?.name ?? '-' },
    { label: 'Journey', value: activeJourney?.name ?? '-' },
    { label: 'Scenario', value: scenarioDetail?.label ?? selectedScenario ?? '-' },
    { label: 'Data', value: typeOfData ? typeOfData.charAt(0).toUpperCase() + typeOfData.slice(1) : '-' },
    { label: 'Schema from', value: inputMode === 'import' ? 'Your CSV' : 'Proposed' },
    { label: 'Country', value: countryCode }
  ];
  const stepOneDone: [boolean, boolean, boolean, boolean] = [
    Boolean(activeDomain), Boolean(useCaseId), Boolean(selectedScenario), Boolean(selectedScenario && typeOfData)
  ];

  return {
    catalog,
    activeDomain,
    countries,
    countryCode,
    setCountryCode,
    useCaseId,
    customerJourneys,
    activeTab,
    setActiveTab,
    workflowStep,
    setWorkflowStep,
    resumeStep,
    maxUnlockedStep,
    setMaxUnlockedStep,
    openJourneyIndex,
    setOpenJourneyIndex,
    selectedScenario,
    scenarioDetail,
    isScenarioLoading,
    inputMode,
    setInputMode,
    csvFile,
    setCsvFile,
    csvNotice,
    setCsvNotice,
    fields,
    selectedFieldId,
    setSelectedFieldId,
    checkedFieldIds,
    fieldFilter,
    setFieldFilter,
    globalSearchOpen,
    setGlobalSearchOpen,
    globalSearchTerm,
    setGlobalSearchTerm,
    draft,
    confirmed,
    variableModal,
    setVariableModal,
    isConfirming,
    generated,
    modalities,
    recordCount,
    setRecordCount,
    recordsPerUser,
    setRecordsPerUser,
    typeOfData,
    setTypeOfData,
    sidebarCollapsed,
    setSidebarCollapsed,
    pipelineRun,
    isPipelineRunning,
    isExecuting,
    isExecutionComplete,
    downloadFormat,
    setDownloadFormat,
    recordCountInputId,
    recordsPerUserInputId,
    showToast,
    resetPipeline,
    handleDomainChange,
    handleUseCaseChange,
    handleScenarioSelect,
    handleRunPipeline,
    handleImportCsv,
    handleApproveSchema,
    handleExecuteEngine,
    handleDownloadSyntheticData,
    handleDeleteSelected,
    canReview,
    variableFor,
    accessOf,
    handleSaveVariable,
    filteredFields,
    checkedFields,
    shownRemovable,
    allShownChecked,
    someShownChecked,
    toggleChecked,
    toggleAllShown,
    visibleIndustries,
    contextItems,
    stepOneDone,
  };
}

export type WorkspaceValue = ReturnType<typeof useWorkspaceState>;
