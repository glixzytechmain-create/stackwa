import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Layout, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExecutionOutcome, runPythonUiCode } from '../services/codeExecutionService';

interface LiveUiPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: 'javascript' | 'python';
  functionName: string;
  outcome: ExecutionOutcome | null;
  onReRun: () => void;
  title: string;
}

export const LiveUiPreviewModal: React.FC<LiveUiPreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
  functionName,
  outcome,
  onReRun,
  title
}) => {
  // Auto-detect Python vs JavaScript to prevent mismatch syntax crashes
  const isPythonPattern = /^\s*(def\s+|import\s+|from\s+|class\s+|#|elif\s+|lambda\s*:)/m.test(code);
  const isJsPattern = /^\s*(function\s+|const\s+|let\s+|var\s+|\/\/)/m.test(code);
  const effectiveLanguage = (language === 'javascript' && isPythonPattern && !isJsPattern)
    ? 'python'
    : (language === 'python' && isJsPattern && !isPythonPattern)
      ? 'javascript'
      : language;

  const isUiCode = /document\.|innerHTML|createElement|<div>|<button>|className|style|render|return\s*\(|<[A-Z]|<svg|<table/i.test(code);
  const [activeTab, setActiveTab] = useState<'ui-sandbox' | 'console-diff'>(isUiCode ? 'ui-sandbox' : 'console-diff');
  const [srcDoc, setSrcDoc] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(isUiCode ? 'ui-sandbox' : 'console-diff');
    }
  }, [isOpen, isUiCode]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsCompiling(true);

    if (effectiveLanguage === 'python') {
      // Execute Python via Pyodide WebAssembly
      runPythonUiCode(code, functionName).then(res => {
        if (!isMounted) return;
        setIsCompiling(false);

        if (res.error) {
          const errHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  body { background-color: #050505; color: #ffffff; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 1.5rem; }
                </style>
              </head>
              <body>
                <div class="p-5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 font-mono text-xs space-y-3 max-w-lg mx-auto">
                  <div class="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                    <span>⚠️ Python Execution Exception</span>
                  </div>
                  <div class="bg-black/60 p-3.5 rounded-xl border border-white/10 text-white font-mono text-xs whitespace-pre-wrap">${res.error.replace(/</g, '&lt;')}</div>
                  <div class="text-[11px] text-neutral-400">Review your Python syntax or inspect the <strong>Console & Tests</strong> tab.</div>
                </div>
              </body>
            </html>
          `;
          setSrcDoc(errHtml);
          return;
        }

        if (res.html) {
          // User returned an HTML/Tailwind frontend string from Python
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  body { background-color: #050505; color: #ffffff; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 1.5rem; }
                </style>
              </head>
              <body>
                <div id="root">${res.html}</div>
              </body>
            </html>
          `;
          setSrcDoc(html);
        } else {
          // Backend algorithmic code in Python: Render Python execution monitor card
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  body { background-color: #050505; color: #ffffff; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 1.5rem; }
                </style>
              </head>
              <body>
                <div class="p-6 rounded-2xl bg-neutral-900 border border-white/10 text-white font-sans space-y-4 max-w-lg mx-auto shadow-2xl">
                  <div class="flex items-center justify-between pb-3 border-b border-white/10">
                    <div class="flex items-center space-x-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                      <span class="text-xs font-mono text-sky-300 font-bold uppercase tracking-wider">Python 3.12 WebAssembly (Pyodide)</span>
                    </div>
                    <span class="text-[10px] text-sky-400 font-mono bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">WASM Active</span>
                  </div>
                  
                  <div class="bg-black/80 p-4 rounded-xl font-mono text-xs text-neutral-200 border border-white/5 space-y-2">
                    <div class="flex justify-between items-center text-neutral-400 text-[11px]">
                      <span>Target Function:</span>
                      <span class="text-sky-300 font-bold">${functionName || 'Python Script'}</span>
                    </div>
                    <div class="flex justify-between items-center text-neutral-400 text-[11px]">
                      <span>Execution Result:</span>
                      <span class="text-emerald-400 font-bold">${res.returnValue !== null && res.returnValue !== undefined ? JSON.stringify(res.returnValue) : 'Executed successfully'}</span>
                    </div>
                    ${res.stdout ? `
                    <div class="pt-2 border-t border-white/10">
                      <div class="text-[10px] text-neutral-500 uppercase font-bold mb-1">STDOUT Stream:</div>
                      <pre class="bg-neutral-950 p-2.5 rounded-lg text-neutral-300 text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto border border-white/5 font-mono">${res.stdout.replace(/</g, '&lt;')}</pre>
                    </div>` : ''}
                  </div>

                  <div class="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20 text-sky-200 text-xs flex items-center justify-between">
                    <span>💡 To render visual UI in Python, return an HTML template string from <code>render()</code> or <code>${functionName}()</code>.</span>
                  </div>
                </div>
              </body>
            </html>
          `;
          setSrcDoc(html);
        }
      });

      return () => { isMounted = false; };
    }

    // JavaScript Execution Engine (Isolated Function evaluation)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { background-color: #050505; color: #ffffff; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 1.5rem; }
          </style>
        </head>
        <body>
          <div id="root">
            <div class="flex items-center space-x-2 text-xs text-neutral-400 font-mono">
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Compiling live component preview...</span>
            </div>
          </div>
          <script>
            (function() {
              var root = document.getElementById('root');
              var rawCode = ${JSON.stringify(code)};
              var fnName = ${JSON.stringify(functionName)};

              function renderError(msg) {
                root.innerHTML = '<div class="p-5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 font-mono text-xs space-y-3 max-w-lg mx-auto">' +
                  '<div class="flex items-center space-x-2 text-rose-400 font-bold text-sm">' +
                    '<span>⚠️ Sandbox Execution Issue</span>' +
                  '</div>' +
                  '<div class="bg-black/60 p-3.5 rounded-xl border border-white/10 text-white font-mono text-xs whitespace-pre-wrap leading-relaxed">' + msg + '</div>' +
                  '<div class="text-[11px] text-neutral-400 pt-1">Tip: To render UI, return an HTML string (e.g. <code>return "&lt;div class=...&gt;...&lt;/div&gt;"</code>) or manipulate <code>document.getElementById("root")</code>.</div>' +
                '</div>';
              }

              try {
                var evalResult = null;
                // Evaluate code safely without crashing script parser
                var runner = new Function('root', 'document', 'window',
                  rawCode + '\\n' +
                  'if (typeof ' + fnName + ' === "function") {\\n' +
                  '  try { return ' + fnName + '(); } catch(e) { return null; }\\n' +
                  '}\\n' +
                  'return null;'
                );
                evalResult = runner(root, document, window);

                if (root.children.length === 0 || (root.children.length === 1 && root.children[0].textContent.includes('Compiling live component preview'))) {
                  if (evalResult instanceof HTMLElement) {
                    root.innerHTML = '';
                    root.appendChild(evalResult);
                  } else if (typeof evalResult === 'string' && (evalResult.indexOf('<') !== -1 && evalResult.indexOf('>') !== -1)) {
                    root.innerHTML = evalResult;
                  } else {
                    root.innerHTML = '<div class="p-6 rounded-2xl bg-neutral-900 border border-white/10 text-white font-sans space-y-4 max-w-lg mx-auto">' +
                      '<div class="flex items-center justify-between pb-3 border-b border-white/10">' +
                        '<div class="flex items-center space-x-2">' +
                          '<span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>' +
                          '<span class="text-xs font-mono text-neutral-300 font-bold uppercase tracking-wider">Algorithmic Function Executed</span>' +
                        '</div>' +
                        '<span class="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>' +
                      '</div>' +
                      '<div class="bg-black/80 p-4 rounded-xl font-mono text-xs text-neutral-200 border border-white/5 space-y-1">' +
                        '<div class="text-neutral-500 text-[10px] uppercase font-bold">Return Value:</div>' +
                        '<div class="text-rose-400 font-bold">' + (evalResult !== null && evalResult !== undefined ? JSON.stringify(evalResult, null, 2) : 'Function executed successfully (no DOM node returned).') + '</div>' +
                      '</div>' +
                      '<p class="text-[11px] text-neutral-400 leading-relaxed">' +
                        'This algorithmic function did not return HTML markup. To preview interactive UI, return an HTML string or DOM node, or inspect the <strong>Console & Tests</strong> tab for terminal logs.' +
                      '</p>' +
                    '</div>';
                  }
                }
              } catch(err) {
                renderError(err.message || String(err));
              }
            })();
          </script>
        </body>
      </html>
    `;

    setSrcDoc(html);
    setIsCompiling(false);
  }, [isOpen, code, functionName, effectiveLanguage]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-3xl oled-panel rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col h-[650px] bg-neutral-950"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-neutral-900/60">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Live Execution & UI Dialogue</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Sandboxed
                  </span>
                  {effectiveLanguage === 'python' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                      Python 3.12 WASM
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {title} • <span className="font-bold text-neutral-200">{effectiveLanguage.toUpperCase()}</span>
                  {effectiveLanguage !== language && (
                    <span className="text-amber-400 text-[10px] ml-1.5">(Auto-detected)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Tab Switcher & Actions */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('ui-sandbox')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                    activeTab === 'ui-sandbox' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Live UI Preview</span>
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

          {/* Body Content */}
          <div className="flex-1 overflow-hidden relative bg-black">
            {activeTab === 'ui-sandbox' ? (
              <div className="w-full h-full flex flex-col">
                <div className="px-4 py-2 bg-neutral-900/60 border-b border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span>Interactive Sandboxed Canvas (Click / test UI elements)</span>
                  <div className="flex items-center space-x-3">
                    {effectiveLanguage === 'python' ? (
                      <span className="text-sky-400">Python WebAssembly Canvas</span>
                    ) : (
                      <span className="text-rose-400">Tailwind CSS Active</span>
                    )}
                    <button
                      onClick={() => setActiveTab('console-diff')}
                      className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1 underline decoration-white/20"
                    >
                      <span>View Terminal & Tests</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
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
            ) : (
              /* Console & Test Suite Tab */
              <div className="w-full h-full p-6 overflow-y-auto space-y-4 font-mono text-xs text-neutral-300">
                {/* Error Banner if Syntax/Compilation/Runtime Failure */}
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

                {/* Stdout / Console Output */}
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

                {/* Overall Test Status Bar */}
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

                {/* Test List */}
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
          <div className="px-6 py-3 border-t border-white/10 bg-neutral-900/60 flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono text-neutral-500">
              Live Interactive UI Render Engine • 60fps Sandboxed Frame
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
