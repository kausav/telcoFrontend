// Types for the ER model endpoints (GET /er/samples, POST /er/validate, /er/generate, /er/export).
// The contract is documented in the backend repository, docs/ER_MODEL_POC.md.

/** The ER model the user edits. Its shape is checked by the backend, so the editor treats it as opaque JSON. */
export type ErModelJson = Record<string, unknown>;

/** The body of validate, generate and export. `counts` applies to root tables only. */
export interface ErRequest {
  model: ErModelJson;
  seed?: number;
  counts?: Record<string, number>;
}

export interface ErSampleSummary {
  id: string;
  name: string;
  description: string;
  entities: number;
  relationships: number;
}

// ---- the plan (what the review screens show) -----------------------------------------------------------------------
export interface ErRange {
  min: number;
  max: number;
  weights?: Record<string, number>;
}

export type ErTableRole = 'root' | 'child' | 'junction';

export interface ErPlanColumn {
  name: string;
  kind: 'key' | 'fk' | 'column';
  /** Generator type of a key or ordinary column. */
  generator?: string;
  /** "table.column" a foreign key points at. */
  references?: string;
  relationship?: string;
}

export interface ErPlanEntity {
  name: string;
  key: string;
  role: ErTableRole;
  created_by: string | null;
  rows_expected: number;
  columns: ErPlanColumn[];
}

export type ErPlanRelationship =
  | { name: string; type: 'one_to_many'; parent: string; child: string; fk: string; children: ErRange }
  | { name: string; type: 'many_to_one'; parent: string; child: string; fk: string; null_share: number; skew: number }
  | {
      name: string;
      type: 'many_to_many';
      left: string;
      right: string;
      through: string;
      left_fk: string;
      right_fk: string;
      per_right: ErRange;
      cover_left: boolean;
    }
  | { name: string; type: 'group'; entity: string; fk: string; share: number; members: ErRange };

export type ErPlanConstraint =
  | { name: string; type: 'date_not_before_parent'; relationship: string; column: string; parent_column: string; max_days_after: number }
  | { name: string; type: 'same_as_parent'; relationship: string; column: string; parent_column: string }
  | { name: string; type: 'status_follows_parent'; relationship: string; column: string; parent_column: string; when: unknown[]; set: unknown }
  | {
      name: string;
      type: 'aggregate';
      relationship: string;
      parent_column: string;
      child_column: string | null;
      fn: 'sum' | 'count' | 'min' | 'max' | 'avg';
    };

export interface ErPlan {
  /** Table names, parents first. */
  order: string[];
  entities: ErPlanEntity[];
  relationships: ErPlanRelationship[];
  constraints: ErPlanConstraint[];
  projected_rows: number;
  limits: { max_root_count: number; max_total_rows: number; max_entities: number };
}

export interface ErValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  /** Null when the model is not valid. */
  plan: ErPlan | null;
}

// ---- the generated data ----------------------------------------------------------------------------------------------
export type ErCell = string | number | boolean | null;
export type ErRecord = Record<string, ErCell>;

export interface ErForeignKey {
  column: string;
  /** "table.column" */
  references: string;
  relationship: string;
}

export interface ErTable {
  fields: string[];
  records: ErRecord[];
  total_records: number;
  primary_key: string;
  foreign_keys: ErForeignKey[];
}

export type ErCheckStatus = 'pass' | 'fail' | 'warn' | 'info';

export interface ErCheck {
  id: string;
  kind: 'table' | 'relationship' | 'constraint' | 'column';
  scope: string;
  description: string;
  status: ErCheckStatus;
  expected: unknown;
  observed: unknown;
  /** Rule checks only. */
  rows_checked?: number;
}

export interface ErIntegrityReport {
  passed: boolean;
  summary: { checks: number; passed: number; failed: number; warnings: number; info: number; tables: number; total_rows: number };
  checks: ErCheck[];
}

export interface ErGenerateResult {
  model_name: string;
  seed: number;
  /** Table names, parents first. */
  order: string[];
  total_records: number;
  elapsed_ms: number;
  warnings: string[];
  tables: Record<string, ErTable>;
  integrity_report: ErIntegrityReport;
}

/** Generate answers 422 when the model cannot be generated; that is an expected outcome, so it is returned and not thrown. */
export type ErGenerateOutcome =
  | { ok: true; result: ErGenerateResult }
  | { ok: false; errors: string[]; warnings: string[] };
