import React from 'react';
import { Check, CheckCircle2, ChevronDown, ChevronRight, FileText, Layers, RefreshCw } from 'lucide-react';
import { BtnLabel } from '../../components/BtnLabel';
import { COMING_SOON_DOMAINS, DATA_TYPE_OPTIONS, SCHEMA_SOURCE_OPTIONS, industryLabel, scenarioExplanation } from '../constants';
import { CSV_TEMPLATE, CSV_TEMPLATE_FILE_NAME } from '../../lib/csvImport';
import { CsvImportPanel } from '../../components/CsvImportPanel';
import { downloadText } from '../../lib/exportData';
import { getDomainVisual } from '../../lib/domainVisual';
import { useWorkspace } from '../WorkspaceProvider';

export function ScenarioStep() {
  const {
    activeDomain,
    catalog,
    countries,
    countryCode,
    csvFile,
    csvNotice,
    customerJourneys,
    draft,
    handleDomainChange,
    handleImportCsv,
    handleRunPipeline,
    handleScenarioSelect,
    handleUseCaseChange,
    inputMode,
    isPipelineRunning,
    isScenarioLoading,
    openJourneyIndex,
    pipelineRun,
    resetPipeline,
    scenarioDetail,
    selectedScenario,
    setCountryCode,
    setCsvFile,
    setCsvNotice,
    setInputMode,
    setMaxUnlockedStep,
    setOpenJourneyIndex,
    setTypeOfData,
    setWorkflowStep,
    typeOfData,
    useCaseId,
    visibleIndustries,
  } = useWorkspace();
  return (
    <section className="wb-pane col-span-12 lg:col-span-10 2xl:col-span-9 h-full min-h-0 flex flex-col bg-white border border-[#D3D2CE] border-t-2 border-t-[#E31837] rounded-xs overflow-hidden">
      <div className="h-9 min-h-9 px-3 border-b border-[#D3D2CE] flex items-center gap-2">
        <i className="inline-block w-[7px] h-[7px] bg-[#E31837]" aria-hidden="true" />
        <h2 className="wb-cap text-[#0B0B0C]">Context &amp; business input</h2>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-12 gap-x-4 gap-y-3 content-start text-xs">
        {/* Target industry (GET /catalog/industries). Only the enabled industries are shown. */}
        <div className={activeDomain ? 'col-span-12 lg:col-span-5' : 'col-span-12 flex flex-col'}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="wb-cap text-[#0B0B0C]/65">Target industry domain</label>
            {activeDomain && (
              <button
                type="button"
                onClick={() => handleDomainChange(activeDomain)}
                className="wb-link text-[#0B0B0C]/65 hover:text-[#E31837] focus-techm"
                title="Show all industry domains"
              >
                Change domain
              </button>
            )}
          </div>

          {catalog.industriesState === 'error' ? (
            <div className="p-3 text-center text-xs border border-dashed border-[#D3D2CE] rounded-xs bg-[#F1F0EC]/60 space-y-1.5">
              <p className="text-[#9C1936] font-medium">Could not load the industry domains.</p>
              <button type="button" onClick={() => void catalog.loadIndustries()} className="wb-ghost h-8 px-3 text-[12px] focus-techm">
                Retry
              </button>
            </div>
          ) : catalog.industriesState !== 'ready' ? (
            <div className="p-3 text-center text-xs text-[#6B6A66] border border-dashed border-[#D3D2CE] rounded-xs bg-[#F1F0EC]/60">
              Loading industry domains...
            </div>
          ) : visibleIndustries.length === 0 ? (
            <div className="p-3 text-center text-xs text-[#6B6A66] border border-dashed border-[#D3D2CE] rounded-xs bg-[#F1F0EC]/60">
              No industry domains are available yet.
            </div>
          ) : (
            <div className={activeDomain ? 'flex flex-col gap-2' : 'grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] auto-rows-[64px] content-start gap-2.5'}>
              {visibleIndustries
                .filter(industry => !activeDomain || activeDomain === industry.id)
                .map((industry, idx) => {
                  const { Logo, color } = getDomainVisual(industry.name);
                  if (activeDomain === industry.id) {
                    return (
                      <div key={industry.id} className="px-3 h-12 bg-[#E31837] text-white rounded-xs flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 bg-white/20 flex items-center justify-center shrink-0 rounded-xs text-white">
                          <Logo className="w-5 h-5 text-white" />
                        </span>
                        <span className="text-[15px] font-medium tracking-[-0.01em] truncate">{industryLabel(industry.name)}</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={industry.id}
                      type="button"
                      onClick={() => handleDomainChange(industry.id)}
                      style={{ '--i': idx } as React.CSSProperties}
                      className="wb-row group px-3 bg-white border border-[#D3D2CE] hover:border-[#0B0B0C] rounded-xs text-left flex items-center gap-3 cursor-pointer focus-techm"
                    >
                      <span className="w-9 h-9 bg-[#F1F0EC] flex items-center justify-center shrink-0 rounded-xs">
                        <Logo className={`w-6 h-6 ${color}`} />
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] font-medium tracking-[-0.01em] truncate group-hover:text-[#E31837] transition-colors">
                        {industryLabel(industry.name)}
                      </span>
                      <span className="wb-cap text-[#0B0B0C]/35">{String(idx + 1).padStart(2, '0')}</span>
                    </button>
                  );
                })}
              {!activeDomain && COMING_SOON_DOMAINS.map(name => {
                const { Logo } = getDomainVisual(name);
                return (
                  <div
                    key={`coming-soon-${name}`}
                    aria-disabled="true"
                    title="Not available yet"
                    className="px-3 border border-[#D3D2CE] bg-[#F1F0EC]/50 rounded-xs flex items-center gap-3 opacity-55 cursor-not-allowed select-none"
                  >
                    <span className="w-9 h-9 bg-white flex items-center justify-center shrink-0 rounded-xs grayscale"><Logo className="w-6 h-6" /></span>
                    <span className="min-w-0 flex-1 text-[15px] font-medium text-[#4A4A48] truncate">{name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Use case and country (GET /catalog/use-cases, GET /catalog/countries).
              The sub-domain choice is hidden for now: the first sub-domain of the industry is picked automatically (see the effect above). */}
          {activeDomain && (
            <div className="wb-rise mt-2.5 p-2.5 bg-[#F1F0EC] rounded-xs border border-[#D3D2CE] space-y-2">
              {/* DISABLED for now: Sub-domain dropdown. Re-enable it when a sub-domain choice is needed again.
              <div className="space-y-1">
                <label className="wb-cap text-[#0B0B0C]/65">Sub-domain</label>
                <select value={catalog.subDomainId} onChange={e => handleSubDomainChange(e.target.value)} ...>
                  {catalog.subDomains.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
              </div>
              */}
              <div className="space-y-1">
                <label className="wb-cap text-[#0B0B0C]/65">Use case</label>
                <div className="relative">
                  <select
                    value={useCaseId}
                    onChange={e => handleUseCaseChange(e.target.value)}
                    disabled={!catalog.subDomainId || catalog.useCasesState !== 'ready' || catalog.useCases.length === 0}
                    className={`w-full h-9 text-[13px] bg-white border border-[#D3D2CE] rounded-xs px-2.5 pr-8 appearance-none focus:outline-none focus:border-[#E31837] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      !useCaseId ? 'text-[#6B6A66]' : 'text-[#0B0B0C] font-medium'
                    }`}
                  >
                    <option value="">{catalog.useCasesState === 'loading' || catalog.subDomainsState === 'loading' ? 'Loading...' : 'Select a use case'}</option>
                    {catalog.useCases.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#4A4A48] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="wb-cap text-[#0B0B0C]/65">Country</label>
                <div className="relative">
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    disabled={countries.length === 0}
                    className="w-full h-9 text-[13px] font-medium text-[#0B0B0C] bg-white border border-[#D3D2CE] rounded-xs px-2.5 pr-8 appearance-none focus:outline-none focus:border-[#E31837] cursor-pointer disabled:opacity-60"
                  >
                    {countries.length === 0 && <option value={countryCode}>{countryCode}</option>}
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#4A4A48] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {useCaseId && catalog.journeysState === 'ready' ? (
                <div className="flex items-center justify-between text-[11px] text-[#247153] pt-0.5">
                  <span className="flex items-center gap-1 font-medium"><CheckCircle2 className="w-3 h-3" />Scenarios loaded</span>
                  <span className="wb-cap text-[#E31837]">{customerJourneys.length} journey{customerJourneys.length === 1 ? '' : 's'}</span>
                </div>
              ) : (
                <p className="text-[11px] text-[#6B6A66] pt-0.5">Select a use case to load its customer journeys.</p>
              )}
            </div>
          )}

          {!activeDomain && catalog.industriesState === 'ready' && visibleIndustries.length > 0 && (
            <div className="wb-rise mt-5 pt-4 border-t border-[#D3D2CE]">
              <p className="wb-cap text-[#0B0B0C]/55">How it works</p>
              <p className="mt-1 text-[15px] leading-snug text-[#0B0B0C] max-w-[62ch]">
                Pick an industry above to begin. You will not need to write a schema: we propose one for your scenario,
                or <span className="font-semibold text-[#E31837]">you can upload your own schema as a CSV</span>.
              </p>
              <ol className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                <li className="border-t border-[#0B0B0C]/20 pt-2">
                  <span className="wb-cap text-[#E31837]">01 · Scenario</span>
                  <p className="mt-1 text-[13px] leading-snug text-[#0B0B0C]/75">Choose the industry, a use case and a customer journey.</p>
                </li>
                <li className="border-t-2 border-[#E31837] pt-2">
                  <span className="wb-cap text-[#E31837]">02 · Schema</span>
                  <p className="mt-1 text-[13px] leading-snug text-[#0B0B0C]/85">
                    Let us <span className="font-semibold">propose a schema</span>, or <span className="font-semibold text-[#E31837]">upload your own CSV</span> of
                    column names and types. You review it either way.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadText(CSV_TEMPLATE_FILE_NAME, CSV_TEMPLATE, 'text/csv;charset=utf-8')}
                    className="wb-link mt-2 text-[#E31837] focus-techm"
                  >
                    Download a sample CSV
                  </button>
                </li>
                <li className="border-t border-[#0B0B0C]/20 pt-2">
                  <span className="wb-cap text-[#E31837]">03 · Generate</span>
                  <p className="mt-1 text-[13px] leading-snug text-[#0B0B0C]/75">Choose how much data you need, generate it and download it.</p>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Customer journeys and their business scenarios (GET /catalog/journeys, GET /catalog/scenarios) */}
        {activeDomain && (
          <div className="col-span-12 lg:col-span-7 min-w-0">
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label className="wb-cap text-[#0B0B0C]/65">Customer journey &amp; business scenarios</label>
              <span className={`wb-cap px-1.5 py-0.5 rounded-xs shrink-0 ${
                customerJourneys.length > 0 ? 'text-[#E31837] bg-[#E31837]/10' : 'text-[#4A4A48] bg-[#F1F0EC] border border-[#D3D2CE]'
              }`}>
                {catalog.journeysState === 'loading'
                  ? 'Loading...'
                  : customerJourneys.length > 0
                    ? `${customerJourneys.length} journeys · ${customerJourneys.reduce((acc, j) => acc + j.scenarios.length, 0)} scenarios`
                    : 'Awaiting use case'}
              </span>
            </div>
            <div className="border border-[#D3D2CE] rounded-xs divide-y divide-[#D3D2CE] bg-white overflow-hidden">
              {customerJourneys.length === 0 ? (
                <div className="p-3 bg-white text-center text-xs text-[#6B6A66]">
                  {catalog.journeysState === 'loading'
                    ? 'Loading customer journeys...'
                    : catalog.journeysState === 'ready'
                      ? 'No customer journeys are configured for this use case yet'
                      : 'Select a use case to load customer journeys'}
                </div>
              ) : (
                customerJourneys.map((journey, idx) => {
                  const isOpen = openJourneyIndex === idx;
                  const isJourneyActive = journey.scenarios.some(s => s.scenarioId === selectedScenario);
                  return (
                    <div key={journey.id} className="text-xs">
                      <button
                        type="button"
                        onClick={() => setOpenJourneyIndex(isOpen ? -1 : idx)}
                        aria-expanded={isOpen}
                        className={`w-full px-2.5 py-2 flex items-center justify-between text-left transition-colors focus-techm cursor-pointer border-l-2 ${
                          isJourneyActive ? 'bg-[#E31837]/5 border-l-[#E31837]' : 'border-l-transparent hover:bg-[#F1F0EC]'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <span className={`truncate block leading-tight text-[13px] ${isJourneyActive ? 'text-[#E31837] font-semibold' : 'text-[#0B0B0C] font-medium'}`}>
                            {idx + 1}. {journey.name}
                          </span>
                          <span className={`text-[11px] block ${isJourneyActive ? 'text-[#E31837]' : 'text-[#4A4A48]'}`}>
                            {journey.scenarios.length} business scenarios
                          </span>
                        </div>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#4A4A48] shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-[#4A4A48] shrink-0" />}
                      </button>

                      {isOpen && (
                        <div className="wb-rise px-2 pb-2 pt-1 space-y-1 bg-[#F1F0EC]/60 border-t border-[#D3D2CE] max-h-64 overflow-y-auto">
                          {journey.scenarios.map(scenario => {
                            const isSelected = selectedScenario === scenario.scenarioId;
                            return (
                              <button
                                key={scenario.scenarioId}
                                type="button"
                                onClick={() => void handleScenarioSelect(scenario)}
                                title={isSelected ? `Click to deselect ${scenario.label}` : `Click to select ${scenario.label}`}
                                aria-pressed={isSelected}
                                className="wb-choice w-full px-2 py-1.5 text-[12px] flex flex-col items-stretch gap-1 group focus-techm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0 truncate pr-1">
                                    <span className={`wb-cap px-1.5 py-0.5 rounded-xs border shrink-0 transition-colors ${
                                      isSelected ? 'bg-[#E31837] text-white border-[#E31837]' : 'bg-white text-[#0B0B0C] border-[#D3D2CE] group-hover:border-[#0B0B0C]'
                                    }`}>
                                      {scenario.scenarioId}
                                    </span>
                                    <span className={`truncate ${isSelected ? 'font-semibold text-[#E31837]' : 'text-[#0B0B0C]'}`}>{scenario.scenarioType}</span>
                                  </div>
                                  {isSelected && (isScenarioLoading
                                    ? <RefreshCw className="w-3.5 h-3.5 text-[#E31837] shrink-0 ml-1 animate-spin" />
                                    : <Check className="w-3.5 h-3.5 text-[#E31837] shrink-0 ml-1" />)}
                                </div>
                                {scenarioExplanation(scenario) && (
                                  <p className="text-[11px] leading-snug font-normal text-[#4A4A48]">{scenarioExplanation(scenario)}</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Type of data: the scenario's journey says which of these it supports (GET /catalog/scenarios/{id}) */}
        {activeDomain && useCaseId && selectedScenario && (
          <div className="wb-rise col-span-12 lg:col-span-5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-[#E31837]" />
              <label className="wb-cap text-[#0B0B0C]/65">Type of data <span className="text-[#E31837]">*</span></label>
            </div>
            <div role="radiogroup" aria-label="Type of data" className="grid grid-cols-2 gap-2.5">
              {DATA_TYPE_OPTIONS.map(option => {
                const supported = !scenarioDetail || scenarioDetail.journey.dataTypes.includes(option.value);
                const active = typeOfData === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!supported || isScenarioLoading}
                    onClick={() => {
                      if (active) return;
                      resetPipeline();
                      setTypeOfData(option.value);
                    }}
                    title={supported ? option.hint : `${option.label} data is not available for this journey`}
                    className="wb-choice p-2.5 text-xs focus-techm"
                  >
                    <span className="block text-[13px] font-semibold text-[#0B0B0C]">{option.label}</span>
                    <span className="block text-[11px] text-[#4A4A48] leading-snug mt-0.5">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Schema source: the same two choices, written the same way. Neither is promoted over the other. */}
        {activeDomain && useCaseId && selectedScenario && (
          <div className="wb-rise col-span-12 lg:col-span-7">
            <div className="flex items-center gap-1.5 mb-0.5">
              <FileText className="w-3.5 h-3.5 text-[#E31837]" />
              <label className="wb-cap text-[#0B0B0C]/65">Schema source</label>
            </div>
            <p className="text-[12px] text-[#4A4A48] mb-1.5">
              We can propose a schema for this scenario, or you can upload your own.
            </p>
            <div role="radiogroup" aria-label="Schema source" className="grid grid-cols-2 gap-2.5">
              {SCHEMA_SOURCE_OPTIONS.map(option => {
                const active = inputMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isPipelineRunning}
                    onClick={() => {
                      if (active) return;
                      resetPipeline();
                      setCsvNotice(null);
                      setInputMode(option.value);
                    }}
                    className="wb-choice p-2.5 text-xs focus-techm"
                  >
                    <span className="block text-[13px] font-semibold text-[#0B0B0C]">{option.label}</span>
                    <span className="block text-[11px] text-[#4A4A48] leading-snug mt-0.5">{option.hint}</span>
                  </button>
                );
              })}
            </div>
            {inputMode === 'import' && (
              <CsvImportPanel
                file={csvFile}
                onFile={file => {
                  if (csvFile || draft) resetPipeline();
                  setCsvNotice(null);
                  setCsvFile(file);
                }}
                disabled={isPipelineRunning}
              />
            )}
            {inputMode === 'import' && csvNotice && (
              <div role="alert" ref={el => el?.scrollIntoView({ block: 'nearest' })} className="wb-rise scroll-mb-16 mt-2 border border-[#9C1936]/40 bg-[#9C1936]/5 rounded-xs px-3 py-2 text-[12px] text-[#9C1936] flex items-start justify-between gap-3">
                <span>{csvNotice}</span>
                <button
                  type="button"
                  onClick={() => { resetPipeline(); setCsvNotice(null); setInputMode('prompt'); }}
                  className="wb-link shrink-0 text-[#9C1936] focus-techm"
                >
                  Propose instead
                </button>
              </div>
            )}
          </div>
        )}

        {/* Continue to the schema step */}
        {activeDomain && (() => {
          const hasSelectedModality = true; // structured data is always selected
          const needsFile = inputMode === 'import' && !csvFile;
          const canProceed = Boolean(
            activeDomain && useCaseId && scenarioDetail && typeOfData && !isScenarioLoading && hasSelectedModality && !isPipelineRunning && !needsFile
          );
          return (
            <div className="col-span-12 sticky -bottom-3 -mx-3 -mb-3 px-3 py-2.5 bg-white/95 backdrop-blur-xs border-t border-[#D3D2CE] z-10">
              <button
                type="button"
                onClick={() => {
                  if (!pipelineRun) {
                    void (inputMode === 'import' ? handleImportCsv() : handleRunPipeline());
                    return;
                  }
                  setMaxUnlockedStep(prev => Math.max(prev, 2) as 1 | 2 | 3);
                  setWorkflowStep(2);
                }}
                disabled={!canProceed}
                className="wb-btn w-full h-10 px-4 text-[13px] focus-techm"
                title={
                  !useCaseId
                    ? 'Select a use case first'
                    : !selectedScenario
                      ? 'Select a customer journey scenario first'
                      : isScenarioLoading
                        ? 'Loading the selected scenario...'
                        : needsFile
                          ? 'Choose the CSV file to upload'
                          : isPipelineRunning
                            ? 'Working on the schema...'
                            : inputMode === 'import' ? 'Upload the CSV and review the schema' : 'Continue to the schema step'
                }
              >
                {isPipelineRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{inputMode === 'import' ? 'Reading your CSV...' : 'Proposing the schema...'}</span>
                  </>
                ) : (
                  <BtnLabel>{!pipelineRun && inputMode === 'import' ? 'Import CSV & review schema' : 'Continue to schema'}</BtnLabel>
                )}
              </button>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
