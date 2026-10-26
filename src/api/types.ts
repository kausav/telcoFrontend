/** Request and response shapes of the ModelOS backend (FastAPI). Field names are the backend's own. */

export type DataType = 'transactional' | 'aggregational';

// ---- error envelope ------------------------------------------------------------------------------------------------
export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
  request_id?: string;
}

export interface ApiErrorBody {
  success: false;
  error: ApiErrorDetail;
}

// ---- catalog (the choices behind the dropdowns) ------------------------------------------------------------------
export interface CatalogItem {
  id: string;
  name: string;
  description?: string | null;
  order: number;
}

export interface CatalogCountry {
  code: string;
  name: string;
  currency: string;
}

export interface CatalogJourney extends CatalogItem {
  dataTypes: DataType[];
  industryType: string;
  domain: string;
  entityKey: string | null;
}

export interface CatalogScenario {
  scenarioId: string;
  scenarioType: string;
  /** What the dropdown shows, for example "LB-01: Normal" */
  label: string;
  order: number;
  businessScenario: string | null;
  /** One or two plain sentences that explain what the scenario is about (shown in the UI). May be missing on older data. */
  description?: string | null;
}

export interface CatalogScenarioList {
  journeyId: string;
  count: number;
  allLabel: string;
  scenarios: CatalogScenario[];
}

/** What /scenario/propose needs that the catalog knows; the client adds `country`. */
export interface CatalogProposeDefaults {
  requestedScenarioId: string;
  scenarioType: string;
  industryType: string;
  domain: string;
  useCase: string;
  typeOfData: DataType;
  businessScenario: string | null;
  entityKey: string | null;
}

export interface CatalogScenarioDetail extends CatalogScenario {
  industry: CatalogItem;
  subDomain: CatalogItem;
  useCase: CatalogItem;
  journey: CatalogJourney;
  proposeRequest: CatalogProposeDefaults;
}

export type CatalogScenarioNode = CatalogScenario;
export interface CatalogJourneyNode extends CatalogJourney {
  scenarios: CatalogScenarioNode[];
}
export interface CatalogUseCaseNode extends CatalogItem {
  journeys: CatalogJourneyNode[];
}
export interface CatalogSubDomainNode extends CatalogItem {
  useCases: CatalogUseCaseNode[];
}
export interface CatalogIndustryNode extends CatalogItem {
  subDomains: CatalogSubDomainNode[];
}
export interface CatalogTree {
  industries: CatalogIndustryNode[];
}

export interface CatalogImportScenario {
  scenarioId: string;
  scenarioType: string;
  businessScenario?: string | null;
  description?: string | null;
  active?: boolean;
}
export interface CatalogImportJourney {
  id?: string;
  name: string;
  dataTypes?: DataType[];
  industryType?: string | null;
  domain?: string | null;
  entityKey?: string | null;
  active?: boolean;
  scenarios?: CatalogImportScenario[];
}
export interface CatalogImportUseCase {
  id?: string;
  name: string;
  proposeValue?: string | null;
  active?: boolean;
  journeys?: CatalogImportJourney[];
}
export interface CatalogImportSubDomain {
  id?: string;
  name: string;
  active?: boolean;
  useCases?: CatalogImportUseCase[];
}
export interface CatalogImportIndustry {
  id?: string;
  name: string;
  active?: boolean;
  subDomains?: CatalogImportSubDomain[];
}
export interface CatalogImportRequest {
  industries: CatalogImportIndustry[];
}

export interface LevelCount {
  created: number;
  updated: number;
}
export interface CatalogImportResponse {
  success: boolean;
  industries: LevelCount;
  subDomains: LevelCount;
  useCases: LevelCount;
  journeys: LevelCount;
  scenarios: LevelCount;
}

// ---- scenario: propose -> confirm -> generate --------------------------------------------------------------------
export interface ScenarioProposeRequest {
  requestedScenarioId: string;
  scenarioType: string;
  industryType: string;
  domain: string;
  businessScenario: string;
  typeOfData: DataType;
  country: string;
  entityKey?: string | null;
  useCase: string;
  userId?: string | null;
}

/** One variable of a proposed or confirmed schema. Only the keys the UI reads are typed. */
export interface SchemaVariable {
  name: string;
  dtype?: string;
  description?: string | null;
  gen?: string | null;
  params?: Record<string, unknown> | null;
  depends_on?: string[];
  nullable?: boolean;
  required?: boolean;
  formula?: string | null;
  scope?: string | null;
  useCase?: string | null;
  source?: string | null;
  /** Where the column sits in the delivered data (smaller comes first); the backend fills it in from the data's story order. */
  sequence?: number | null;
  [key: string]: unknown;
}

export interface ScenarioDraftResponse {
  success: boolean;
  draft_id: string;
  scenario_id: string;
  requested_scenario_id: string;
  journey: string;
  description: string;
  variables: SchemaVariable[];
  field_order: string[];
  typeOfData: DataType;
  entityKey: string | null;
  variableSources: Record<string, string>;
  conceptReport: Record<string, unknown> | null;
}

export interface VariableEdit {
  name: string;
  changes: Record<string, unknown>;
}

export interface ScenarioConfirmRequest {
  draft_id: string;
  add?: Record<string, unknown>[];
  edit?: VariableEdit[];
  delete?: string[];
  feedback?: string | null;
}

export interface ScenarioConfirmResponse {
  success: boolean;
  scenario_id: string;
  requested_scenario_id: string | null;
  scenario_id_reassigned: boolean;
  draft_id: string;
  label: string;
  journey: string;
  description: string;
  variables: SchemaVariable[];
  field_order: string[];
  typeOfData: DataType;
  entityKey: string | null;
  variableSources: Record<string, string>;
  generationSpecKey: string | null;
  specReport: Record<string, unknown> | null;
}

export interface ScenarioGenerateRequest {
  draftId?: string;
  requestedScenarioId?: string;
  /** Users/entities to generate (1..5000) */
  count?: number;
  /** Most-recent records returned per user (1..10) */
  recordsPerUser?: number;
  /** 0..2147483647; with the same seed (and asOf) a run is exactly reproducible */
  seed?: number;
  asOf?: string;
}

/** Quality report of a generation run; every score is 0..1. */
export interface ValidationReport {
  rows?: number;
  overall?: number;
  verdict?: string;
  rows_failed?: number;
  components?: { consistency?: number; clean_rows?: number; realism?: number; [key: string]: number | undefined };
  invariants?: { evaluated?: number; skipped?: number; failed?: unknown[] };
  targets?: { scored?: number; skipped?: number };
  [key: string]: unknown;
}

export interface ScenarioGenerateResponse {
  success: boolean;
  scenario_id: string;
  requested_scenario_id: string | null;
  typeOfData: DataType;
  draft_id: string | null;
  scenario_label: string;
  fields: string[];
  total_records: number;
  validation_report: ValidationReport;
  records: Record<string, unknown>[];
  entityKey: string | null;
  totalCount: number;
  recordsPerUser: number;
  errors: string[];
  record_errors: Record<string, unknown>[];
}
