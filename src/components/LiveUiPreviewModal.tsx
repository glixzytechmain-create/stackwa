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
import { ExecutionOutcome, runPythonUiCode, ProblemTestCase } from '../services/codeExecutionService';
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
  testCases?: ProblemTestCase[];
  solutionCode?: string;
  description?: string;
}

// Helper to replace function in source code respecting nested braces
function replaceFunctionInSource(source: string, fnName: string, newCode: string): string {
  // Pattern 1: function fnName(...) { ... }
  const fnPattern = new RegExp(`(?:async\\s+)?function\\s+${fnName}\\s*\\([^)]*\\)\\s*\\{`);
  let match = fnPattern.exec(source);
  if (match) {
    const startIndex = match.index;
    const braceIndex = startIndex + match[0].length - 1; // index of '{'
    let depth = 1;
    let endIndex = -1;
    for (let i = braceIndex + 1; i < source.length; i++) {
      const char = source[i];
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    if (endIndex !== -1) {
      return source.slice(0, startIndex) + newCode + source.slice(endIndex);
    }
  }

  // Pattern 2: const/let/var fnName = (...) => { ... } or function(...) { ... }
  const varPattern = new RegExp(`(?:const|let|var)\\s+${fnName}\\s*=\\s*(?:async\\s*)?(?:function\\s*\\([^)]*\\)|\\([^)]*\\)\\s*=>|[a-zA-Z0-9_$]+\\s*=>)\\s*\\{`);
  match = varPattern.exec(source);
  if (match) {
    const startIndex = match.index;
    const braceIndex = startIndex + match[0].length - 1; // index of '{'
    let depth = 1;
    let endIndex = -1;
    for (let i = braceIndex + 1; i < source.length; i++) {
      const char = source[i];
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          let semi = i + 1;
          while (semi < source.length && (source[semi] === ' ' || source[semi] === ';')) {
            if (source[semi] === ';') { semi++; break; }
            semi++;
          }
          endIndex = semi;
          break;
        }
      }
    }
    if (endIndex !== -1) {
      return source.slice(0, startIndex) + newCode + source.slice(endIndex);
    }
  }

  return source;
}

