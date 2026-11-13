import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Layout, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExecutionOutcome } from '../services/codeExecutionService';

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
  const [activeTab, setActiveTab] = useState<'ui-sandbox' | 'console-diff'>('ui-sandbox');
  const [srcDoc, setSrcDoc] = useState<string>('');

  // Detect whether code seems to contain UI rendering (HTML, JSX, DOM manipulation, or CSS)
  const isUiOriented = /document\.|innerHTML|createElement|<div>|<button>|className|style|render|return\s*\(|<[A-Z]/i.test(code);

  useEffect(() => {
    if (!isOpen) return;

    // Generate sandboxed HTML with Tailwind CSS injected
    let sandboxScript = '';

    if (isUiOriented) {
      // Wrap user code in a safe DOM runner
      sandboxScript = `
        try {
          const root = document.getElementById('root');
          
          // Execute user code
          ${code}

          // If code defines a function that returns an HTML element or string, mount it
          if (typeof ${functionName} === 'function') {
            const result = ${functionName}();
            if (result instanceof HTMLElement) {
              root.appendChild(result);
            } else if (typeof result === 'string') {
              root.innerHTML = result;
            }
          }
        } catch (err) {
          document.getElementById('root').innerHTML = \`
            <div class="p-4 rounded-xl bg-red-950/80 border border-red-500 text-red-200 font-mono text-xs">
              <strong class="block text-red-400 font-bold mb-1">Runtime Render Error:</strong>
              \${err.message}
            </div>
          \`;
        }
      `;
    } else {
      // Algorithmic visualization fallback
      sandboxScript = `
        try {
          const root = document.getElementById('root');
          let outputValue = 'Ready to execute';
          
          ${code}

          if (typeof ${functionName} === 'function') {
            try {
              outputValue = JSON.stringify(${functionName}([10, 7, 5, 8, 11, 9]), null, 2);
            } catch(e) {
              outputValue = e.message;
            }
          }

          root.innerHTML = \`
            <div class="p-6 rounded-2xl bg-neutral-900 border border-white/10 text-white font-sans space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-white/10">
                <span class="text-xs font-mono text-rose-400 uppercase font-bold tracking-wider">Live Function Evaluation</span>
                <span class="text-[11px] text-neutral-400 font-mono">Sample Input Tested</span>
              </div>
              <div class="bg-black p-4 rounded-xl font-mono text-xs text-neutral-200 overflow-x-auto border border-white/5">
                <span class="text-neutral-500 text-[10px] block mb-1">Return Value:</span>
                \${outputValue}
              </div>
              <p class="text-[11px] text-neutral-400">
                To test live UI buttons, drawers, or dialogs, return an HTML string, DOM element, or styled Tailwind nodes.
              </p>
            </div>
          \`;
        } catch (err) {
          document.getElementById('root').innerHTML = \`
            <div class="p-4 rounded-xl bg-red-950/80 border border-red-500 text-red-200 font-mono text-xs">
              <strong class="block text-red-400 font-bold mb-1">Execution Error:</strong>
              \${err.message}
            </div>
          \`;
        }
      `;
    }

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
            ${sandboxScript}
          </script>
        </body>
      </html>
    `;

    setSrcDoc(html);
  }, [isOpen, code, functionName, isUiOriented]);

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
                </h3>
                <p className="text-[11px] text-neutral-400">{title} • {language.toUpperCase()}</p>
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
                  <span className="text-rose-400">Tailwind CSS Active</span>
                </div>
                <iframe
                  srcDoc={srcDoc}
                  title="Live UI Component Sandbox"
                  sandbox="allow-scripts allow-modals"
                  className="w-full flex-1 border-0 bg-neutral-950"
                />
              </div>
            ) : (
              /* Console & Test Suite Tab */
              <div className="w-full h-full p-6 overflow-y-auto space-y-4 font-mono text-xs text-neutral-300">
                {outcome ? (
                  <div className="space-y-4">
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
                            <span>Assertions Failed — Edge Cases Detected</span>
                          </div>
                        )}
                      </div>
                      <span className="text-neutral-400">{outcome.executionTimeMs.toFixed(1)} ms</span>
                    </div>

                    {/* Test List */}
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-500 text-center py-12">
                    Click "Run Tests" in the editor to view detailed test assertions and console outputs.
                  </div>
                )}
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
