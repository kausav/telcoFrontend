import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import { type AstRuleItem, INITIAL_AST_RULES } from './data/qualityRules';

export function QualityGatesView({
  onBack,
  onResolveWarnings,
  showToast
}: {
  onBack: () => void;
  onResolveWarnings: () => void;
  showToast: (msg: string) => void;
}) {
  const [rules, setRules] = useState<AstRuleItem[]>(INITIAL_AST_RULES);
  const [dpEpsilon, setDpEpsilon] = useState<number>(0.5);
  const [testingExpr, setTestingExpr] = useState<string>("account_balance >= 0.00");
  const [testValue, setTestValue] = useState<string>("125.40");
  const [testResult, setTestResult] = useState<string>("PASS: Value 125.40 satisfies predicate");

  const toggleRule = (id: string) => {
    setRules(prev =>
      prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    showToast('Updated Pandera AST rule gate status.');
  };

  const flaggedCount = rules.filter(r => r.status === 'FLAGGED' && r.enabled).length;

  return (
    <main className="flex-1 h-full overflow-hidden bg-[#F1F0EC] p-2 flex flex-col">
      {/* Top Header */}
      <div className="h-10 min-h-10 border border-[#D3D2CE] rounded-t-lg bg-white px-3 flex items-center justify-between ">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs text-[#0B0B0C] hover:border-[#0B0B0C] font-medium focus-techm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Canvas</span>
          </button>
          <div className="h-4 w-[1px] bg-[#D3D2CE]" />
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-semibold text-[#0B0B0C] uppercase tracking-wider">
              Pandera AST Quality Gates & Differential Privacy Center
            </h2>
          </div>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded-xs border ${
              flaggedCount > 0
                ? 'bg-amber-50 text-[#8A5200] border-amber-200'
                : 'bg-emerald-50 text-[#247153] border-emerald-200'
            }`}
          >
            {flaggedCount > 0 ? `${flaggedCount} AST Check Flagged` : 'All Gates Passing'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {flaggedCount > 0 && (
            <button
              onClick={() => {
                setRules(prev => prev.map(r => (r.id === 'r4' ? { ...r, status: 'PASS', message: 'Auto-resolved via session synthetic link generator' } : r)));
                onResolveWarnings();
              }}
              className="px-2.5 py-1 text-xs bg-[#8A5200] text-white rounded-xs font-medium  hover:bg-[#6c4000]"
            >
              Auto-Resolve Flagged Rule
            </button>
          )}
          <button
            onClick={() => showToast('Re-evaluated all 14 Pandera AST Quality Gates: 100% compliant.')}
            className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#0B0B0C] hover:border-[#0B0B0C] font-medium flex items-center gap-1.5 "
          >
            <RefreshCw className="w-3 h-3" />
            <span>Run QA Suite</span>
          </button>
        </div>
      </div>

      {/* 2-Column Body */}
      <div className="flex-1 grid grid-cols-12 gap-2 pt-2 overflow-hidden">
        {/* Left Column: Rules Matrix Table (Span 8) */}
        <section className="col-span-8 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs  overflow-hidden">
          <div className="p-2.5 border-b border-[#D3D2CE] bg-[#F1F0EC]/40 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider">
              Active AST Constraint Predicates
            </span>
            <span className="text-[10px] text-[#4A4A48] font-mono">
              {rules.filter(r => r.enabled).length} of {rules.length} enabled
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F1F0EC] text-[#4A4A48] border-b border-[#D3D2CE] text-[11px] font-semibold sticky top-0">
                <tr>
                  <th className="p-2 w-12 text-center">Gate</th>
                  <th className="p-2">Rule Identifier</th>
                  <th className="p-2">Field</th>
                  <th className="p-2">Pandera AST Expression</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D2CE] font-mono text-[11px]">
                {rules.map(r => (
                  <tr key={r.id} className="hover:bg-[#F1F0EC]/40">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={() => toggleRule(r.id)}
                        className="rounded-xs border-[#D3D2CE] text-[#E31837] focus:ring-[#0B0B0C]"
                      />
                    </td>
                    <td className="p-2 font-semibold text-[#0B0B0C]">{r.name}</td>
                    <td className="p-2 text-[#4A4A48]">{r.field}</td>
                    <td className="p-2 text-[#185F8D] font-mono text-[10px] truncate max-w-xs">{r.expression}</td>
                    <td className="p-2">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs text-[10px] font-sans font-semibold ${
                          r.status === 'PASS'
                            ? 'bg-emerald-50 text-[#247153] border border-emerald-200'
                            : 'bg-amber-50 text-[#8A5200] border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Privacy Budget & AST Evaluator (Span 4) */}
        <section className="col-span-4 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs  overflow-hidden p-3 space-y-3.5">
          {/* Privacy Budget */}
          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-semibold text-[#0B0B0C]">Differential Privacy (DP) Budget</span>
              <span className="font-mono font-bold text-[#E31837]">ε = {dpEpsilon}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={dpEpsilon}
              onChange={e => setDpEpsilon(parseFloat(e.target.value))}
              className="w-full accent-[#E31837]"
            />
            <div className="flex justify-between text-[10px] text-[#4A4A48] mt-1 font-mono">
              <span>High Privacy (ε=0.1)</span>
              <span>High Fidelity (ε=2.0)</span>
            </div>
          </div>

          {/* Statistical Drift Metrics */}
          <div className="border border-[#D3D2CE] rounded-xs p-2.5 bg-[#F1F0EC]/40 space-y-2">
            <span className="text-[11px] font-semibold text-[#4A4A48] uppercase tracking-wider block">
              Statistical Fidelity Metrics
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-xs border border-[#D3D2CE]">
                <div className="text-[10px] text-[#4A4A48]">KS-Test Drift</div>
                <div className="font-bold text-[#247153] font-mono">0.012 (Pass)</div>
              </div>
              <div className="p-2 bg-white rounded-xs border border-[#D3D2CE]">
                <div className="text-[10px] text-[#4A4A48]">Mutual Info</div>
                <div className="font-bold text-[#247153] font-mono">0.94 (Pass)</div>
              </div>
            </div>
          </div>

          {/* Interactive Live AST Sandbox */}
          <div className="border border-[#D3D2CE] rounded-xs p-2.5 bg-white space-y-2 flex-1 flex flex-col">
            <span className="text-[11px] font-semibold text-[#0B0B0C] uppercase tracking-wider">
              Live AST Predicate Sandbox
            </span>

            <div className="space-y-1.5 flex-1">
              <div>
                <label className="text-[10px] text-[#4A4A48]">Predicate Expression:</label>
                <input
                  type="text"
                  value={testingExpr}
                  onChange={e => setTestingExpr(e.target.value)}
                  className="w-full p-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#4A4A48]">Sample Test Value:</label>
                <input
                  type="text"
                  value={testValue}
                  onChange={e => {
                    const val = e.target.value;
                    setTestValue(val);
                    const n = parseFloat(val);
                    if (!isNaN(n) && n >= 0) {
                      setTestResult(`PASS: Value ${val} satisfies predicate`);
                    } else {
                      setTestResult(`FAIL: Value ${val} breaches constraint`);
                    }
                  }}
                  className="w-full p-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs font-mono"
                />
              </div>

              <div className="p-2 rounded-xs bg-[#0B0B0C] text-emerald-400 font-mono text-[10px] mt-2">
                {testResult}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// 4. AUDIT LOGS VIEW
