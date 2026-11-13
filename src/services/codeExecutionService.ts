// Strict In-Browser Real Code Execution Service (JavaScript & Python)

export interface TestAssertionResult {
  title: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
}

export interface ExecutionOutcome {
  allPassed: boolean;
  tests: TestAssertionResult[];
  executionTimeMs: number;
  error?: string;
  stdout?: string;
}

export interface ProblemTestCase {
  title: string;
  input: any[];
  expected: any;
  inputStr?: string;
}

let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

// Initialize Pyodide WebAssembly Python 3 runtime
async function getPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;

  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = (async () => {
    if (typeof window === 'undefined') return null;

    // Wait up to 3 seconds for pyodide script if still loading
    for (let i = 0; i < 30; i++) {
      if ((window as any).loadPyodide) break;
      await new Promise(r => setTimeout(r, 100));
    }

    if (!(window as any).loadPyodide) {
      console.warn("Pyodide script not yet ready; falling back to strict engine.");
      return null;
    }

    try {
      pyodideInstance = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
      });
      return pyodideInstance;
    } catch (e) {
      console.warn("Pyodide initialization failed:", e);
      return null;
    }
  })();

  return pyodideLoadingPromise;
}

export async function executeCodeStrict(
  language: 'javascript' | 'python',
  functionName: string,
  userCode: string,
  testCases: ProblemTestCase[]
): Promise<ExecutionOutcome> {
  const startTime = performance.now();

  const trimmedCode = userCode.trim();
  if (!trimmedCode) {
    return {
      allPassed: false,
      tests: [],
      executionTimeMs: 0,
      error: "Editor is empty. Write your solution code before running tests."
    };
  }

  // Check for common placeholder traps
  const codeLines = trimmedCode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#'));
  const onlyPass = codeLines.every(l => l.startsWith('def ') || l.startsWith('function ') || l === 'pass' || l === 'return' || l === '{' || l === '}');
  if (onlyPass && codeLines.includes('pass')) {
    return {
      allPassed: false,
      tests: testCases.map(tc => ({
        title: tc.title,
        input: tc.inputStr || JSON.stringify(tc.input),
        expected: JSON.stringify(tc.expected),
        actual: "None (unimplemented 'pass')",
        passed: false,
        error: "Function body contains only 'pass'."
      })),
      executionTimeMs: 1,
      error: "Function is not implemented. Replace 'pass' with your actual algorithmic logic."
    };
  }

  if (language === 'javascript') {
    return runJavaScript(functionName, userCode, testCases, startTime);
  } else {
    return runPython(functionName, userCode, testCases, startTime);
  }
}

function runJavaScript(
  functionName: string,
  userCode: string,
  testCases: ProblemTestCase[],
  startTime: number
): ExecutionOutcome {
  const logs: string[] = [];
  try {
    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      },
      warn: (...args: any[]) => {
        logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      },
      error: (...args: any[]) => {
        logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      }
    };

    // Compile JavaScript code in an isolated scope
    const factory = new Function('console', `
      "use strict";
      ${userCode};
      if (typeof ${functionName} !== 'function') {
        throw new Error("Function '${functionName}' not declared. Ensure your function is named exactly '${functionName}'.");
      }
      return ${functionName};
    `);

    const fn = factory(customConsole);
    const results: TestAssertionResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      let actual: any;
      let passed = false;
      let errorMsg: string | undefined;

      try {
        // Deep clone inputs to prevent test mutation
        const clonedInputs = JSON.parse(JSON.stringify(tc.input));
        actual = fn(...clonedInputs);

        if (actual === undefined) {
          passed = false;
          errorMsg = "Returned undefined. Did you forget a return statement?";
        } else {
          passed = deepEqual(actual, tc.expected);
        }
      } catch (err: any) {
        passed = false;
        errorMsg = err.message || "Runtime exception";
        actual = `Error: ${err.message}`;
      }

      results.push({
        title: tc.title,
        input: tc.inputStr || JSON.stringify(tc.input),
        expected: JSON.stringify(tc.expected),
        actual: actual !== undefined ? (typeof actual === 'object' ? JSON.stringify(actual) : String(actual)) : 'undefined',
        passed,
        error: errorMsg
      });
    }

    const elapsed = +(performance.now() - startTime).toFixed(2);
    const allPassed = results.length > 0 && results.every(r => r.passed);

    return {
      allPassed,
      tests: results,
      executionTimeMs: elapsed,
      stdout: logs.join('\n')
    };
  } catch (err: any) {
    return {
      allPassed: false,
      tests: [],
      executionTimeMs: +(performance.now() - startTime).toFixed(2),
      error: `Syntax or compilation error: ${err.message}`,
      stdout: logs.join('\n')
    };
  }
}

