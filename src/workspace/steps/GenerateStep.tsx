import { CheckCircle2, Download, FileSpreadsheet, FileText, ImageIcon, Play, RefreshCw, Table, Video, Zap } from 'lucide-react';
import { DEFAULT_RECORD_COUNT, MAX_RECORDS_PER_USER, MAX_VOLUME, RECORD_PRESETS } from '../constants';
import { type DownloadFormat } from '../types';
import { useWorkspace } from '../WorkspaceProvider';

export function GenerateStep() {
  const {
    confirmed,
    downloadFormat,
    draft,
    generated,
    handleDownloadSyntheticData,
    handleExecuteEngine,
    isExecuting,
    isExecutionComplete,
    modalities,
    recordCount,
    recordCountInputId,
    recordsPerUser,
    recordsPerUserInputId,
    setDownloadFormat,
    setRecordCount,
    setRecordsPerUser,
  } = useWorkspace();
  return (
    <section className="wb-pane col-span-12 lg:col-span-3 2xl:col-span-4 h-full min-h-0 flex flex-col bg-white border border-[#D3D2CE] rounded-xs overflow-hidden">
      {/* Scrollable Engine Parameters */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 text-xs">
        {!generated && (
          <div>
            <p className="wb-cap text-[#E31837]">Step 03 of 03</p>
            <h2 className="mt-1 text-[22px] font-medium tracking-[-0.012em] leading-[1.08]">Choose how much data to generate.</h2>
          </div>
        )}
        {/* Selected Modalities Status Indicator */}
        <div className="flex items-center justify-between p-2 rounded-xs bg-[#F1F0EC]/60 border border-[#D3D2CE] text-xs">
          <span className="text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider">
            Target Modalities
          </span>
          <div className="flex items-center gap-1">
            {modalities.text && (
              <span className="px-1.5 py-0.5 rounded-xs bg-[#247153]/10 text-[#247153] text-[10px] font-semibold flex items-center gap-1">
                <FileText className="w-2.5 h-2.5" /> Unstructured Data
              </span>
            )}
            {modalities.structured && (
              <span className="px-1.5 py-0.5 rounded-xs bg-[#185F8D]/10 text-[#185F8D] text-[10px] font-semibold flex items-center gap-1">
                <Table className="w-2.5 h-2.5" /> Structured Data
              </span>
            )}
            {modalities.vision && (
              <span className="px-1.5 py-0.5 rounded-xs bg-[#8A5200]/10 text-[#8A5200] text-[10px] font-semibold flex items-center gap-1">
                <ImageIcon className="w-2.5 h-2.5" /> Image
              </span>
            )}
            {modalities.telemetry && (
              <span className="px-1.5 py-0.5 rounded-xs bg-[#9C1936]/10 text-[#9C1936] text-[10px] font-semibold flex items-center gap-1">
                <Video className="w-2.5 h-2.5" /> Video
              </span>
            )}
          </div>
        </div>

        {/* Generation Parameters */}
        <div className="space-y-2.5 pt-1">
          {/* Volume: users (transactional) or rows (aggregational) */}
          {(() => {
            const isTransactional = (confirmed ?? draft)?.typeOfData !== 'aggregational';
            const volume = typeof recordCount === 'number' && recordCount > 0 ? recordCount : DEFAULT_RECORD_COUNT;
            const perUser = typeof recordsPerUser === 'number' && recordsPerUser > 0 ? recordsPerUser : MAX_RECORDS_PER_USER;
            return (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor={recordCountInputId} className="text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider">
                      {isTransactional ? 'Number of Users' : 'Record Volume'}
                    </label>
                    <div className="flex gap-1">
                      {RECORD_PRESETS.map(val => (
                        <button
                          key={val}
                          onClick={() => setRecordCount(val)}
                          className={`text-[10px] px-1.5 py-0.5 rounded-xs border cursor-pointer ${
                            recordCount === val
                              ? 'bg-[#0B0B0C] text-white border-[#0B0B0C]'
                              : 'bg-white border-[#D3D2CE] text-[#4A4A48]'
                          }`}
                        >
                          {val >= 1000 ? `${val / 1000}K` : val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    id={recordCountInputId}
                    type="number"
                    value={recordCount}
                    placeholder={`Enter ${isTransactional ? 'number of users' : 'record volume'} (default ${DEFAULT_RECORD_COUNT.toLocaleString()})`}
                    min={1}
                    max={MAX_VOLUME}
                    onChange={e => setRecordCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono tabular-nums text-[#0B0B0C] focus-techm"
                  />
                  <p className="mt-1 text-[10px] text-[#6B6A66]">
                    Up to {MAX_VOLUME.toLocaleString()} {isTransactional ? 'users' : 'rows'} per run.
                  </p>
                </div>

                {isTransactional && (
                  <div>
                    <label htmlFor={recordsPerUserInputId} className="block text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider mb-1">
                      Records per User
                    </label>
                    <input
                      id={recordsPerUserInputId}
                      type="number"
                      value={recordsPerUser}
                      min={1}
                      max={MAX_RECORDS_PER_USER}
                      onChange={e => setRecordsPerUser(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono tabular-nums text-[#0B0B0C] focus-techm"
                    />
                    <p className="mt-1 text-[10px] text-[#6B6A66]">
                      Up to {MAX_RECORDS_PER_USER} history records per user. This run: {(volume * perUser).toLocaleString()} records.
                    </p>
                  </div>
                )}
              </>
            );
          })()}

          {/* DISABLED: Reproducibility Seed: the seed is not offered for now (generation runs without one)
          {/ * Reproducibility Seed - Hidden by default using downward arrow option * /}
          <div className="rounded-xs border border-[#D3D2CE] bg-[#F1F0EC]/40 overflow-hidden transition-all">
            {/ * Collapsible Trigger Row with Downward Arrow Option * /}
            <div
              onClick={() => setSeedSectionExpanded(prev => !prev)}
              className="flex items-center justify-between p-2 bg-[#F1F0EC]/70 hover:bg-[#F1F0EC] cursor-pointer transition-colors select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSeedSectionExpanded(prev => !prev);
                }
              }}
              aria-expanded={seedSectionExpanded}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#E31837]" />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider">
                    Reproducibility Seed
                  </span>
                  {randomSeed !== '' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-[#E31837]/10 text-[#E31837] font-semibold border border-[#E31837]/20">
                      Seed #{randomSeed}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSeedSectionExpanded(prev => !prev);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-[#4A4A48] hover:text-[#0B0B0C] px-1.5 py-0.5 rounded-xs hover:bg-white/80 transition-colors cursor-pointer"
                title={seedSectionExpanded ? "Hide seed options" : "Show reproducibility seed options"}
              >
                <span>{seedSectionExpanded ? "Hide" : "Show Seed"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#4A4A48] transition-transform duration-200 ${
                    seedSectionExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/ * Seed Configuration Body - Kept hidden until expanded via downward arrow * /}
            {seedSectionExpanded && (
              <div className="p-2.5 pt-2 border-t border-[#D3D2CE] bg-white space-y-2 animate-in fade-in duration-150 relative">
                <div className="flex items-center justify-between mb-0.5">
                  <label htmlFor={randomSeedInputId} className="text-[10px] font-semibold text-[#4A4A48] uppercase tracking-wider">
                    Random Seed Value
                  </label>
                  <div className="flex items-center gap-1.5">
                    {/ * DISABLED: seed suggestions were fixed sample text
                    <button
                      type="button"
                      onClick={() => setShowSeedSuggestions(prev => !prev)}
                      className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded-xs border transition-colors cursor-pointer  ${
                        showSeedSuggestions
                          ? 'bg-[#E31837] text-white border-[#E31837]'
                          : 'bg-[#FFFFFF] text-[#E31837] border-[#D3D2CE] hover:border-[#E31837]'
                      }`}
                      title="View recommended seeds calibrated for your selected record volume"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Seed Suggestions</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-white/40 text-current border border-current/20">
                        {typeof recordCount === 'number' && recordCount > 0 ? (recordCount >= 1000 ? `${recordCount / 1000}K` : recordCount) : '100K'}
                      </span>
                    </button>
                    * /}
                    <button
                      type="button"
                      onClick={() => {
                        const newSeed = Math.floor(10000 + Math.random() * 90000);
                        setRandomSeed(newSeed);
                        showToast(`Generated random seed: ${newSeed}`);
                      }}
                      className="text-[10px] text-[#185F8D] hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Generate random 5-digit seed"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Re-roll
                    </button>
                  </div>
                </div>

                <input
                  id={randomSeedInputId}
                  type="number"
                  value={randomSeed}
                  placeholder="Optional seed (a whole number, 0 to 2147483647)"
                  onChange={e => setRandomSeed(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono tabular-nums text-[#0B0B0C] focus-techm"
                />

                {/ * DISABLED: volume-calibrated seed suggestions were fixed sample text; any seed reproduces the same dataset
                {/ * Volume-calibrated inline seed suggestion pill * /}
                {(() => {
                  const currentVol = typeof recordCount === 'number' && recordCount > 0 ? recordCount : 100000;
                  const topSuggested = getVolumeSeedSuggestions(recordCount)[0];
                  return (
                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span className="text-[#6B6A66]">
                        Suggested for {currentVol.toLocaleString()} records:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRandomSeed(topSuggested.seed);
                          showToast(`Applied seed ${topSuggested.seed} (${topSuggested.tag}) calibrated for ${currentVol.toLocaleString()} records`);
                        }}
                        className="text-[#E31837] hover:underline font-mono font-medium flex items-center gap-1 cursor-pointer"
                        title="Apply volume-calibrated baseline seed"
                      >
                        <span>Seed {topSuggested.seed} ({topSuggested.tag})</span>
                        <span className="text-[9px] bg-[#E31837]/10 px-1 rounded-xs font-bold">Apply</span>
                      </button>
                    </div>
                  );
                })()}

                {/ * Seed Suggestions Popup based on record volume * /}
                {showSeedSuggestions && (
                  <div className="mt-1.5 p-2.5 bg-white border border-[#D3D2CE] rounded-xs shadow-xl space-y-2 z-30 relative animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E31837]" />
                        <span className="text-[11px] font-semibold text-[#0B0B0C]">
                          Seed Suggestions ({(typeof recordCount === 'number' && recordCount > 0 ? recordCount : 100000).toLocaleString()} Records)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSeedSuggestions(false)}
                        className="text-[#4A4A48] hover:text-[#0B0B0C] p-0.5 rounded-xs cursor-pointer"
                        aria-label="Close seed suggestions"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/ * Quick Volume Switcher inside popup to test seed suggestions * /}
                    <div className="flex items-center justify-between bg-[#F1F0EC]/60 p-1.5 rounded-xs border border-[#D3D2CE] text-[10px]">
                      <span className="text-[#4A4A48] font-medium">Test volume:</span>
                      <div className="flex gap-1">
                        {[10000, 50000, 100000, 500000].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setRecordCount(v);
                              showToast(`Selected ${v >= 1000 ? `${v / 1000}K` : v} records for seed calibration`);
                            }}
                            className={`px-1.5 py-0.5 rounded-xs font-mono text-[9px] cursor-pointer transition-colors ${
                              recordCount === v
                                ? 'bg-[#E31837] text-white font-bold'
                                : 'bg-white text-[#4A4A48] border border-[#D3D2CE] hover:border-[#0B0B0C]'
                            }`}
                          >
                            {v >= 1000 ? `${v / 1000}K` : v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] text-[#4A4A48] leading-snug">
                      Calibrated PRNG seeds tailored for entropy and distribution variance at your chosen record volume:
                    </p>

                    <div className="space-y-1.5">
                      {getVolumeSeedSuggestions(recordCount).map(item => (
                        <button
                          key={item.seed}
                          type="button"
                          onClick={() => {
                            setRandomSeed(item.seed);
                            setShowSeedSuggestions(false);
                            showToast(`Applied seed ${item.seed} (${item.tag})`);
                          }}
                          className="w-full text-left p-1.5 rounded-xs border border-[#D3D2CE] hover:border-[#E31837] hover:bg-[#FFFFFF] transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-[#0B0B0C] group-hover:text-[#E31837]">
                                Seed {item.seed}
                              </span>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-[#F1F0EC] text-[#4A4A48] border border-[#D3D2CE]">
                                {item.tag}
                              </span>
                            </div>
                            <span className="text-[9px] text-[#185F8D] font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to Apply →
                            </span>
                          </div>
                          <p className="text-[10px] text-[#4A4A48] leading-tight">
                            {item.desc}
                          </p>
                          {item.rationale && (
                            <p className="text-[9px] text-[#6B6A66] leading-tight mt-0.5 italic">
                              <strong>Why this volume:</strong> {item.rationale}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t border-[#D3D2CE] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const c = typeof recordCount === 'number' && recordCount > 0 ? recordCount : 100000;
                          const optimalSeed = Math.abs((c * 2654435761) % 89999 + 10000);
                          setRandomSeed(optimalSeed);
                          setShowSeedSuggestions(false);
                          showToast(`Applied volume-tuned seed ${optimalSeed}`);
                        }}
                        className="text-[10px] text-[#185F8D] hover:underline font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <span>Auto-tune seed for volume</span>
                      </button>
                      <span className="text-[9px] text-[#6B6A66] font-mono">Deterministic PRNG</span>
                    </div>
                  </div>
                )}
                * /}
              </div>
            )}
          </div>
          */}
        </div>

        {/* DISABLED for now: Quality Verification (the validation report of the generated dataset, POST /scenario/generate)
        <div className="mt-5 pt-3.5 border-t border-[#D3D2CE]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider">
              Quality Verification
            </label>
            {generated && (
              <span className="text-[10px] font-mono text-[#4A4A48]">
                {(generated.validation_report.rows ?? generated.total_records).toLocaleString()} rows checked
              </span>
            )}
          </div>

          {(() => {
            const report = generated?.validation_report;
            const realism = report?.components?.realism;
            const rowsChecked = report?.rows ?? generated?.total_records ?? 0;
            const rowsFailed = report?.rows_failed ?? 0;
            const failedInvariants = report?.invariants?.failed?.length ?? 0;

            const qaParams = [
              {
                id: 'overall',
                title: 'Overall Quality',
                score: pct(report?.overall),
                qualifies: report?.verdict === 'pass',
                note: `Verdict: ${report?.verdict ?? 'n/a'}`
              },
              {
                id: 'consistency',
                title: 'Consistency',
                score: pct(report?.components?.consistency),
                qualifies: failedInvariants === 0,
                note: `${report?.invariants?.evaluated ?? 0} rules checked, ${failedInvariants} failed`
              },
              {
                id: 'clean_rows',
                title: 'Clean Rows',
                score: pct(report?.components?.clean_rows),
                qualifies: rowsFailed === 0,
                note: `${rowsFailed.toLocaleString()} of ${rowsChecked.toLocaleString()} rows failed a check`
              },
              {
                id: 'realism',
                title: 'Realism',
                score: pct(realism),
                qualifies: typeof realism === 'number' && realism >= 0.9,
                note: 'Passes at 90.0% or higher'
              }
            ];

            return (
              <div className="grid grid-cols-2 gap-1.5">
                {qaParams.map(param => {
                  const pending = !report;
                  const flagged = !pending && !param.qualifies;
                  return (
                    <div
                      key={param.id}
                      title={pending ? 'Run the data generation to see the quality report' : param.note}
                      className={`p-2 rounded-xs border relative transition-all ${
                        flagged
                          ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400/50 '
                          : 'bg-[#F1F0EC] border-[#D3D2CE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#4A4A48] font-medium">{param.title}</span>
                        {pending ? (
                          <span className="text-[9px] font-mono text-[#6B6A66]">PENDING</span>
                        ) : flagged ? (
                          <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-[#8A5200] bg-amber-100 px-1 py-0.2 rounded-xs border border-amber-300">
                            <AlertTriangle className="w-2.5 h-2.5 text-[#8A5200]" />
                            <span>FAIL</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-[#247153]">
                            <Check className="w-2.5 h-2.5" />
                            <span>PASS</span>
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs font-mono font-bold mt-1 ${
                          pending ? 'text-[#6B6A66]' : flagged ? 'text-[#8A5200]' : 'text-[#247153]'
                        }`}
                      >
                        <span>{pending ? '—' : param.score}</span>
                      </div>
                      {!pending && <p className="mt-0.5 text-[9px] text-[#4A4A48] leading-tight">{param.note}</p>}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
        */}
      </div>

      {/* Sticky Action Footer */}
      <div className="p-3 border-t border-[#D3D2CE] bg-[#F1F0EC] space-y-2">
        {/* Primary Action Button: Execute Data Generation (Expanded to full width) */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => void handleExecuteEngine()}
            disabled={isExecuting || !confirmed}
            className="w-full h-[42px] px-3 bg-[#E31837] hover:bg-[#C8102E] disabled:opacity-50 text-white font-semibold text-xs rounded-xs  flex items-center justify-center gap-2 focus-techm transition-all cursor-pointer"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="truncate">Generating...</span>
              </>
            ) : !confirmed ? (
              <>
                <Zap className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="truncate">Approve Schema First</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                <span className="truncate">Execute Data Generation</span>
              </>
            )}
          </button>
        </div>

        {/* Completion Message when execution finishes without popup modal */}
        {isExecutionComplete && !isExecuting && generated && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xs flex items-center gap-2 text-xs text-[#247153] ">
            <CheckCircle2 className="w-4 h-4 text-[#247153] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs text-[#247153]">Data Generation Complete</p>
              <p className="text-[11px] text-[#247153]/85 truncate">
                Successfully generated {generated.total_records.toLocaleString()} synthetic records.
              </p>
            </div>
          </div>
        )}

        {/* Download: offered once the data has been generated (CSV or JSON of the returned records) */}
        {isExecutionComplete && !isExecuting && generated && (
          <div className="bg-white p-2.5 rounded-xs border border-[#D3D2CE] space-y-2 ">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#E31837] shrink-0" />
              <span className="text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider">Download Data</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={downloadFormat}
                onChange={e => setDownloadFormat(e.target.value as DownloadFormat)}
                className="flex-1 min-w-0 p-1.5 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs font-mono font-medium text-[#0B0B0C] focus-techm cursor-pointer"
                aria-label="Select download data format"
              >
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
                {/* DISABLED: Parquet needs a server-side writer; the backend returns JSON records only
                <option value="parquet">Parquet (.parquet)</option>
                */}
              </select>
              <button
                type="button"
                onClick={() => handleDownloadSyntheticData()}
                className="shrink-0 whitespace-nowrap px-3 py-1.5 bg-[#0B0B0C] hover:bg-[#4A4A48] text-white rounded-xs text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer "
                title={`Download the generated records as ${downloadFormat.toUpperCase()}`}
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
