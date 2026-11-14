import { DsaProblem } from '../types';

const getEndpoint = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY || ''}`;

// Fallback high-fidelity SVG/Canvas interactive visualizer
function getFallbackGenerativeHtml(title: string, company: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      padding: 16px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      user-select: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 10px;
    }
    .badge {
      background: rgba(244, 63, 94, 0.15);
      color: #fb7185;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      position: relative;
    }
    .nodes-container {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      height: 120px;
    }
    .bar {
      width: 44px;
      background: #27272a;
      border-radius: 8px 8px 0 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      padding-bottom: 8px;
      font-size: 11px;
      font-weight: bold;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255,255,255,0.08);
      position: relative;
    }
    .bar.active {
      background: linear-gradient(180deg, #f43f5e 0%, #e11d48 100%);
      box-shadow: 0 0 16px rgba(244, 63, 94, 0.4);
      border-color: #fb7185;
      transform: translateY(-4px);
    }
    .bar.scanned {
      background: #059669;
      border-color: #34d399;
      color: #ecfdf5;
    }
    .pointer {
      position: absolute;
      top: -24px;
      font-size: 10px;
      color: #38bdf8;
      font-weight: bold;
    }
    .explanation {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 12px;
      color: #d4d4d8;
      max-width: 480px;
      text-align: center;
      min-height: 40px;
    }
    .controls {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    button {
      background: rgba(255,255,255,0.08);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }
    button:hover { background: rgba(255,255,255,0.15); }
    button.primary {
      background: #f43f5e;
      border-color: #fb7185;
    }
    button.primary:hover { background: #e11d48; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size:12px; font-weight:700;">${title}</div>
    <div class="badge">${company} • Live Generative UI</div>
  </div>

  <div class="stage">
    <div class="nodes-container" id="container">
      <!-- Bars rendered by JS -->
    </div>
    <div class="explanation" id="explainer">Step 1: Initializing traversal pointers and boundary invariants.</div>
  </div>

  <div class="controls">
    <button onclick="prevStep()">← Prev</button>
    <button onclick="reset()">Reset</button>
    <button class="primary" onclick="nextStep()">Next Step →</button>
  </div>

  <script>
    const steps = [
      { active: 0, text: "Step 1: Check baseline invariant at index 0. O(1) constant validation." },
      { active: 1, text: "Step 2: Advance pointer to element index 1. Comparing against window constraints." },
      { active: 2, text: "Step 3: Element satisfies condition without buffer overflow." },
      { active: 3, text: "Step 4: Optimal state verified across partition boundaries. Ready to return output." }
    ];
    let current = 0;
    const values = [24, 52, 38, 76, 42];

    function render() {
      const c = document.getElementById("container");
      c.innerHTML = "";
      values.forEach((v, i) => {
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = (v * 1.2) + "px";
        bar.innerText = v;
        if (i === steps[current].active) {
          bar.classList.add("active");
          const ptr = document.createElement("div");
          ptr.className = "pointer";
          ptr.innerText = "▲ ptr";
          bar.appendChild(ptr);
        } else if (i < steps[current].active) {
          bar.classList.add("scanned");
        }
        c.appendChild(bar);
      });
      document.getElementById("explainer").innerText = steps[current].text;
    }

    function nextStep() {
      if (current < steps.length - 1) current++;
      render();
    }
    function prevStep() {
      if (current > 0) current--;
      render();
    }
    function reset() {
      current = 0;
      render();
    }
    render();
  </script>
</body>
</html>`;
}

const CACHE_PREFIX = 'stackwa_generative_visual_';
const memoryVisualCache = new Map<string, string>();