// Helper to inject candidate function implementation into the UI reference harness
function injectCandidateCodeIntoUi(referenceCode: string, candidateCode: string, fnName: string): string {
  // 1. First attempt robust in-place replacement of the function in reference code
  let result = replaceFunctionInSource(referenceCode, fnName, candidateCode);

  // 2. Prepare override script that assigns window[fnName] and candidateCode
  const candidateOverrideScript = `
<script>
  (function() {
    try {
      ${candidateCode}
      if (typeof ${fnName} !== 'undefined') {
        window['${fnName}'] = ${fnName};
      }
    } catch(err) {
      console.warn("Candidate injection warning:", err);
    }
  })();
</script>
`;

  // 3. Prepare reactive trigger script that dispatches events after DOM is ready and keeps candidate interactions reactive
  const reactiveRefreshScript = `
<script>
  (function() {
    var isUpdating = false;
    function triggerUpdate() {
      if (isUpdating) return;
      isUpdating = true;
      try {
        ${candidateCode}
        if (typeof ${fnName} !== 'undefined') {
          window['${fnName}'] = ${fnName};
        }
        if (typeof updateUI === 'function') updateUI();
        if (typeof render === 'function') render();
        if (typeof calculate === 'function') calculate();
        if (typeof update === 'function') update();
        if (typeof renderRange === 'function') renderRange();
      } catch(e) {
        console.warn("Reactive update warning:", e);
      } finally {
        isUpdating = false;
      }
    }

    // Attach capturing listeners so dragging sliders, typing inputs, and scrolling dynamically invokes candidate code
    document.addEventListener('input', function() { setTimeout(triggerUpdate, 0); }, true);
    document.addEventListener('change', function() { setTimeout(triggerUpdate, 0); }, true);
    window.addEventListener('scroll', function() { setTimeout(triggerUpdate, 0); }, true);

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(triggerUpdate, 50);
      setTimeout(triggerUpdate, 200);
    } else {
      window.addEventListener('DOMContentLoaded', function() {
        setTimeout(triggerUpdate, 50);
        setTimeout(triggerUpdate, 200);
      });
    }
  })();
</script>
`;

  if (result.includes('</body>')) {
    result = result.replace('</body>', `${candidateOverrideScript}${reactiveRefreshScript}</body>`);
  } else {
    result = `${result}${candidateOverrideScript}${reactiveRefreshScript}`;
  }

  return result;
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
  isUiChallenge = false,
  testCases = [],
  solutionCode = '',
  description = ''
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
  const buildIframeHtml = (userSnippet: string, fnName: string, isRef: boolean = false, cases: ProblemTestCase[] = []): string => {
    const trimmed = userSnippet.trim();

    // 1. If it's already a full HTML document, make sure Tailwind and React are present and return directly
    if (trimmed.toLowerCase().startsWith('<!doctype html') || trimmed.toLowerCase().startsWith('<html')) {
      let htmlDoc = trimmed;
      if (!htmlDoc.includes('tailwindcss.com')) {
        htmlDoc = htmlDoc.replace('<head>', '<head><script src="https://cdn.tailwindcss.com"></script>');
      }
      return htmlDoc;
    }

    // 2. Check if it's an HTML fragment (starts with < and contains HTML markup tags)
    const isHtmlFragment = /^\s*<[a-z!]/i.test(trimmed) && (trimmed.includes('</') || trimmed.endsWith('/>') || trimmed.includes('<script'));
    if (isHtmlFragment) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: #050505;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 1.25rem;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  ${trimmed}
</body>
</html>`;
    }

    // 3. React Component or JSX detection
    const isReact = /function\s+[A-Z]|const\s+[A-Z]|class\s+[A-Z]|return\s*\(|React\.|<[A-Z][a-zA-Z0-9]*\b|<div|<button|<span|<p\b|<form\b/i.test(trimmed);
    if (isReact) {
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
      const rawCode = ${JSON.stringify(trimmed)};
      const targetFn = ${JSON.stringify(fnName)};

      const { useState, useEffect, useMemo, useCallback, useRef } = React;
      window.useState = useState;
      window.useEffect = useEffect;
      window.useMemo = useMemo;
      window.useCallback = useCallback;
      window.useRef = useRef;

      function showError(err) {
        rootEl.innerHTML = \`<div class="p-5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 font-mono text-xs space-y-3 max-w-lg mx-auto">
          <div class="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <span>⚠️ Component Render Error</span>
          </div>
          <div class="bg-black/60 p-3.5 rounded-xl border border-white/10 text-white font-mono text-xs whitespace-pre-wrap">\${err}</div>
        </div>\`;
      }

      try {
        const cleanCode = rawCode
          .replace(/export\\s+default\\s+/g, 'window.__ExportedComponent = ')
          .replace(/import\\s+.*?from.*?;/g, '');

        window.__ExportedComponent = null;
        window.__TargetComponent = null;

        eval(Babel.transform(\`
          \${cleanCode}
          try { if (typeof \${targetFn} !== 'undefined') window.__TargetComponent = \${targetFn}; } catch(e) {}
          try { if (typeof App !== 'undefined') window.__TargetComponent = App; } catch(e) {}
          try { if (typeof Solution !== 'undefined') window.__TargetComponent = Solution; } catch(e) {}
          try { if (typeof Component !== 'undefined') window.__TargetComponent = Component; } catch(e) {}
        \`, { presets: ['react'] }).code);

        const Comp = window.__ExportedComponent || window.__TargetComponent;
        if (Comp && typeof Comp === 'function') {
          const root = ReactDOM.createRoot(rootEl);
          root.render(React.createElement(Comp));
          return;
        }

        // Vanilla DOM check inside React branch
        if (rootEl.children.length === 1 && rootEl.children[0].textContent.includes('Rendering preview')) {
          rootEl.innerHTML = \`<div class="p-6 rounded-2xl bg-neutral-900 border border-white/10 text-white space-y-3 max-w-md text-center">
            <div class="text-xs font-mono text-emerald-400 uppercase font-bold tracking-wider">Mounted Successfully</div>
            <p class="text-[11px] text-neutral-400">Component initialized without visual output.</p>
          </div>\`;
        }
      } catch (e) {
        showError(e.message || String(e));
      }
    })();
  </script>
</body>
</html>`;
    }

    // 4. Algorithmic / Vanilla JavaScript Function: Interactive Playground
    return `<!DOCTYPE html>
<!-- ${isRef ? 'AI Reference Standard' : 'Candidate Preview'} -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: #050505;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 1.25rem;
      min-height: 100vh;
    }
  </style>
</head>
<body class="flex flex-col items-center justify-center">
  <div id="algo-container" class="w-full max-w-xl mx-auto space-y-4">
    <!-- Header -->
    <div class="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Live Function Inspector</span>
        </div>
        <span class="text-[11px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-md border border-white/5">${isRef ? 'Reference Logic' : 'Candidate Logic'}</span>
      </div>
      <div class="font-mono text-sm font-semibold text-white truncate">
        function <span class="text-rose-400">${fnName}</span>(<span class="text-neutral-400">...parameters</span>)
      </div>
    </div>

    <!-- Live Execution Card -->
    <div class="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-4">
      <div class="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Test Inputs & Parameters</div>
      <div id="params-list" class="space-y-2.5"></div>

      <button id="run-btn" class="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-mono text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-rose-950/40">
        <span>▶ Execute Function</span>
      </button>

      <!-- Output Section -->
      <div class="space-y-1.5 pt-2 border-t border-white/10">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-neutral-400">Output Result:</span>
          <span id="exec-status" class="text-emerald-400 font-bold"></span>
        </div>
        <pre id="output-box" class="p-3.5 rounded-xl bg-black border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap min-h-[48px] flex items-center"></pre>
      </div>
    </div>

    <!-- Test Cases Quick Selector -->
    <div id="cases-container" class="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
      <div class="text-xs font-mono text-neutral-400 font-bold uppercase tracking-wider">Available Test Cases</div>
      <div id="cases-list" class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1"></div>
    </div>
  </div>

  <script>
    (function() {
      const rawCode = ${JSON.stringify(trimmed)};
      const targetFn = ${JSON.stringify(fnName)};
      const testCases = ${JSON.stringify(cases || [])};

      let userFn = null;
      try {
        eval(rawCode);
        if (typeof window[targetFn] === 'function') {
          userFn = window[targetFn];
        } else if (typeof eval(targetFn) === 'function') {
          userFn = eval(targetFn);
        }
      } catch (err) {
        document.getElementById('algo-container').innerHTML = \`
          <div class="p-5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 font-mono text-xs space-y-3">
            <div class="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <span>⚠️ Execution Error</span>
            </div>
            <pre class="bg-black/60 p-3 rounded-xl border border-white/10 text-white whitespace-pre-wrap">\${err.message || String(err)}</pre>
          </div>
        \`;
        return;
      }

      if (!userFn) {
        document.getElementById('output-box').textContent = "Function '" + targetFn + "' not found or not callable.";
        return;
      }

      // Initial arguments from first test case
      let currentArgs = testCases.length > 0 && Array.isArray(testCases[0].input)
        ? JSON.parse(JSON.stringify(testCases[0].input))
        : [];

      const paramsListEl = document.getElementById('params-list');
      function renderParamInputs() {
        paramsListEl.innerHTML = '';
        if (currentArgs.length === 0) {
          paramsListEl.innerHTML = '<div class="text-xs font-mono text-neutral-500 italic">No parameters required.</div>';
          return;
        }
        currentArgs.forEach((val, idx) => {
          const row = document.createElement('div');
          row.className = 'flex items-center space-x-2 text-xs font-mono';
          row.innerHTML = \`
            <span class="text-neutral-400 w-24 truncate">arg[\${idx}]:</span>
            <input type="text" data-idx="\${idx}" value="\${typeof val === 'string' ? val : JSON.stringify(val)}" class="flex-1 bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500 transition" />
          \`;
          paramsListEl.appendChild(row);
        });
      }

      function executeCurrentArgs() {
        const inputs = paramsListEl.querySelectorAll('input');
        const parsed = [];
        inputs.forEach((input) => {
          const val = input.value;
          try {
            parsed.push(JSON.parse(val));
          } catch(e) {
            parsed.push(val);
          }
        });
        currentArgs = parsed;

        try {
          const t0 = performance.now();
          const res = userFn.apply(null, currentArgs);
          const t1 = performance.now();
          const ms = (t1 - t0).toFixed(2);

          const outEl = document.getElementById('output-box');
          const statusEl = document.getElementById('exec-status');
          statusEl.textContent = '⚡ ' + ms + 'ms';
          statusEl.className = 'text-emerald-400 font-bold';
          outEl.textContent = res !== undefined ? JSON.stringify(res, null, 2) : 'undefined';
          outEl.className = 'p-3.5 rounded-xl bg-black border border-emerald-500/30 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap min-h-[48px]';
        } catch(e) {
          const outEl = document.getElementById('output-box');
          const statusEl = document.getElementById('exec-status');
          statusEl.textContent = '❌ Threw Error';
          statusEl.className = 'text-rose-400 font-bold';
          outEl.textContent = e.message || String(e);
          outEl.className = 'p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre-wrap min-h-[48px]';
        }
      }

      // Render test cases selector
      const casesListEl = document.getElementById('cases-list');
      if (testCases.length === 0) {
        document.getElementById('cases-container').style.display = 'none';
      } else {
        testCases.forEach((tc, idx) => {
          const btn = document.createElement('button');
          btn.className = 'w-full text-left p-2 rounded-xl bg-black/40 hover:bg-neutral-800 border border-white/5 transition flex items-center justify-between text-xs font-mono';
          btn.innerHTML = \`
            <div class="truncate pr-2">
              <span class="text-neutral-400">#\${idx + 1}</span>
              <span class="text-white ml-2">\${tc.title || tc.inputStr || 'Case ' + (idx + 1)}</span>
            </div>
            <span class="text-[10px] text-rose-400 shrink-0 font-bold">Load Case →</span>
          \`;
          btn.onclick = () => {
            currentArgs = Array.isArray(tc.input) ? JSON.parse(JSON.stringify(tc.input)) : [tc.input];
            renderParamInputs();
            executeCurrentArgs();
          };
          casesListEl.appendChild(btn);
        });
      }

      renderParamInputs();
      executeCurrentArgs();

      document.getElementById('run-btn').onclick = executeCurrentArgs;
      paramsListEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeCurrentArgs();
      });
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

    // Determine reference code
    const effectiveReferenceCode = referenceUiCode || (isUiChallenge ? `
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
    ` : '');

    // Check if candidate wrote their own complete UI
    const candidateHasCustomUi = /^\s*<!DOCTYPE|^\s*<html|<\/(?:div|button|section|main|p|table|form|svg|canvas)>|ReactDOM\.render|createRoot|export\s+default/i.test(code);

    // If it's a UI challenge and candidate wrote the algorithmic logic, inject candidate function into UI reference harness
    let candidateSnippet = code;
    if (!candidateHasCustomUi && effectiveReferenceCode) {
      candidateSnippet = injectCandidateCodeIntoUi(effectiveReferenceCode, code, functionName);
    }

    // 1. Client-Side Instant Pre-render (zero delay)
    const candidateHtml = buildIframeHtml(candidateSnippet, functionName, false, testCases);
    setSrcDoc(candidateHtml);

    // Compile reference code if available
    if (effectiveReferenceCode) {
      setReferenceSrcDoc(buildIframeHtml(effectiveReferenceCode, functionName || 'Solution', true, testCases));
    } else {
      setReferenceSrcDoc('');
    }
    setIsCompiling(false);

    // 2. Real Similarity Evaluation (Pure verbatim candidate execution, zero manipulation)
    if (previewMode === 'side-by-side' || isUiChallenge) {
      setIsEvaluatingSimilarity(true);
      evaluateUiSimilarity({
        userCode: code,
        solutionCode: solutionCode || effectiveReferenceCode,
        referenceUiCode: effectiveReferenceCode,
        problemTitle: title,
        functionName,
        testCases,
        testsPassed: outcome?.allPassed
      }).then(simRes => {
        if (!isMounted) return;
        setSimilarity(simRes);
        setIsEvaluatingSimilarity(false);
      }).catch(err => {
        console.warn("Real similarity evaluation error:", err);
        if (isMounted) setIsEvaluatingSimilarity(false);
      });
    }

    return () => { isMounted = false; };
  }, [isOpen, code, functionName, effectiveLanguage, referenceUiCode, previewMode, title, isUiChallenge, testCases, solutionCode, description, outcome]);

  const handleManualRunGemini = () => {
    setIsEvaluatingSimilarity(true);
    const effectiveReferenceCode = referenceUiCode || (isUiChallenge ? `
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
    ` : '');

    evaluateUiSimilarity({
      userCode: code,
      solutionCode: solutionCode || effectiveReferenceCode,
      referenceUiCode: effectiveReferenceCode,
      problemTitle: title,
      functionName,
      testCases,
      testsPassed: outcome?.allPassed
    }).then(simRes => {
      setSimilarity(simRes);
      setIsEvaluatingSimilarity(false);
    }).catch(err => {
      console.warn("Manual similarity evaluation error:", err);
      setIsEvaluatingSimilarity(false);
    });
  };

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

              {/* Manual Re-Run with Gemini Button */}
              {activeTab === 'ui-sandbox' && (
                <button
                  onClick={handleManualRunGemini}
                  disabled={isEvaluatingSimilarity}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold transition disabled:opacity-50"
                  title="Execute candidate code with Gemini and re-evaluate similarity"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEvaluatingSimilarity ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Re-Run with Gemini</span>
                </button>
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
                    <span>Gemini is running candidate code & judging real similarity...</span>
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
                      {similarity.scorePercentage}% Real Match
                    </span>
                    <span className="text-neutral-300 hidden md:inline truncate max-w-md">
                      {similarity.feedback}
                    </span>
                  </div>
                ) : (
                  <span className="text-neutral-500">Live AI parity active</span>
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
                        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-pointer-lock"
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
                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-pointer-lock"
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
                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-pointer-lock"
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
