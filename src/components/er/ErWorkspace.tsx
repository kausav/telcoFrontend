import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { exportErZip, generateErModel, getErSample, listErSamples, validateErModel } from '../../api/erApi';
import { API_BASE_URL, getApiErrorMessage } from '../../api/client';
import type { ErGenerateResult, ErPlan, ErRequest, ErSampleSummary } from '../../api/erTypes';
import { downloadBlob, downloadErTableCsv } from '../../lib/erExport';
import { notify, notifyApiError } from '../../lib/notify';
import { ErDataView } from './ErDataView';
import { ErDiagram } from './ErDiagram';
import { ErIntegrityView, type ErStatusFilter } from './ErIntegrityView';
import { ErPlanView } from './ErPlanView';

type Tab = 'diagram' | 'plan' | 'data' | 'integrity';
type Connection = { state: 'connecting' } | { state: 'ok' } | { state: 'bad'; message: string };

const TABS: [Tab, string][] = [['diagram', 'Diagram'], ['plan', 'Plan'], ['data', 'Data'], ['integrity', 'Integrity']];
const CUSTOM = '';
const VALIDATE_DELAY_MS = 500;

/** The request body from the editor text, the seed box and the row counts; or the reason it cannot be built. */
function buildRequest(text: string, seedText: string, counts: Record<string, string>): { request: ErRequest } | { problem: string } {
  let model: unknown;
  try {
    model = JSON.parse(text);
  } catch (error) {
    return { problem: `The JSON cannot be read: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!model || typeof model !== 'object' || Array.isArray(model)) return { problem: 'The model must be a JSON object.' };
  const request: ErRequest = { model: model as Record<string, unknown> };
  if (seedText.trim() !== '') {
    const seed = Number(seedText);
    if (!Number.isInteger(seed) || seed < 0) return { problem: 'The seed must be a whole number, 0 or more.' };
    request.seed = seed;
  }
  const chosen: Record<string, number> = {};
  for (const [name, value] of Object.entries(counts)) {
    if (value.trim() === '') continue;
    const count = Number(value);
    if (!Number.isInteger(count) || count < 1) return { problem: `Rows of ${name} must be a whole number, 1 or more.` };
    chosen[name] = count;
  }
  if (Object.keys(chosen).length) request.counts = chosen;
  return { request };
}

/** The table names written in the model text, or null while the text cannot be read as a model. */
function entityNames(text: string): Set<string> | null {
  try {
    const model: unknown = JSON.parse(text);
    const entities = model && typeof model === 'object' ? (model as { entities?: unknown }).entities : undefined;
    if (!Array.isArray(entities)) return null;
    return new Set(entities.map(entity => (entity && typeof entity === 'object' ? String((entity as { name?: unknown }).name) : '')));
  } catch {
    return null;
  }
}

interface Props {
  onBack: () => void;
}

/**
 * Proof-of-concept screen for the ER model feature: edit an ER model as JSON, see the plan and the diagram, generate every table
 * with referential integrity, browse the rows, read the integrity report and download the data.
 * Reached from the front page, or directly with the address ending in #/er.
 */
export function ErWorkspace({ onBack }: Props) {
  const [connection, setConnection] = useState<Connection>({ state: 'connecting' });
  const [samples, setSamples] = useState<ErSampleSummary[]>([]);
  const [sampleId, setSampleId] = useState<string>(CUSTOM);
  const [text, setText] = useState('');
  const [seedText, setSeedText] = useState('');
  const [counts, setCounts] = useState<Record<string, string>>({});

  const [plan, setPlan] = useState<ErPlan | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [result, setResult] = useState<ErGenerateResult | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);

  const [tab, setTab] = useState<Tab>('diagram');
  const [fit, setFit] = useState(true);
  const [table, setTable] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [back, setBack] = useState<{ table: string; filter: string } | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ErStatusFilter>('all');

  // ---- checking the model as it is edited ----------------------------------------------------------------------------
  const checkSeq = useRef(0);
  const immediate = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const request = useMemo(() => (text.trim() ? buildRequest(text, seedText, counts) : null), [text, seedText, counts]);

  useEffect(() => {
    const mine = (checkSeq.current += 1); // any answer still on its way for an older edit is now ignored
    if (!request || 'problem' in request) {
      setPlan(null);
      setErrors([]);
      setWarnings([]);
      setChecking(false);
      setProblem(request ? request.problem : null);
      return undefined;
    }
    setProblem(null);
    setChecking(true);
    const delay = immediate.current ? 0 : VALIDATE_DELAY_MS;
    immediate.current = false;
    const timer = setTimeout(async () => {
      try {
        const verdict = await validateErModel(request.request);
        if (!mounted.current || mine !== checkSeq.current) return; // a newer edit is already being checked
        setErrors(verdict.errors);
        setWarnings(verdict.warnings);
        setPlan(verdict.valid ? verdict.plan : null);
        if (verdict.valid && verdict.plan) {
          const roots = new Set(verdict.plan.entities.filter(e => e.role === 'root').map(e => e.name));
          setCounts(previous => (Object.keys(previous).every(name => roots.has(name)) ? previous : Object.fromEntries(Object.entries(previous).filter(([name]) => roots.has(name)))));
        }
      } catch (error) {
        if (!mounted.current || mine !== checkSeq.current) return;
        setErrors([getApiErrorMessage(error)]);
        setWarnings([]);
        setPlan(null);
      } finally {
        if (mounted.current && mine === checkSeq.current) setChecking(false);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [request]);

  // ---- loading the samples ---------------------------------------------------------------------------------------------
  const loadSample = useCallback(async (id: string) => {
    if (id === CUSTOM) return;
    try {
      const model = await getErSample(id);
      immediate.current = true;
      setSampleId(id);
      setText(JSON.stringify(model, null, 2));
      setSeedText('');
      setCounts({});
      setResult(null);
      setStale(false);
      setTable(null);
      setBack(null);
      setHighlight(null);
      setFilters({});
      setTab('diagram');
    } catch (error) {
      notifyApiError(error);
    }
  }, []);

  const connect = useCallback(async () => {
    setConnection({ state: 'connecting' });
    try {
      const list = await listErSamples();
      if (!mounted.current) return;
      setSamples(list);
      setConnection({ state: 'ok' });
      if (list.length > 0) await loadSample(list[0].id);
    } catch (error) {
      if (!mounted.current) return;
      setConnection({ state: 'bad', message: getApiErrorMessage(error) });
    }
  }, [loadSample]);

  useEffect(() => {
    void connect();
  }, [connect]);

  // ---- actions -----------------------------------------------------------------------------------------------------------
  const edited = () => setStale(true);

  const generate = async () => {
    if (busy || !request || 'problem' in request) return;
    setBusy(true);
    try {
      const outcome = await generateErModel(request.request);
      if (!outcome.ok) {
        setErrors(outcome.errors);
        setWarnings(outcome.warnings);
        setResult(null);
        setTab('diagram');
        notify('The model could not be generated. See the problems listed on the left.', 'error');
        return;
      }
      const data = outcome.result;
      setResult(data);
      setErrors([]);
      setWarnings(data.warnings);
      setTable(data.order[0] ?? null);
      setFilters({});
      setBack(null);
      setHighlight(null);
      setStale(false);
      setTab('data');
      notify(
        `${data.order.length} tables, ${data.total_records.toLocaleString()} rows in ${Math.round(data.elapsed_ms)} ms. Integrity ${data.integrity_report.passed ? 'passed' : 'FAILED'}.`,
        data.integrity_report.passed ? 'success' : 'error',
      );
    } catch (error) {
      notifyApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    if (zipBusy || !request || 'problem' in request) return;
    setZipBusy(true);
    try {
      const { blob, filename } = await exportErZip(request.request);
      downloadBlob(filename, blob);
    } catch (error) {
      notifyApiError(error, 'The download failed.');
    } finally {
      setZipBusy(false);
    }
  };

  const openTable = (name: string) => {
    if (!result) {
      notify('Generate data first to see the rows.', 'info');
      return;
    }
    setTable(name);
    setBack(null);
    setHighlight(null);
    setTab('data');
  };

  const jumpTo = (parent: string, key: string, from: string) => {
    setBack({ table: from, filter: filters[from] ?? '' });
    setTable(parent);
    setFilters(previous => ({ ...previous, [parent]: key }));
    setHighlight(key);
  };

  const goBack = () => {
    if (!back) return;
    setTable(back.table);
    setFilters(previous => ({ ...previous, [back.table]: back.filter }));
    setBack(null);
    setHighlight(null);
  };

  // ---- the screen ------------------------------------------------------------------------------------------------------------
  // A count box for each root table of the valid plan. While the model is not valid, the boxes that hold a number stay, so a count the
  // model no longer accepts can always be cleared.
  const countBoxes: { name: string; expected: number | null }[] = plan
    ? plan.entities.filter(e => e.role === 'root').map(e => ({ name: e.name, expected: e.rows_expected }))
    : Object.keys(counts).filter(name => counts[name].trim() !== '').map(name => ({ name, expected: null }));
  const staleNote = stale && result ? (
    <div className="px-2.5 py-2 rounded-lg text-[12.5px] bg-amber-100 text-amber-800 mb-2.5" data-testid="er-stale">
      The model was edited after this data was generated. Press “Generate data” to refresh it.
    </div>
  ) : null;
  const canGenerate = !busy && request !== null && !('problem' in request);

  let panel: ReactNode;
  if (tab === 'diagram') {
    panel = plan ? (
      <ErDiagram plan={plan} result={result} fit={fit} onToggleFit={() => setFit(value => !value)} onOpenTable={openTable} />
    ) : (
      <Empty>{problem ? 'Fix the JSON to see the diagram.' : errors.length ? 'Fix the problems listed on the left to see the diagram.' : checking ? 'Checking the model…' : 'Choose a sample or paste a model.'}</Empty>
    );
  } else if (tab === 'plan') {
    panel = plan ? <ErPlanView plan={plan} /> : <Empty>No valid plan yet.</Empty>;
  } else if (tab === 'data') {
    panel = result ? (
      <>
        {staleNote}
        <ErDataView
          result={result}
          table={table ?? result.order[0]}
          filter={filters[table ?? result.order[0]] ?? ''}
          highlight={highlight}
          back={back}
          zipBusy={zipBusy}
          onSelectTable={name => { setTable(name); setBack(null); setHighlight(null); }}
          onFilter={value => { setFilters(previous => ({ ...previous, [table ?? result.order[0]]: value })); setHighlight(null); }}
          onJump={jumpTo}
          onBack={goBack}
          onDownloadCsv={() => { const name = table ?? result.order[0]; downloadErTableCsv(name, result.tables[name]); }}
          onDownloadZip={() => void downloadZip()}
        />
      </>
    ) : (
      <Empty>Press “Generate data” to create the tables.</Empty>
    );
  } else {
    panel = result ? (
      <>
        {staleNote}
        <ErIntegrityView report={result.integrity_report} filter={statusFilter} onFilter={setStatusFilter} />
      </>
    ) : (
      <Empty>The integrity report appears after the data is generated.</Empty>
    );
  }

  return (
    <div className="h-screen w-screen overflow-auto flex flex-col bg-[#F6F2EA] text-[#29251D] font-sans">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 bg-white border-b border-[#E5DFD3]">
        <button type="button" onClick={onBack} className="px-3 py-1.5 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#F6F2EA] text-[13px] cursor-pointer">← Back</button>
        <span className="font-bold tracking-wide">ModelOS<small className="ml-2 font-medium text-[#6B6557] hidden sm:inline">ER model</small></span>
        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">proof of concept</span>
        <span className="flex-1" />
        <span className="flex items-center gap-2 text-[12px] text-[#6B6557]" data-testid="er-connection">
          <span className={`w-2.5 h-2.5 rounded-full ${connection.state === 'ok' ? 'bg-green-600' : connection.state === 'bad' ? 'bg-red-600' : 'bg-slate-400'}`} />
          {connection.state === 'ok' ? 'connected' : connection.state === 'bad' ? `not connected: ${connection.message}` : 'connecting…'}
        </span>
        {connection.state === 'bad' && (
          <button type="button" onClick={() => void connect()} className="px-3 py-1.5 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#F6F2EA] text-[13px] cursor-pointer">Retry</button>
        )}
        <span className="text-[11px] text-[#6B6557] hidden md:inline" title="Set VITE_API_HOST and VITE_API_TOKEN in .env">{API_BASE_URL}</span>
      </header>

      <main className="grid gap-4 p-4 md:px-5 md:pb-6 grid-cols-1 lg:grid-cols-[minmax(340px,30%)_1fr] flex-1 min-h-[640px]">
        <section aria-label="ER model" className="flex flex-col min-w-0 bg-white border border-[#E5DFD3] rounded-xl">
          <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[#E5DFD3]">
            <h2 className="text-[13px] uppercase tracking-wider text-[#6B6557] whitespace-nowrap">ER model</h2>
            <select
              aria-label="Sample model"
              value={sampleId}
              onChange={event => { const id = event.target.value; setSampleId(id); void loadSample(id); }}
              className="flex-1 min-w-0 px-2 py-1.5 border border-[#E5DFD3] rounded-lg bg-white text-[13px]"
            >
              {samples.map(sample => <option key={sample.id} value={sample.id}>{sample.name}</option>)}
              <option value={CUSTOM}>— my own model —</option>
            </select>
          </div>
          <div className="flex flex-col gap-3 p-3.5 flex-1 min-h-0">
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => void generate()}
                disabled={!canGenerate}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[13px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? 'Generating…' : 'Generate data'}
              </button>
              <label className="grid gap-1 text-[12px] text-[#6B6557] w-[120px]">
                Seed
                <input
                  type="number"
                  min={0}
                  value={seedText}
                  placeholder="model's own"
                  onChange={event => { setSeedText(event.target.value); edited(); }}
                  className="w-full px-2 py-1.5 border border-[#E5DFD3] rounded-lg bg-white text-[13px] text-[#29251D]"
                />
              </label>
            </div>
            {countBoxes.length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid="er-counts">
                {countBoxes.map(entity => (
                  <label key={entity.name} className="grid gap-0.5 text-[11px] text-[#6B6557] w-[112px]">
                    {`${entity.name} rows`}
                    <input
                      type="number"
                      min={1}
                      max={plan?.limits.max_root_count}
                      value={counts[entity.name] ?? ''}
                      placeholder={entity.expected === null ? '' : String(entity.expected)}
                      aria-label={`Rows of ${entity.name}`}
                      onChange={event => { const value = event.target.value; setCounts(previous => ({ ...previous, [entity.name]: value })); edited(); }}
                      className="w-full px-2 py-1.5 border border-[#E5DFD3] rounded-lg bg-white text-[13px] text-[#29251D]"
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="grid gap-1.5 max-h-[190px] overflow-auto" data-testid="er-messages" aria-live="polite">
              {problem && <Message kind="err">{problem}</Message>}
              {errors.map((message, index) => <Message key={`e${index}`} kind="err">{message}</Message>)}
              {warnings.map((message, index) => <Message key={`w${index}`} kind="warn">{message}</Message>)}
              {!problem && errors.length === 0 && plan && (
                <Message kind="ok">{`Model is valid: ${plan.entities.length} tables, about ${plan.projected_rows.toLocaleString()} rows.`}</Message>
              )}
            </div>
            <textarea
              value={text}
              spellCheck={false}
              aria-label="ER model JSON"
              onChange={event => {
                const next = event.target.value;
                const names = entityNames(next);
                setText(next);
                setSampleId(CUSTOM);
                if (names) setCounts(previous => Object.fromEntries(Object.entries(previous).filter(([name]) => names.has(name)))); // not for tables that are gone
                edited();
              }}
              className="w-full flex-1 min-h-[300px] resize-none border border-[#E5DFD3] rounded-lg p-2.5 bg-[#FBF9F4] font-mono text-[12.5px] leading-relaxed whitespace-pre"
            />
            <span className="text-[12px] text-[#6B6557]">Edit the JSON; the diagram and plan update as you type. The model format is described in the backend’s docs/ER_MODEL_POC.md.</span>
          </div>
        </section>

        <section aria-label="Result" className="flex flex-col min-w-0 bg-white border border-[#E5DFD3] rounded-xl">
          <div role="tablist" className="flex gap-0.5 px-2.5 border-b border-[#E5DFD3] overflow-x-auto">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`px-3.5 py-2.5 font-semibold text-[13px] border-b-2 cursor-pointer whitespace-nowrap ${tab === id ? 'text-indigo-600 border-indigo-600' : 'text-[#6B6557] border-transparent hover:text-[#29251D]'}`}
              >
                {label}
                {id === 'data' && result && <span className="ml-1.5 text-[11px] px-1.5 py-px rounded-full bg-[#EFEAE0] text-[#6B6557]">{result.total_records.toLocaleString()}</span>}
                {id === 'integrity' && result && (
                  <span className={`ml-1.5 text-[11px] px-1.5 py-px rounded-full ${result.integrity_report.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                    {result.integrity_report.passed ? 'pass' : 'fail'}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-3.5 overflow-auto flex-1 min-h-0" role="tabpanel">{panel}</div>
        </section>
      </main>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="text-[#6B6557] py-10 text-center">{children}</div>;
}

function Message({ kind, children }: { kind: 'err' | 'warn' | 'ok'; children: ReactNode }) {
  const style = { err: 'bg-red-100 text-red-700', warn: 'bg-amber-100 text-amber-800', ok: 'bg-green-100 text-green-800' }[kind];
  return <div className={`px-2.5 py-1.5 rounded-lg text-[12.5px] ${style}`}>{children}</div>;
}