async function runPython(
  functionName: string,
  userCode: string,
  testCases: ProblemTestCase[],
  startTime: number
): Promise<ExecutionOutcome> {
  const pyodide = await getPyodide();

  if (pyodide) {
    try {
      // Clear python scope and define user code
      await pyodide.runPythonAsync(userCode);

      // Verify function exists
      const hasFn = pyodide.runPython(`callable(globals().get('${functionName}'))`);
      if (!hasFn) {
        return {
          allPassed: false,
          tests: [],
          executionTimeMs: +(performance.now() - startTime).toFixed(2),
          error: `Python function '${functionName}' is not defined.`
        };
      }

      const results: TestAssertionResult[] = [];

      for (const tc of testCases) {
        const inputJson = JSON.stringify(tc.input);
        const testScript = `
import json
args = json.loads('''${inputJson}''')
result = ${functionName}(*args)
json.dumps(result)
        `;

        let actualStr = '';
        let passed = false;
        let errorMsg: string | undefined;

        try {
          actualStr = await pyodide.runPythonAsync(testScript);
          const parsedActual = JSON.parse(actualStr);
          passed = deepEqual(parsedActual, tc.expected);
        } catch (err: any) {
          passed = false;
          errorMsg = err.message || "Python exception";
          actualStr = String(err.message);
        }

        results.push({
          title: tc.title,
          input: tc.inputStr || JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expected),
          actual: actualStr,
          passed,
          error: errorMsg
        });
      }

      const elapsed = +(performance.now() - startTime).toFixed(2);
      return {
        allPassed: results.length > 0 && results.every(r => r.passed),
        tests: results,
        executionTimeMs: elapsed
      };
    } catch (err: any) {
      return {
        allPassed: false,
        tests: [],
        executionTimeMs: +(performance.now() - startTime).toFixed(2),
        error: `Python execution error: ${err.message}`
      };
    }
  }

  // Fallback: Strict syntax & logic AST verification if Pyodide is still loading
  // Strict check: if code only has pass or no return, reject immediately
  if (!userCode.includes('return ') || userCode.includes('pass')) {
    return {
      allPassed: false,
      tests: testCases.map(tc => ({
        title: tc.title,
        input: tc.inputStr || JSON.stringify(tc.input),
        expected: JSON.stringify(tc.expected),
        actual: "None",
        passed: false,
        error: "Missing return statement or incomplete implementation."
      })),
      executionTimeMs: +(performance.now() - startTime).toFixed(2),
      error: "Python solution is incomplete. Implement a valid algorithm returning the expected value."
    };
  }

  // Return realistic evaluation
  return {
    allPassed: false,
    tests: testCases.map(tc => ({
      title: tc.title,
      input: tc.inputStr || JSON.stringify(tc.input),
      expected: JSON.stringify(tc.expected),
      actual: "Awaiting Pyodide compilation",
      passed: false,
      error: "Python WebAssembly engine is initializing. Please try running in 2 seconds or switch to JS."
    })),
    executionTimeMs: 15,
    error: "Pyodide WebAssembly is downloading. Switch to JS for instant zero-latency compilation, or re-run in a few seconds."
  };
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 0.0001;
  }

  return JSON.stringify(a) === JSON.stringify(b);
}
