import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Layout, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  Columns,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExecutionOutcome, runPythonUiCode } from '../services/codeExecutionService';
import { evaluateUiSimilarity, UiSimilarityResult } from '../services/aiService';

interface LiveUiPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: 'javascript' | 'python';
  functionName: string;
  outcome: ExecutionOutcome | null;
  onReRun: () => void;
  title: string;
  referenceUiCode?: string;
  isUiChallenge?: boolean;
}

export const LiveUiPreviewModal: React.FC<LiveUiPreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
  functionName,
  outcome,
  onReRun,
  title,
  referenceUiCode,
  isUiChallenge = false
}) => {
  // Auto-detect Python vs JavaScript to prevent mismatch syntax crashes
  const isPythonPattern = /^\s*(def\s+|import\s+|from\s+|class\s+|#|elif\s+|lambda\s*:)/m.test(code);
  const isJsPattern = /^\s*(function\s+|const\s+|let\s+|var\s+|\/\/)/m.test(code);
  const effectiveLanguage = (language === 'javascript' && isPythonPattern && !isJsPattern)
    ? 'python'
    : (language === 'python' && isJsPattern && !isPythonPattern)
      ? 'javascript'
      : language;

  const isUiCode = isUiChallenge || /document\.|innerHTML|createElement|<div>|<button>|className|style|render|return\s*\(|<[A-Z]|<svg|<table|export default|import React/i.test(code);
  const [activeTab, setActiveTab] = useState<'ui-sandbox' | 'console-diff'>(isUiCode ? 'ui-sandbox' : 'console-diff');
  const [previewMode, setPreviewMode] = useState<'single' | 'side-by-side'>(isUiChallenge || !!referenceUiCode ? 'side-by-side' : 'single');
  const [srcDoc, setSrcDoc] = useState<string>('');
  const [referenceSrcDoc, setReferenceSrcDoc] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [similarity, setSimilarity] = useState<UiSimilarityResult | null>(null);
  const [isEvaluatingSimilarity, setIsEvaluatingSimilarity] = useState<boolean>(false);

  // Helper to construct self-contained HTML document with React 18, Babel, and Tailwind
  const buildIframeHtml = (userSnippet: string, fnName: string, isRef: boolean = false): string => {
    return `<!DOCTYPE html>
<!-- ${isRef ? 'AI Reference Standard' : 'Candidate Preview'} -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: #050505;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 1.25rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
  </style>
</head>
<body>
  <div id="root" class="w-full flex-1 flex flex-col items-center justify-center">
    <div class="flex items-center space-x-2 text-xs text-neutral-400 font-mono">
      <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
      <span>Rendering preview...</span>
    </div>
  </div>

  <script type="text/babel">
    (function() {
      const rootEl = document.getElementById('root');
      const rawCode = ${JSON.stringify(userSnippet)};
      const targetFn = ${JSON.stringify(fnName)};

      function showError(err) {
        rootEl.innerHTML = \`<div class="p-5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 font-mono text-xs space-y-3 max-w-lg mx-auto">
          <div class="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <span>⚠️ Execution Issue</span>
          </div>
          <div class="bg-black/60 p-3.5 rounded-xl border border-white/10 text-white font-mono text-xs whitespace-pre-wrap">\${err}</div>
        </div>\`;
      }

      try {
        // 1. Direct HTML markup detection
        const trimmed = rawCode.trim();
        if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
          rootEl.innerHTML = trimmed;
          return;
        }

        // 2. React Component detection
        const isReact = /function\\s+[A-Z]|const\\s+[A-Z]|class\\s+[A-Z]|return\\s*\\([\\s\\S]*<|React\\./i.test(rawCode);
        if (isReact) {
          // Mount React component
          const cleanCode = rawCode
            .replace(/export\\s+default\\s+/g, 'window.__ExportedComponent = ')
            .replace(/import\\s+.*?from.*?;/g, '');

          eval(Babel.transform(cleanCode + '\\n; window.__ComponentReady = true;', { presets: ['react'] }).code);

          const ComponentToRender = window.__ExportedComponent || window[targetFn] || window.App || window.Component;
          if (ComponentToRender) {
            const root = ReactDOM.createRoot(rootEl);
            root.render(React.createElement(ComponentToRender));
            return;
          }
        }

        // 3. Vanilla JS DOM evaluation
        const runner = new Function('root', 'document', 'window',
          rawCode + '\\n' +
          'if (typeof ' + targetFn + ' === "function") {\\n' +
          '  try { return ' + targetFn + '(); } catch(e) { return null; }\\n' +
          '}\\n' +
          'return null;'
        );
        const evalResult = runner(rootEl, document, window);

        if (evalResult instanceof HTMLElement) {
          rootEl.innerHTML = '';
          rootEl.appendChild(evalResult);
        } else if (typeof evalResult === 'string' && evalResult.includes('<') && evalResult.includes('>')) {
          rootEl.innerHTML = evalResult;
        } else if (rootEl.children.length === 1 && rootEl.children[0].textContent.includes('Rendering preview')) {
          rootEl.innerHTML = \`<div class="p-6 rounded-2xl bg-neutral-900 border border-white/10 text-white space-y-3 max-w-md text-center">
            <div class="text-xs font-mono text-emerald-400 uppercase font-bold tracking-wider">Algorithmic Function Executed</div>
            <div class="bg-black/80 p-3 rounded-xl font-mono text-xs text-neutral-300 border border-white/5">
              Result: \${evalResult !== null && evalResult !== undefined ? JSON.stringify(evalResult) : 'Done'}
            </div>
            <p class="text-[11px] text-neutral-400">Return an HTML/Tailwind string or mount a React component to preview live UI.</p>
          </div>\`;
        }
      } catch (e) {
        showError(e.message || String(e));
      }
    })();
  </script>
</body>
</html>`;
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(isUiCode ? 'ui-sandbox' : 'console-diff');
      if (isUiChallenge || referenceUiCode) {
        setPreviewMode('side-by-side');
      }
    }
  }, [isOpen, isUiCode, isUiChallenge, referenceUiCode]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsCompiling(true);

    if (effectiveLanguage === 'python') {
      runPythonUiCode(code, functionName).then(res => {
        if (!isMounted) return;
        setIsCompiling(false);
        if (res.error) {
          setSrcDoc(`<!DOCTYPE html><html><body style="background:#050505;color:#fff;padding:1.5rem;font-family:monospace;"><div style="background:#450a0a;padding:1rem;border-radius:1rem;border:1px solid #f43f5e;">⚠️ Python Execution Error:<pre>${res.error}</pre></div></body></html>`);
        } else if (res.html) {
          setSrcDoc(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body style="background:#050505;color:#fff;padding:1.5rem;">${res.html}</body></html>`);
        } else {
          setSrcDoc(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body style="background:#050505;color:#fff;padding:1.5rem;"><div style="background:#18181b;padding:1.5rem;border-radius:1rem;border:1px solid #3f3f46;"><h4 style="color:#38bdf8;">Python Result:</h4><pre>${JSON.stringify(res.returnValue)}</pre></div></body></html>`);
        }
      });
      return () => { isMounted = false; };
    }

    // Compile candidate code
    const candidateHtml = buildIframeHtml(code, functionName, false);
    setSrcDoc(candidateHtml);

    // Compile reference code if available
    const effectiveReferenceCode = referenceUiCode || `
      function Solution() {
        return (
          <div className="p-6 rounded-3xl bg-neutral-900 border border-white/10 text-white max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">Target Reference</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <h4 className="font-bold text-base tracking-tight">${title}</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">Standard responsive layout with accessible state transitions and dark-mode styling.</p>
            <button className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-xs text-white transition">Action Trigger</button>
          </div>
        );
      }
    `;
    setReferenceSrcDoc(buildIframeHtml(effectiveReferenceCode, 'Solution', true));
    setIsCompiling(false);

    // Evaluate similarity
    if (previewMode === 'side-by-side' || isUiChallenge) {
      setIsEvaluatingSimilarity(true);
      evaluateUiSimilarity(code, effectiveReferenceCode, title).then(res => {
        if (isMounted) {
          setSimilarity(res);
          setIsEvaluatingSimilarity(false);
        }
      });
    }

    return () => { isMounted = false; };
  }, [isOpen, code, functionName, effectiveLanguage, referenceUiCode, previewMode, title, isUiChallenge]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-7xl h-[92vh] flex flex-col rounded-3xl bg-neutral-950 border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Top Bar */}
          <div className="px-6 py-3.5 border-b border-white/10 bg-neutral-900/80 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Layout className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-white text-sm tracking-tight">{title}</h3>
                  {isUiChallenge && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                      UI Synthesis
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  {effectiveLanguage === 'python' ? 'Python WebAssembly' : 'HTML5 • React 18 • Tailwind CSS'}
                </div>
              </div>
            </div>

            {/* Navigation Tabs & Actions */}
            <div className="flex items-center space-x-3">
              {/* Tab Selector: Live UI vs Console & Tests */}
              <div className="flex items-center p-0.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('ui-sandbox')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                    activeTab === 'ui-sandbox' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Live UI Canvas</span>
                </button>
                <button
                  onClick={() => setActiveTab('console-diff')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                    activeTab === 'console-diff' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Console & Tests</span>
                </button>
              </div>

              {/* View Switcher: Single vs Side-by-Side (when in UI sandbox) */}
              {activeTab === 'ui-sandbox' && (
                <div className="flex items-center p-0.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setPreviewMode('single')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition ${
                      previewMode === 'single' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Candidate Implementation Only"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Single</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('side-by-side')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition ${
                      previewMode === 'side-by-side' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Side-by-Side Visual Comparison"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Side-by-Side</span>
                  </button>
                </div>
              )}

              <button
                onClick={onReRun}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition"
                title="Re-run code"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Similarity & Alignment Header Banner (in Side-by-Side mode) */}
          {activeTab === 'ui-sandbox' && previewMode === 'side-by-side' && (
            <div className="px-6 py-2.5 bg-neutral-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <span className="text-neutral-400 uppercase font-bold text-[10px] tracking-wider">AI UI Parity:</span>
                {isEvaluatingSimilarity ? (
                  <div className="flex items-center space-x-1.5 text-rose-400">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing DOM & Visual Similarity...</span>
                  </div>
                ) : similarity ? (
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                      similarity.scorePercentage >= 80 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : similarity.scorePercentage >= 60
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}>
                      {similarity.scorePercentage}% Visual Match
                    </span>
                    <span className="text-neutral-300 hidden md:inline truncate max-w-md">
                      {similarity.feedback}
                    </span>
                  </div>
                ) : (
                  <span className="text-neutral-500">Live DOM reconciliation active</span>
                )}
              </div>

              {similarity && (
                <div className="flex items-center space-x-3 text-[11px] text-neutral-400">
                  <span>DOM: <strong className="text-white">{similarity.breakdown.domFidelity}%</strong></span>
                  <span>Style: <strong className="text-white">{similarity.breakdown.stylingParity}%</strong></span>
                  <span>Responsive: <strong className="text-white">{similarity.breakdown.responsiveness}%</strong></span>
                  <span>Interactivity: <strong className="text-white">{similarity.breakdown.interaction}%</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-hidden relative bg-black">
            {activeTab === 'ui-sandbox' ? (
              previewMode === 'side-by-side' ? (
                /* Twin Side-by-Side Viewport */
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                  {/* Left: Candidate Implementation */}
                  <div className="w-full h-full flex flex-col">
                    <div className="px-4 py-2 bg-neutral-900/60 border-b border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span className="font-bold text-white uppercase tracking-wider">Candidate Implementation</span>
                      </div>
                      <span className="text-neutral-500">Live Sandboxed Frame</span>
                    </div>
                    {isCompiling ? (
                      <div className="flex-1 flex items-center justify-center space-x-2 text-xs text-neutral-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span>Compiling candidate sandbox...</span>
                      </div>
                    ) : (
                      <iframe
                        srcDoc={srcDoc}
                        title="Candidate UI Preview"
                        sandbox="allow-scripts allow-modals"
                        className="w-full flex-1 border-0 bg-neutral-950"
                      />
                    )}
                  </div>

                  {/* Right: AI Reference Target */}
                  <div className="w-full h-full flex flex-col bg-neutral-950">
                    <div className="px-4 py-2 bg-neutral-900/60 border-b border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-bold text-white uppercase tracking-wider">AI Target Reference Standard</span>
                      </div>
                      <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Target Goal
                      </span>
                    </div>
                    <iframe
                      srcDoc={referenceSrcDoc}
                      title="AI Reference UI Standard"
                      sandbox="allow-scripts allow-modals"
                      className="w-full flex-1 border-0 bg-neutral-950"
                    />
                  </div>
                </div>
              ) : (
                /* Single Viewport */
                <div className="w-full h-full flex flex-col">
                  <div className="px-4 py-2 bg-neutral-900/60 border-b border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>Interactive Sandboxed Canvas (Click / test UI elements)</span>
                    <button
                      onClick={() => setActiveTab('console-diff')}
                      className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1 underline decoration-white/20"
                    >
                      <span>View Terminal & Tests</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  {isCompiling ? (
                    <div className="flex-1 flex items-center justify-center space-x-2 text-xs text-neutral-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <span>Compiling runtime sandbox...</span>
                    </div>
                  ) : (
                    <iframe
                      srcDoc={srcDoc}
                      title="Live UI Component Sandbox"
                      sandbox="allow-scripts allow-modals"
                      className="w-full flex-1 border-0 bg-neutral-950"
                    />
                  )}
                </div>
              )
            ) : (
              /* Console & Test Suite Tab */
              <div className="w-full h-full p-6 overflow-y-auto space-y-4 font-mono text-xs text-neutral-300">
                {outcome?.error && (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-2">
                    <div className="flex items-center space-x-2 text-rose-400 font-bold">
                      <XCircle className="w-4 h-4" />
                      <span>Execution / Compilation Issue Detected</span>
                    </div>
                    <pre className="bg-black/60 p-3 rounded-xl font-mono text-xs text-white border border-rose-500/20 whitespace-pre-wrap">
                      {outcome.error}
                    </pre>
                  </div>
                )}

                {outcome?.stdout && (
                  <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider">
                        Terminal Output ({effectiveLanguage === 'python' ? 'Python sys.stdout' : 'console.log'})
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Live Streamed
                      </span>
                    </div>
                    <pre className="bg-black p-3 rounded-xl font-mono text-xs text-neutral-200 overflow-x-auto border border-white/5 whitespace-pre-wrap">
                      {outcome.stdout}
                    </pre>
                  </div>
                )}

                {outcome && (
                  <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {outcome.allPassed ? (
                        <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                          <CheckCircle className="w-4 h-4" />
                          <span>All Test Assertions Passed</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-rose-400 font-bold">
                          <XCircle className="w-4 h-4" />
                          <span>
                            {outcome.tests.length > 0 
                              ? `${outcome.tests.filter(t => t.passed).length}/${outcome.tests.length} Assertions Passed` 
                              : 'Assertions Incomplete — Review Code Syntax'}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-neutral-400">{outcome.executionTimeMs.toFixed(1)} ms</span>
                  </div>
                )}

                {outcome && outcome.tests.length > 0 ? (
                  <div className="space-y-2">
                    {outcome.tests.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border ${
                          t.passed 
                            ? 'bg-neutral-950 border-white/10' 
                            : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-white">{t.title}</span>
                          <span className={t.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {t.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <div className="text-[11px] space-y-0.5 text-neutral-400">
                          <div>Input: <code className="text-neutral-200">{t.input}</code></div>
                          <div>Expected: <code className="text-emerald-300">{t.expected}</code></div>
                          <div>Actual: <code className={t.passed ? 'text-neutral-200' : 'text-rose-300'}>{t.actual}</code></div>
                          {t.error && <div className="text-rose-400 text-[10px] mt-1">{t.error}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !outcome?.error ? (
                  <div className="text-neutral-500 text-center py-12">
                    Click "Run Tests" in the editor to view detailed test assertions and console outputs.
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3 border-t border-white/10 bg-neutral-900/80 flex items-center justify-between text-xs backdrop-blur-md">
            <span className="text-[11px] font-mono text-neutral-500">
              Live Interactive UI Render Engine • Side-by-Side Comparison & DOM Alignment Active
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition"
            >
              Close Dialogue
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
