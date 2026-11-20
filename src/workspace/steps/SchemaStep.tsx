import { AlertTriangle, Check, Edit3, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { BtnLabel } from '../../components/BtnLabel';
import { GeneratedRecords } from '../../components/GeneratedRecords';
import { useWorkspace } from '../WorkspaceProvider';

export function SchemaStep() {
  const {
    activeTab,
    allShownChecked,
    canReview,
    checkedFieldIds,
    checkedFields,
    confirmed,
    draft,
    fieldFilter,
    fields,
    filteredFields,
    generated,
    handleApproveSchema,
    handleDeleteSelected,
    inputMode,
    isConfirming,
    isPipelineRunning,
    pipelineRun,
    selectedFieldId,
    setActiveTab,
    setFieldFilter,
    setSelectedFieldId,
    setVariableModal,
    setWorkflowStep,
    shownRemovable,
    someShownChecked,
    toggleAllShown,
    toggleChecked,
    workflowStep,
  } = useWorkspace();
  return (
    <section className={`wb-pane ${
      workflowStep === 2 ? 'col-span-12' : 'col-span-12 lg:col-span-9 2xl:col-span-8'
    } h-full min-h-0 flex flex-col bg-white border border-[#D3D2CE] rounded-xs overflow-hidden`}>
      {/* Dynamic Stage Workspace Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {workflowStep === 2 && (
          <div className="mb-3">
            <p className="wb-cap text-[#E31837]">Step 02 of 03</p>
            <h2 className="mt-1 text-[26px] font-medium tracking-[-0.012em] leading-[1.05]">Review the variables we will generate.</h2>
            <p className="wb-tall-only mt-1.5 text-[13px] text-[#4A4A48] max-w-[70ch]">
              {draft?.variables && inputMode === 'import'
                ? 'These come from your CSV. Remove or add variables, then approve.'
                : 'Remove the ones you do not need and add your own, then approve.'}
            </p>
          </div>
        )}
        {!pipelineRun ? (
          <div className="min-h-[240px] h-full flex flex-col items-center justify-center text-center">
            {isPipelineRunning ? (
              <>
                <RefreshCw className="w-5 h-5 text-[#E31837] animate-spin" aria-hidden="true" />
                <p className="mt-3 text-[15px] font-medium">{inputMode === 'import' ? 'Reading your CSV...' : 'Proposing the schema...'}</p>
                <p className="mt-1 text-[12px] text-[#4A4A48] max-w-sm">
                  {inputMode === 'import' ? 'Checking every row of your file.' : 'This can take a little while.'}
                </p>
                <div className="mt-4 w-full max-w-xs h-[2px] bg-[#D3D2CE] overflow-hidden">
                  <div className="h-full w-1/3 bg-[#E31837] animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-medium">No schema yet</p>
                <p className="mt-1 text-[12px] text-[#4A4A48]">Choose a scenario in Step 1 and continue.</p>
                <button type="button" onClick={() => setWorkflowStep(1)} className="wb-ghost mt-3 h-8 px-3 text-[12px] focus-techm">Go to Step 1</button>
              </>
            )}
          </div>
        ) : (
          <>
        {/* Schema <-> generated records switch (shown once POST /scenario/generate has returned) */}
        {generated && (activeTab === 'table' || activeTab === 'records') && (
          <div className="flex items-center justify-between pb-2">
            <div className="inline-flex items-center p-0.5 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs">
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1 rounded-xs text-xs transition-all cursor-pointer ${
                  activeTab === 'table' ? 'bg-white text-[#0B0B0C] font-bold ' : 'text-[#4A4A48] hover:text-[#0B0B0C] font-medium'
                }`}
              >
                Schema ({fields.length} Fields)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('records')}
                className={`px-3 py-1 rounded-xs text-xs transition-all cursor-pointer ${
                  activeTab === 'records' ? 'bg-white text-[#0B0B0C] font-bold ' : 'text-[#4A4A48] hover:text-[#0B0B0C] font-medium'
                }`}
              >
                Generated Data ({generated.total_records.toLocaleString()} records)
              </button>
            </div>
          </div>
        )}

        {/* GENERATED DATA: accordion per user (transactional) or table (aggregational) */}
        {activeTab === 'records' && generated && <GeneratedRecords result={generated} />}

        {/* TAB 1: DATA CONTRACT TABLE */}
        {activeTab === 'table' && (
          <div className="space-y-3">
            {/* Clean Table Action Bar */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#0B0B0C] uppercase tracking-wider">
                  Standard Flow Schema Variables
                </h3>
                <span className="text-[10px] font-mono text-[#247153] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs font-medium">
                  {fields.length} Fields Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteSelected}
                  disabled={!canReview || checkedFields.length === 0}
                  title={
                    !canReview
                      ? 'The schema is approved; run the pipeline again to change variables'
                      : checkedFields.length === 0
                      ? 'Tick one or more variables to delete them'
                      : `Delete the ${checkedFields.length} selected variable${checkedFields.length === 1 ? '' : 's'}`
                  }
                  className="px-2.5 py-1 text-xs rounded-xs bg-white border border-[#D3D2CE] hover:border-[#9C1936] hover:bg-red-50 text-[#9C1936] font-medium flex items-center gap-1.5 cursor-pointer  transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#D3D2CE] disabled:hover:bg-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{checkedFields.length > 0 ? `Delete selected (${checkedFields.length})` : 'Delete selected'}</span>
                </button>
                <button
                  onClick={() => setVariableModal({ mode: 'add' })}
                  disabled={!canReview}
                  title={canReview ? 'Add a variable of your own to the schema' : 'The schema is approved; run the pipeline again to change variables'}
                  className="px-2.5 py-1 text-xs rounded-xs bg-white border border-[#D3D2CE] hover:border-[#0B0B0C] text-[#0B0B0C] font-medium flex items-center gap-1.5 cursor-pointer  hover:bg-[#F1F0EC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                  <Plus className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Add variable</span>
              </button>
              </div>
              {/* DISABLED: 'Recommended Variables' dialog: not backed by the API yet
              <button
                onClick={() => setShowRecommendModal(true)}
                className="px-2.5 py-1 text-xs rounded-xs bg-[#FFFFFF] border border-[#D3D2CE] hover:border-[#0B0B0C] text-[#0B0B0C] font-medium flex items-center gap-1.5 cursor-pointer  hover:bg-[#F1F0EC] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E31837]" />
                <span>Recommended Variables</span>
              </button>
              */}
            </div>

            {/* DISABLED: adding a field by hand is not supported for a source-backed schema
            {/ * Add Field Form (collapsible) * /}
            {isAddingField && (
              <div className="p-3 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-[#0B0B0C]">
                  <span>Add New Field to Data Contract</span>
                  <button onClick={() => setIsAddingField(false)} aria-label="Cancel adding field" className="text-[#4A4A48] hover:text-[#0B0B0C]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-[#4A4A48] uppercase font-mono">Field Name</label>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={e => setNewFieldName(e.target.value)}
                      placeholder="e.g. sim_slot_index"
                      className="w-full p-1 bg-white border border-[#D3D2CE] rounded-xs text-xs focus-techm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#4A4A48] uppercase font-mono">Physical Type</label>
                    <input
                      type="text"
                      value={newFieldType}
                      onChange={e => setNewFieldType(e.target.value)}
                      className="w-full p-1 bg-white border border-[#D3D2CE] rounded-xs text-xs focus-techm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#4A4A48] uppercase font-mono">Standard Ref</label>
                    <input
                      type="text"
                      value={newFieldStandard}
                      onChange={e => setNewFieldStandard(e.target.value)}
                      className="w-full p-1 bg-white border border-[#D3D2CE] rounded-xs text-xs focus-techm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#4A4A48] uppercase font-mono">Constraint</label>
                    <input
                      type="text"
                      value={newFieldConstraint}
                      onChange={e => setNewFieldConstraint(e.target.value)}
                      className="w-full p-1 bg-white border border-[#D3D2CE] rounded-xs text-xs focus-techm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsAddingField(false)}
                    className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#4A4A48]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddField}
                    className="px-3 py-1 text-xs bg-[#E31837] text-white rounded-xs font-medium "
                  >
                    Save Field
                  </button>
                </div>
              </div>
            )}
            */}
            {/* High-Density Data Contract Table */}
            <div className="border border-[#D3D2CE] rounded-xs overflow-auto max-h-[60vh] bg-white">
              <table className="w-full min-w-[820px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F1F0EC] border-b border-[#D3D2CE] text-[#4A4A48] font-mono text-[11px]">
                    <th className="py-2 pl-3 pr-1 w-8">
                      <input
                        type="checkbox"
                        ref={el => {
                          if (el) el.indeterminate = someShownChecked && !allShownChecked;
                        }}
                        checked={allShownChecked}
                        onChange={toggleAllShown}
                        disabled={!canReview || shownRemovable.length === 0}
                        aria-label="Select all variables shown"
                        title="Select all variables shown (required variables cannot be selected)"
                        className="w-3.5 h-3.5 accent-[#E31837] cursor-pointer disabled:cursor-not-allowed"
                      />
                    </th>
                    <th className="py-2 px-2 font-semibold w-12" title="Place of the column in the delivered data. The system orders the columns (customer before account, a start date before its end date, ...)">#</th>
                    <th className="py-2 px-3 font-semibold">Field Name</th>
                    <th className="py-2 px-3 font-semibold">Source</th>
                    <th className="py-2 px-3 font-semibold">Physical Type</th>
                    <th className="py-2 px-3 font-semibold">Constraints / Distribution</th>
                    <th className="py-2 px-3 font-semibold">Sensitivity</th>
                    <th className="py-2 px-3 font-semibold">QA Status</th>
                    <th className="py-2 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D3D2CE]">
                  {filteredFields.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-xs text-[#6B6A66] bg-white">
                        <p className="font-semibold text-[#0B0B0C] mb-1">No data contract fields match current filter</p>
                        <p className="text-[11px] text-[#4A4A48] mb-3">
                          {fieldFilter === 'flagged'
                            ? 'All AST constraints are repaired and passing. There are no flagged warnings.'
                            : 'No fields match the active search or filter criteria.'}
                        </p>
                        {fieldFilter !== 'all' && (
                          <button
                            onClick={() => setFieldFilter('all')}
                            className="px-3 py-1 bg-white border border-[#D3D2CE] hover:border-[#0B0B0C] text-[#0B0B0C] font-medium rounded-xs text-xs transition-colors  cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>View All Fields</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredFields.map(field => {
                    const isFlagged = field.qaStatus === 'FLAGGED';
                    return (
                      <tr
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`hover:bg-[#F1F0EC]/60 transition-colors cursor-pointer ${
                          isFlagged ? 'bg-amber-50/50' : ''
                        } ${selectedFieldId === field.id ? 'bg-[#F1F0EC]' : ''} ${checkedFieldIds.includes(field.id) && !field.required ? 'bg-red-50/60' : ''}`}
                      >
                        <td className="py-2 pl-3 pr-1 w-8" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checkedFieldIds.includes(field.id) && !field.required}
                            onChange={() => toggleChecked(field.id)}
                            disabled={!canReview || field.required}
                            aria-label={`Select ${field.name}`}
                            title={field.required ? 'Required field (cannot be removed)' : `Select ${field.name}`}
                            className="w-3.5 h-3.5 accent-[#E31837] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="py-2 px-2 font-mono text-[11px] text-[#6B6A66]">{fields.findIndex(f => f.id === field.id) + 1}</td>

                        <td className="py-2 px-3 font-mono font-semibold text-[#0B0B0C]">
                          <div className="flex items-center gap-1.5">
                            {isFlagged ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#8A5200] shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-xs bg-[#247153] shrink-0" />
                            )}
                            <span className="block truncate max-w-[240px]" title={field.name}>{field.name}</span>
                          </div>
                        </td>

                        <td className="py-2 px-3 text-[#4A4A48]">
                          <span
                            className="inline-block max-w-[150px] truncate align-middle whitespace-nowrap px-1.5 py-0.5 rounded-xs bg-[#F1F0EC] border border-[#D3D2CE] text-[11px]"
                            title={field.standardRef}
                          >
                            {field.standardRef}
                          </span>
                        </td>

                        <td className="py-2 px-3 font-mono text-[#0B0B0C]">
                          <span className="block truncate max-w-[130px] text-[#185F8D] font-medium" title={field.physicalType}>{field.physicalType}</span>
                        </td>

                        <td className="py-2 px-3 text-[#4A4A48] font-mono text-[11px]">
                          <div className="truncate max-w-[200px]" title={field.constraints}>
                            {field.constraints}
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          <span
                            title={field.sensitivity}
                            className={`inline-block max-w-[120px] truncate align-middle whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded-xs font-medium border ${
                              field.sensitivity.includes('PII')
                                ? 'bg-red-50 text-[#9C1936] border-red-200'
                                : field.sensitivity.includes('Financial')
                                ? 'bg-amber-50 text-[#8A5200] border-amber-200'
                                : field.sensitivity.includes('Synthetic')
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-50 text-[#4A4A48] border-[#D3D2CE]'
                            }`}
                          >
                            {field.sensitivity}
                          </span>
                        </td>

                        <td className="py-2 px-3">
                          {isFlagged ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-amber-100 text-[#8A5200] font-semibold text-[10px] border border-amber-300">
                              <AlertTriangle className="w-3 h-3" /> FLAGGED
                            </span>
                          ) : field.qaStatus === 'RESOLVED' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-emerald-100 text-[#247153] font-semibold text-[10px] border border-emerald-300">
                              <Check className="w-3 h-3" /> RESOLVED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-emerald-50 text-[#247153] font-medium text-[10px] border border-emerald-200">
                              <Check className="w-3 h-3" /> PASS
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setVariableModal({ mode: 'edit', name: field.name });
                              }}
                              disabled={!canReview}
                              title={canReview ? 'Edit this variable' : 'The schema is approved; run the pipeline again to change variables'}
                              aria-label={`Edit ${field.name}`}
                              className="p-1 rounded-xs text-[#4A4A48] hover:text-[#0B0B0C] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DISABLED: ER graph, Pandera AST and stage-log tabs showed fixed sample content and are not reachable from the UI
        {/ * TAB 2: INTERACTIVE ER GRAPH * /}
        {activeTab === 'graph' && (
          <div className="h-full border border-[#D3D2CE] rounded-xs bg-[#F1F0EC]/30 p-4 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#4A4A48]">
              <span>Entity Relational Dependency Graph (DuckDB Physical Schema Mapping)</span>
              <span className="font-mono text-[11px]">4 Core Nodes · 5 Relational Edges</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/ * Node 1: Subscriber Account * /}
              <div className="bg-white border border-[#D3D2CE] rounded-xs p-3 ">
                <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5 mb-2">
                  <span className="font-semibold text-xs text-[#0B0B0C]">tmf_subscriber_account</span>
                  <span className="text-[10px] font-mono text-[#E31837]">TMF 654</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-[#4A4A48]">
                  <div className="flex justify-between">
                    <span className="text-[#0B0B0C] font-semibold">PK msisdn</span>
                    <span>VARCHAR(15)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>account_balance</span>
                    <span>DECIMAL(10,2)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>data_depletion_pct</span>
                    <span>FLOAT(4)</span>
                  </div>
                </div>
              </div>

              {/ * Node 2: 5G CDR Stream * /}
              <div className="bg-white border border-[#8A5200] rounded-xs p-3 ">
                <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5 mb-2">
                  <span className="font-semibold text-xs text-[#0B0B0C]">cdr_telemetry_stream</span>
                  <span className="text-[10px] font-mono text-[#8A5200]">3GPP TS 32.298</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-[#4A4A48]">
                  <div className="flex justify-between">
                    <span className="text-[#0B0B0C] font-semibold">FK msisdn</span>
                    <span className="text-emerald-700">1:N edge</span>
                  </div>
                  <div className="flex justify-between">
                    <span>cdr_event_raw</span>
                    <span className="text-amber-700 font-semibold">JSONB (Warning)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>network_slice_id</span>
                    <span>VARCHAR(32)</span>
                  </div>
                </div>
              </div>

              {/ * Node 3: Product Ordering * /}
              <div className="bg-white border border-[#D3D2CE] rounded-xs p-3 ">
                <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5 mb-2">
                  <span className="font-semibold text-xs text-[#0B0B0C]">tmf_product_order</span>
                  <span className="text-[10px] font-mono text-[#185F8D]">TMF 622</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-[#4A4A48]">
                  <div className="flex justify-between">
                    <span>order_id</span>
                    <span>UUID</span>
                  </div>
                  <div className="flex justify-between">
                    <span>topup_channel</span>
                    <span>USSD | APP</span>
                  </div>
                </div>
              </div>

              {/ * Node 4: Churn Propensity * /}
              <div className="bg-white border border-[#D3D2CE] rounded-xs p-3 ">
                <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5 mb-2">
                  <span className="font-semibold text-xs text-[#0B0B0C]">churn_prediction_target</span>
                  <span className="text-[10px] font-mono text-purple-700">MEF LSO</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-[#4A4A48]">
                  <div className="flex justify-between">
                    <span>churn_risk_score</span>
                    <span>FLOAT(3)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>hazard_rate</span>
                    <span>Weibull(λ=0.04)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/ * TAB 3: AST RULE MATRIX * /}
        {activeTab === 'ast' && (
          <div className="space-y-3">
            <div className="p-3 bg-white border border-[#D3D2CE] rounded-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0B0B0C]">Pandera Python AST Schema Spec</span>
                <span className="text-[11px] font-mono text-[#247153]">12 Checks Active</span>
              </div>
              <pre className="p-2.5 bg-[#0B0B0C] text-emerald-400 rounded-xs text-[11px] font-mono leading-relaxed overflow-x-auto">
{`import pandera as pa
from pandera.typing import Series

class TelecomSyntheticSchema(pa.DataFrameModel):
    msisdn: Series[str] = pa.Field(str_matches=r'^\\+[1-9]\\d{9,14}$')
    account_balance: Series[float] = pa.Field(ge=0.0, le=2500.0)
    data_depletion_pct: Series[float] = pa.Field(ge=0.0, le=100.0)
    churn_risk_score: Series[float] = pa.Field(ge=0.0, le=1.0)

    @pa.check("cdr_event_raw")
    def validate_cdr_integrity(cls, series):
  # Stage 3 Flag: Enforces 3GPP Session Token linkage
  return series.apply(lambda x: "gNodeB_session_id" in x)`}
              </pre>
            </div>

            {/ * Live AST Sandbox * /}
            <div className="p-3 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs space-y-2">
              <span className="text-xs font-semibold text-[#0B0B0C]">Interactive AST Expression Evaluator</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sandboxExpr}
                  onChange={e => setSandboxExpr(e.target.value)}
                  className="flex-1 p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
                />
                <input
                  type="text"
                  value={sandboxValue}
                  onChange={e => setSandboxValue(e.target.value)}
                  placeholder="Test val"
                  className="w-24 p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
                />
                <button
                  onClick={() => {
                    const val = parseFloat(sandboxValue);
                    const passed = !isNaN(val) && val >= 0;
                    setSandboxResult({
                      passed,
                      message: passed
                        ? `Pandera AST Check Evaluated: PASS (Value ${sandboxValue} satisfies constraint)`
                        : `Pandera AST Check Evaluated: FAIL (Negative value violates non_negative constraint)`
                    });
                  }}
                  className="px-3 py-1.5 bg-[#0B0B0C] text-white rounded-xs text-xs font-medium hover:bg-[#0B0B0C]"
                >
                  Eval AST
                </button>
              </div>
              <div className={`p-2 rounded-xs text-xs font-mono border ${
                sandboxResult.passed ? 'bg-emerald-50 text-[#247153] border-emerald-200' : 'bg-red-50 text-[#9C1936] border-red-200'
              }`}>
                {sandboxResult.message}
              </div>
            </div>
          </div>
        )}

        {/ * TAB 4: STAGE DETAILS & PIPELINE LOGS * /}
        {activeTab === 'stageDetails' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-white border border-[#D3D2CE] rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#0B0B0C]">
                  Stage {activeStage} Execution Inspection
                </span>
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-emerald-50 text-[#247153] border border-emerald-200">
                  STATUS: {stageStatuses[activeStage]}
                </span>
              </div>

              {activeStage === 1 && (
                <div className="space-y-2 text-[#4A4A48]">
                  <p><strong>Dynamic Sub-Schema Extraction:</strong> RAG semantic vector similarity search against SID / TMF SQLite catalogue.</p>
                  <div className="p-2 bg-[#F1F0EC] rounded-xs font-mono text-[11px] space-y-1">
                    <div>Target SID Root: <code>TMF 622 ProductOrder / TMF 654 Bucket</code></div>
                    <div>Pruned Entities: 1,420 SID classes reduced to 4 focused domain models</div>
                    <div>Embedding Similarity Score: 0.941 Cosine</div>
                  </div>
                </div>
              )}

              {activeStage === 2 && (
                <div className="space-y-2 text-[#4A4A48]">
                  <p><strong>Schema Synthesis & Parameterization:</strong> Gemini + Instructor + Pydantic v2 code generator output.</p>
                  <div className="p-2 bg-[#F1F0EC] rounded-xs font-mono text-[11px] space-y-1">
                    <div>Fitted Distributions: LogNormal(account_balance), Beta(data_depletion)</div>
                    <div>Synthesized Constraints: 6 Pydantic validators generated</div>
                    <div>Compilation Time: 142ms</div>
                  </div>
                </div>
              )}

              {activeStage === 5 && (
                <div className="space-y-2 text-[#4A4A48]">
                  <p><strong>Final Data Contract Compilation:</strong> DuckDB Columnar table DDL & Arrow IPC buffer allocation.</p>
                  <div className="p-2 bg-[#F1F0EC] rounded-xs font-mono text-[11px] space-y-1">
                    <div>Engine Target: DuckDB In-Process Vector Engine</div>
                    <div>Target Buffer: Apache Arrow RecordBatch (Zero-Copy)</div>
                    <div>Output Format: Parquet with Snappy compression</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        */}
          </>
        )}
      </div>

      {/* Approval bar: shown on Step 2, and on Step 3 only while the schema is not approved */}
      {(workflowStep === 2 || !confirmed) && (
        <div className="h-12 min-h-12 border-t border-[#D3D2CE] bg-[#F1F0EC] px-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => void handleApproveSchema()}
            disabled={!pipelineRun || !draft || isConfirming}
            className="wb-btn h-9 px-4 text-[13px] focus-techm"
          >
            {isConfirming ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Approving schema...</span>
              </>
            ) : (
              <BtnLabel>{workflowStep === 2 ? 'Approve & continue to generate' : 'Approve changes'}</BtnLabel>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