function normalizeTitleKey(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Retrieve cached visual graphic from memory cache or localStorage
export function getCachedVisualGraphic(problemId: string, problemTitle?: string): string | null {
  // Check memory cache first
  if (memoryVisualCache.has(problemId)) {
    return memoryVisualCache.get(problemId)!;
  }
  if (problemTitle) {
    const titleKey = normalizeTitleKey(problemTitle);
    if (memoryVisualCache.has(titleKey)) {
      return memoryVisualCache.get(titleKey)!;
    }
  }

  try {
    // Check localStorage by problem ID
    const cachedById = localStorage.getItem(`${CACHE_PREFIX}${problemId}`);
    if (cachedById && (cachedById.startsWith('<!DOCTYPE') || cachedById.includes('<html'))) {
      memoryVisualCache.set(problemId, cachedById);
      if (problemTitle) memoryVisualCache.set(normalizeTitleKey(problemTitle), cachedById);
      return cachedById;
    }

    // Check localStorage by normalized problem title
    if (problemTitle) {
      const titleKey = normalizeTitleKey(problemTitle);
      const cachedByTitle = localStorage.getItem(`${CACHE_PREFIX}title_${titleKey}`);
      if (cachedByTitle && (cachedByTitle.startsWith('<!DOCTYPE') || cachedByTitle.includes('<html'))) {
        memoryVisualCache.set(problemId, cachedByTitle);
        memoryVisualCache.set(titleKey, cachedByTitle);
        return cachedByTitle;
      }
    }
  } catch (e) {
    console.warn("Error reading cached visual:", e);
  }
  return null;
}

// Persist visual graphic to memory cache and localStorage
export function setCachedVisualGraphic(problemId: string, html: string, problemTitle?: string): void {
  if (!html || (!html.startsWith('<!DOCTYPE') && !html.includes('<html'))) {
    return;
  }

  // Always persist in memory
  memoryVisualCache.set(problemId, html);
  if (problemTitle) {
    memoryVisualCache.set(normalizeTitleKey(problemTitle), html);
  }

  try {
    localStorage.setItem(`${CACHE_PREFIX}${problemId}`, html);
    if (problemTitle) {
      localStorage.setItem(`${CACHE_PREFIX}title_${normalizeTitleKey(problemTitle)}`, html);
    }
  } catch (e) {
    console.warn("Storage quota or error saving visual to cache:", e);
  }
}

// Dynamically generate self-contained HTML5/SVG motion graphic using Gemini 3.8 Flash
export async function generateInteractiveGraphic(
  problem: DsaProblem,
  company: string = 'Tech'
): Promise<string> {
  // Check persistent cache first so user never has to regenerate upon refresh or question switch
  const cached = getCachedVisualGraphic(problem.id, problem.title);
  if (cached) {
    return cached;
  }

  const prompt = `You are an expert motion graphics and algorithmic visualization engineer.
A software engineering candidate is solving the following technical challenge:
Title: ${problem.title}
Category: ${problem.category}
Description: ${problem.description}
Constraints: ${problem.constraints.join(', ')}

Your task is to write a single, complete, self-contained HTML5 document with inline <style> and <script> tags.
It must display an interactive, dark-mode SVG or HTML5 Canvas motion graphic illustrating the algorithmic execution of this problem step-by-step.

REQUIREMENTS:
1. Pure dark mode (#09090b background, white/zinc text, rose/emerald/amber highlight accents).
2. Clean visual demonstration of the specific data structure used (e.g. if graph -> animated SVG nodes & edges; if stack -> vertical element push/pop; if tree -> SVG tree traversal; if sliding window -> sliding bounding bracket; if array -> animated bars/pointers).
3. Interactive step controls: "Next Step", "Previous Step", and "Reset".
4. Step text updating at the bottom explaining the invariant at that specific point.
5. Self-contained: NO external CSS/JS dependencies (use pure HTML5 Canvas or SVG).
6. Output ONLY the raw HTML string (starts with <!DOCTYPE html>). DO NOT include markdown code fences (\`\`\`html) or explanations.`;

  try {
    const response = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Strip markdown code fences if model enclosed them
      rawText = rawText.replace(/^```html\s*/i, '').replace(/```$/i, '').trim();
      if (rawText.startsWith('<!DOCTYPE') || rawText.includes('<html')) {
        setCachedVisualGraphic(problem.id, rawText, problem.title);
        return rawText;
      }
    }
  } catch (err) {
    console.warn("Generative UI fallback engaged:", err);
  }

  const fallback = getFallbackGenerativeHtml(problem.title, company);
  setCachedVisualGraphic(problem.id, fallback, problem.title);
  return fallback;
}
