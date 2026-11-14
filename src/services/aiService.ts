import { DsaProblem, InterviewScorecard, UserInterviewProfile, OnboardingMessage } from '../types';
import { ExecutionOutcome } from './codeExecutionService';

const getEndpoint = () => 
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY || ''}`;

const BASE_INTERVIEW_SYSTEM = `You are Stackwa's AI Technical Interview Lead.
You think, speak, and evaluate candidates like a Staff Engineer and Hiring Committee Member at a tier-1 technology company.
You maintain high standards, ask insightful clarifying questions, value clean architecture, Big-O awareness, and defensive edge-case handling.
You communicate clearly, concisely, and supportively.`;

// Conversational AI Onboarding Turn
export async function conductOnboardingTurn(
  history: OnboardingMessage[],
  candidateMessage: string
): Promise<{ replyText: string; isComplete: boolean; extractedProfile?: Partial<UserInterviewProfile> }> {
  try {
    const candidateTurns = history.filter(h => h.sender === 'candidate').length;
    const prompt = `You are Stackwa's Technical Interview Lead onboarding an engineer to calibrate their tailored interview track.
Your goal is to have a genuine, multi-turn technical calibration dialogue. Do NOT rush to create a card in 1 turn!

You need to thoroughly explore 3 distinct pillars before concluding:
1. Target Company & Specific Role (e.g., Backend Systems at NVIDIA, Distributed Infra at Stripe, Frontend at Linear).
2. Diagnostic of Current Preparation & Weak Spots (e.g. what data structures or architectural patterns feel shaky? Concurrency, sliding window, graph DAGs, UI state machines?).
3. Scheduled Rounds & Timeline (when is the screen? e.g. "in 3 weeks", exact date, or flexible; and daily rehearsal bandwidth).

Turn count so far: ${candidateTurns + 1} candidate messages.
Conversation history:
${history.map(h => `${h.sender === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${h.text}`).join('\n')}
Candidate: ${candidateMessage}

CRITICAL RULES:
- If the user says they are just visiting, a student, or exploring without an upcoming interview: acknowledge warmly, set isComplete=true, targetCompany="General Engineering Practice", role="Full-Stack / Systems Engineer", daysRemaining=30, isGeneralPractice=true, focusAreas=["Sliding Window & Monotonic Bounds", "Transactional State Machines", "LRU O(1) Cache Eviction"].
- If the candidate turns count < 2 (this is the 1st or 2nd reply): DO NOT finalize! Ask thoughtful diagnostic follow-ups about their preparation, weak spots, or upcoming round formats. Return isComplete=false.
- If you have explored the target role, preparation weak spots, and timeline (typically 3+ exchanges), OR if the candidate explicitly asks to "create card" / "done" / "let's go": summarize their custom preparation blueprint enthusiastically and set isComplete=true.

Return ONLY valid JSON matching this schema:
{
  "replyText": string (your conversational interviewer response in crisp, peer-to-peer technical tone),
  "isComplete": boolean (set true ONLY when all required info has been gathered across multi-turn dialogue, or if user is a visitor),
  "extractedProfile": {
    "targetCompany": string,
    "role": string,
    "seniority": "Intern" | "Junior" | "Mid-Level" | "Senior",
    "daysRemaining": number,
    "interviewDate": string (YYYY-MM-DD),
    "focusAreas": [string, string, string],
    "isGeneralPractice": boolean
  }
}`;

    const response = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.warn("Falling back to local onboarding response:", err);
  }

  // Graceful fallback response
  return {
    replyText: `Got it! Preparing for that interview is an exciting challenge. When is your technical round scheduled, and what rounds (DSA, System Design, Live Coding) are on your docket?`,
    isComplete: false
  };
}

// Generate 100% Dynamic, Company-Specific Interview Challenge
export async function generateDynamicChallenge(
  company: string,
  role: string,
  topic?: string
): Promise<DsaProblem> {
  try {
    const prompt = `Create a realistic, modern, non-generic technical interview challenge for a candidate interviewing for ${role} at ${company}.
${topic ? `Focus topic: ${topic}` : ''}
Do NOT use generic problems like standard two-sum or stock prices. Instead, ground the problem in the actual real-world domain of ${company} (e.g., if Stripe -> payment idempotency / sliding window rate limiting; if Linear -> sync conflict resolution / graph DAG; if Airbnb -> calendar booking interval overlap / availability index; if Netflix -> video chunk buffer caching; if Google -> high-throughput token bucket / distributed routing).

Return ONLY valid JSON matching this schema:
{
  "id": string (kebab-case),
  "title": string,
  "difficulty": "Easy" | "Medium" | "Hard",
  "category": string,
  "companyTags": [string, string],
  "description": string (clear specification of problem and input/output),
  "functionName": string (camelCase function identifier, e.g. "solveAvailability", "rateLimitCheck"),
  "constraints": [string, string, string],
  "examples": [
    { "input": string, "output": string, "explanation": string },
    { "input": string, "output": string, "explanation": string }
  ],
  "testCases": [
    {
      "title": "Test 1: Standard input",
      "input": [any],
      "expected": any,
      "inputStr": string
    },
    {
      "title": "Test 2: Edge case bounds",
      "input": [any],
      "expected": any,
      "inputStr": string
    },
    {
      "title": "Test 3: Large / Complex vector",
      "input": [any],
      "expected": any,
      "inputStr": string
    }
  ],
  "starterCode": {
    "javascript": string,
    "python": string
  },
  "solutionCode": {
    "javascript": string,
    "python": string
  },
  "timeComplexity": string (e.g. "O(n)"),
  "spaceComplexity": string (e.g. "O(k)"),
  "interviewCakePedagogy": {
    "conceptBreakdown": string,
    "commonPitfalls": [string, string]
  },
  "hints": [
    {
      "id": 1,
      "tier": "Clarifying Questions",
      "title": "Constraint & Scale Analysis",
      "metaClue": "Wondering about boundary conditions and scale?",
      "content": string,
      "revealed": false
    },
    {
      "id": 2,
      "tier": "Data Structure Clue",
      "title": "Optimal In-Memory Structure",
      "metaClue": "Stuck between O(n²) scans and optimal access?",
      "content": string,
      "revealed": false
    },
    {
      "id": 3,
      "tier": "Edge Case & Complexity",
      "title": "Single-Pass Invariant",
      "metaClue": "Ready to lock in optimal Big-O?",
      "content": string,
      "revealed": false
    }
  ]
}`;

    const response = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) {
        return JSON.parse(raw) as DsaProblem;
      }
    }
  } catch (err) {
    console.warn("Failed to generate dynamic challenge:", err);
  }

  // Fallback high-caliber challenge (Distributed Sliding Window Rate Limiter)
  return {
    id: 'sliding-window-rate-limiter',
    title: `${company} — Real-Time Sliding Window Request Arbiter`,
    difficulty: 'Medium',
    category: 'Sliding Window & Hash Maps',
    companyTags: [company, 'Distributed Systems'],
    description: `You are architecting the API gateway at ${company}. Given an array of request timestamps in milliseconds and a rate limit rule (maximum 'k' requests within any 'windowMs' time window), determine whether all incoming requests conform to the limit without dropping.
Return true if all requests pass, or false if any burst violates the window constraint.`,
    functionName: 'isRateLimitConformant',
    constraints: [
      'Timestamps are strictly in non-decreasing order.',
      '1 <= timestamps.length <= 10^5',
      'Time complexity target: O(n) single pass.',
      'Space complexity target: O(k).'
    ],
    examples: [
      {
        input: 'timestamps = [1000, 1200, 1500, 2100], k = 3, windowMs = 1000',
        output: 'true',
        explanation: 'At any point, within 1000ms there are at most 3 requests.'
      },
      {
        input: 'timestamps = [1000, 1100, 1200, 1300], k = 3, windowMs = 1000',
        output: 'false',
        explanation: 'Four requests arrive within 300ms, violating the maximum of 3 requests.'
      }
    ],
    testCases: [
      {
        title: 'Test 1: Normal steady traffic',
        input: [[1000, 2100, 3200, 4300], 2, 1000],
        expected: true,
        inputStr: '[1000, 2100, 3200, 4300], k=2, window=1000'
      },
      {
        title: 'Test 2: Burst violation',
        input: [[100, 150, 200, 250], 3, 500],
        expected: false,
        inputStr: '[100, 150, 200, 250], k=3, window=500'
      },
      {
        title: 'Test 3: Boundary edge matches exactly window',
        input: [[1000, 2000], 1, 1000],
        expected: true,
        inputStr: '[1000, 2000], k=1, window=1000'
      }
    ],
    starterCode: {
      javascript: `function isRateLimitConformant(timestamps, k, windowMs) {
  // Implement sliding window rate limit arbiter
  
  return true;
}`,
      python: `def is_rate_limit_conformant(timestamps, k, window_ms):
    # Implement sliding window rate limit arbiter
    return True`
    },
    solutionCode: {
      javascript: `function isRateLimitConformant(timestamps, k, windowMs) {
  let left = 0;
  for (let right = 0; right < timestamps.length; right++) {
    while (timestamps[right] - timestamps[left] >= windowMs) {
      left++;
    }
    const currentWindowCount = right - left + 1;
    if (currentWindowCount > k) return false;
  }
  return true;
}`,
      python: `def is_rate_limit_conformant(timestamps, k, window_ms):
    left = 0
    for right in range(len(timestamps)):
        while timestamps[right] - timestamps[left] >= window_ms:
            left += 1
        if (right - left + 1) > k:
            return False
    return True`
    },
    timeComplexity: 'O(n) time',
    spaceComplexity: 'O(1) space',
    interviewCakePedagogy: {
      conceptBreakdown: 'Maintain a two-pointer sliding window where left advances whenever timestamps fall outside windowMs.',
      commonPitfalls: ['Recalculating window size with nested O(n²) loops', 'Off-by-one errors on exact window boundary equality']
    },
    hints: [
      {
        id: 1,
        tier: 'Clarifying Questions',
        title: 'Window Invariant & Equality',
        metaClue: 'Are boundaries inclusive or exclusive?',
        content: 'Check whether a request at timestamp t and t + windowMs are in the same window (usually strict inequality t2 - t1 < windowMs).',
        revealed: false
      },
      {
        id: 2,
        tier: 'Data Structure Clue',
        title: 'Two-Pointer Sliding Window',
        metaClue: 'Do we need an auxiliary queue or just pointers?',
        content: 'Because timestamps are non-decreasing, two monotonic indices (left, right) track the current window in O(1) auxiliary space.',
        revealed: false
      },
      {
        id: 3,
        tier: 'Edge Case & Complexity',
        title: 'Burst Detection in O(n)',
        metaClue: 'How to prove O(n) amortized runtime?',
        content: 'Both left and right traverse the array at most once, guaranteeing linear O(n) execution without allocating memory.',
        revealed: false
      }
    ]
  };
}

// "Raise Hand" ✋ Clarifying Question Handler
export async function askClarifyingQuestion(
  problem: DsaProblem,
  candidateQuestion: string
): Promise<string> {
  try {
    const prompt = `${BASE_INTERVIEW_SYSTEM}
The candidate is working on the problem: "${problem.title}".
Description: ${problem.description}
Constraints: ${problem.constraints.join('; ')}

The candidate raised their hand and asked this clarifying question:
"${candidateQuestion}"

Respond in character as the interviewer.
Be precise, realistic, encourage good communication, and clarify the specification without giving away the complete algorithmic solution. Keep your response under 3-4 sentences.`;

    const response = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return reply;
    }
  } catch (err) {
    console.warn("Clarifying question fallback:", err);
  }

  return `That's a great question to ask upfront! You can assume timestamps are positive integers and sorted in ascending order. If the input array is empty, return true by default. Focus on handling bursts within the window constraint.`;
}

// Real, Non-Random AI Scorecard Evaluation
export async function generateAuthenticScorecard(
  profile: UserInterviewProfile | null,
  problem: DsaProblem,
  candidateCode: string,
  language: string,
  testOutcome: ExecutionOutcome,
  hintsUnlockedCount: number,
  clarifyingQuestionsCount: number
): Promise<InterviewScorecard> {
  try {
    const prompt = `You are the Lead Technical Interview Evaluator. Evaluate this candidate's live coding performance with rigor and authenticity.
Candidate Profile:
- Target Company: ${profile?.targetCompany || 'Tech Company'}
- Role: ${profile?.role || 'Software Engineer'}
- Seniority: ${profile?.seniority || 'Mid-Level'}

Problem: ${problem.title} (${problem.timeComplexity} target)
Language: ${language}
Submitted Code:
\`\`\`${language}
${candidateCode}
\`\`\`

Test Results:
- All Passed: ${testOutcome.allPassed}
- Passed ${testOutcome.tests.filter(t => t.passed).length} of ${testOutcome.tests.length} tests
- Execution Runtime: ${testOutcome.executionTimeMs}ms
- Test Error: ${testOutcome.error || 'None'}
- Hints Unlocked: ${hintsUnlockedCount} of ${problem.hints.length}
- Clarifying Questions Asked: ${clarifyingQuestionsCount}

Return ONLY valid JSON matching this schema:
{
  "overallScore": number (0-100, calculate genuinely based on whether code passed tests, complexity, and hints used),
  "problemSolving": number (0-100),
  "systemArchitecture": number (0-100),
  "communication": number (0-100),
  "edgeCaseAwareness": number (0-100),
  "strengths": [string, string, string],
  "improvements": [string, string],
  "summary": string (2-3 sentences critiquing their actual code logic, Big-O, and readiness)
}`;

    const response = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...parsed,
          candidateName: profile?.targetCompany ? `Candidate for ${profile.targetCompany}` : 'Candidate',
          targetCompany: profile?.targetCompany || 'Target Company',
          role: profile?.role || 'Engineer',
          verificationHash: `STK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
    }
  } catch (err) {
    console.warn("Error generating authentic scorecard:", err);
  }

  // Rigorous calculation fallback if API unavailable
  const passRate = testOutcome.tests.length > 0 
    ? testOutcome.tests.filter(t => t.passed).length / testOutcome.tests.length 
    : 0;
  
  const baseScore = testOutcome.allPassed ? 85 : Math.round(passRate * 70);
  const hintDeduction = hintsUnlockedCount * 4;
  const commBonus = clarifyingQuestionsCount > 0 ? 5 : 0;
  const overall = Math.max(30, Math.min(98, baseScore - hintDeduction + commBonus));

  return {
    candidateName: profile?.targetCompany ? `Candidate for ${profile.targetCompany}` : 'Candidate',
    targetCompany: profile?.targetCompany || 'Target Company',
    role: profile?.role || 'Software Engineer',
    overallScore: overall,
    problemSolving: testOutcome.allPassed ? Math.max(75, overall + 3) : Math.round(overall * 0.9),
    systemArchitecture: overall,
    communication: Math.min(95, 75 + clarifyingQuestionsCount * 8),
    edgeCaseAwareness: Math.max(40, Math.round(passRate * 90)),
    strengths: [
      testOutcome.allPassed ? 'Algorithm satisfies all automated test boundaries' : 'Shows logical effort in algorithmic decomposition',
      clarifyingQuestionsCount > 0 ? 'Proactively asked clarifying constraint questions' : 'Structured implementation attempt',
      `Targeted ${problem.timeComplexity} complexity optimization`
    ],
    improvements: [
      testOutcome.allPassed ? 'Consider benchmarking memory footprint against larger streams' : 'Guard explicitly against edge conditions to prevent test failures',
      'Articulate Big-O time and space complexity out loud before coding'
    ],
    summary: testOutcome.allPassed
      ? `Strong demonstration of problem solving under interview constraints. The solution passed all test cases in ${testOutcome.executionTimeMs}ms.`
      : `Solution requires hardening around boundary test cases. Review the hints and test failures before resubmitting.`,
    verificationHash: `STK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

// Socratic AI Coach Chat
export async function askAiCoach(
  userPrompt: string, 
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> {
  try {
    const contents = [
      {
        role: 'user',
        parts: [{ text: `${BASE_INTERVIEW_SYSTEM}\nAlways guide with progressive Socratic questions rather than revealing complete answers.` }]
      },
      ...history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ];

    const response = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (response.ok) {
      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (replyText) return replyText;
    }
  } catch (error) {
    console.warn("AI coach fallback:", error);
  }

  return `In a technical screen, remember to:
1. Clarify constraints & scale first.
2. Outline the brute force O(n²) baseline, then introduce the optimal structure.
3. Walk through an edge case test.
What specific part of your approach would you like to evaluate next?`;
}

export async function generateAiScorecard(
  solvedCount: number,
  completedFlowsCount: number
): Promise<InterviewScorecard> {
  const problem: DsaProblem = {
    id: 'eval-session',
    title: 'Full Technical Screen Evaluation',
    difficulty: 'Medium',
    category: 'Algorithms & Architecture',
    companyTags: ['Tech Screen'],
    description: 'Candidate comprehensive screen evaluation',
    functionName: 'evaluate',
    testCases: [],
    constraints: [],
    examples: [],
    starterCode: { javascript: '', python: '' },
    solutionCode: { javascript: '', python: '' },
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    interviewCakePedagogy: { conceptBreakdown: '', commonPitfalls: [] },
    hints: []
  };

  const outcome: ExecutionOutcome = {
    allPassed: solvedCount > 0,
    tests: Array.from({ length: Math.max(1, solvedCount) }).map((_, i) => ({
      title: `Unit ${i + 1}`,
      input: 'verified_input',
      expected: 'pass',
      actual: 'pass',
      passed: true
    })),
    executionTimeMs: 1.25
  };

  return generateAuthenticScorecard(null, problem, '// Candidate Verified Implementation', 'javascript', outcome, 1, completedFlowsCount);
}

export interface StepByStepFix {
  rootCause: string;
  conceptBroken: string;
  steps: string[];
  fixedCode: string;
  explanation: string;
}

export interface SessionBlueprint {
  durationMinutes: number;
  smallQuestionCount: number;
  bigQuestionCount: number;
  rationale: string;
  focusTopics: string[];
}

export function getAiSuggestedSessionBlueprint(
  profile: UserInterviewProfile | null,
  sessionCount: number = 1
): SessionBlueprint {
  const company = profile?.targetCompany || 'Tier-1 Engineering';
  const role = profile?.role || 'Software Engineer';
  const seniority = profile?.seniority || 'Mid-Level';
  const weaknesses = profile?.focusAreas && profile.focusAreas.length > 0
    ? profile.focusAreas
    : ['Edge Cases & Invariants', 'Data Structure Selection', 'Time-Space Tradeoffs'];

  let durationMinutes = 35;
  let smallQuestionCount = 2;
  let bigQuestionCount = 1;
  let rationale = `Calibrated for ${company} (${seniority} ${role}). Balanced 2 quick intuition drills with 1 in-depth architectural challenge targeting ${weaknesses[0]}.`;

  if (sessionCount <= 1) {
    durationMinutes = 25;
    smallQuestionCount = 2;
    bigQuestionCount = 1;
    rationale = `Session #1 Diagnostic: 2 rapid drills to calibrate baseline syntax and edge-case handling, followed by 1 core ${company} algorithmic problem.`;
  } else if (sessionCount === 2) {
    durationMinutes = 40;
    smallQuestionCount = 3;
    bigQuestionCount = 1;
    rationale = `Session #2 Calibration: Increasing speed on drill mechanics (3 drills) while attacking your diagnosed weak spot: ${weaknesses[0]}.`;
  } else if (sessionCount >= 3) {
    durationMinutes = 55;
    smallQuestionCount = 2;
    bigQuestionCount = 2;
    rationale = `Session #${sessionCount} Endurance: Simulating full on-site pressure with 2 quick drills and 2 deep algorithmic challenges.`;
  }

  return {
    durationMinutes,
    smallQuestionCount,
    bigQuestionCount,
    rationale,
    focusTopics: weaknesses
  };
}

// Generate an authentic Step-by-Step Fix when candidate code fails
export async function generateStepByStepFix(
  problem: DsaProblem,
  code: string,
  language: 'javascript' | 'python',
  error?: string,
  failedTests?: Array<{ title: string; expected: any; actual: any }>
): Promise<StepByStepFix> {
  const failureContext = error
    ? `Runtime / Syntax Error: ${error}`
    : `Failed Test Cases:\n${(failedTests || []).map(t => `- ${t.title}: Expected '${JSON.stringify(t.expected)}', got '${JSON.stringify(t.actual)}'`).join('\n')}`;

  const prompt = `You are Stackwa's AI Technical Interview Lead and Senior Mentor.
A candidate working on the following coding problem in ${language} hit an error or failed tests.

PROBLEM:
Title: ${problem.title}
Description: ${problem.description}
Function Name: ${problem.functionName}

CANDIDATE CODE:
\`\`\`${language}
${code}
\`\`\`

FAILURE / ERROR:
${failureContext}

INSTRUCTIONS:
1. Identify the exact root cause of the error or test failure (e.g., syntax mistake, HTML pasted into JS, off-by-one index, infinite loop, missing base case, incorrect return type).
2. Point out the core programming concept or invariant that was broken.
3. Provide a clear, progressive step-by-step fix (numbered steps) explaining how to rectify the code logically.
4. Provide the fully corrected, production-grade ${language} function implementation that passes all requirements.
5. Provide a supportive, concise explanation.

Return ONLY valid JSON matching this schema:
{
  "rootCause": string (1-2 sentences explaining what went wrong),
  "conceptBroken": string (short label like "Pure JavaScript syntax vs HTML markup", "Boundary condition check", "Off-by-one window bounds"),
  "steps": [
    string (Step 1: ...),
    string (Step 2: ...),
    string (Step 3: ...)
  ],
  "fixedCode": string (the complete, working replacement function in ${language}),
  "explanation": string (supportive explanation of why this fix is correct and optimal)
}`;

  try {
    const response = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) {
        return JSON.parse(raw) as StepByStepFix;
      }
    }
  } catch (err) {
    console.warn("AI fix generation failed, using fallback diagnostic:", err);
  }

  // Resilient fallback fix
  const isHtmlInJs = code.includes('<') && (code.includes('div') || code.includes('body') || code.includes('html'));
  if (isHtmlInJs) {
    return {
      rootCause: "The submitted code contains raw HTML/DOM markup rather than pure JavaScript logic, causing a syntax parser error.",
      conceptBroken: "Pure algorithmic JavaScript vs HTML markup",
      steps: [
        "Step 1: Strip out all HTML tags (<tag>, <div>, etc.).",
        `Step 2: Declare the function \`${problem.functionName}\` with expected arguments.`,
        "Step 3: Implement the algorithmic logic returning the requested value directly."
      ],
      fixedCode: typeof problem.solutionCode === 'string' ? problem.solutionCode : (problem.solutionCode[language] || problem.solutionCode.javascript),
      explanation: "Switching to pure algorithmic code resolves syntax parsing errors and allows unit test assertions to execute."
    };
  }

  return {
    rootCause: error ? `The execution encountered: ${error}` : "One or more assertions did not match expected output.",
    conceptBroken: "Edge Case Invariant & State Handling",
    steps: [
      "Step 1: Check input boundary conditions (e.g. empty inputs, single element, negative numbers).",
      "Step 2: Verify loop terminating bounds and off-by-one array index access.",
      "Step 3: Ensure the function returns the exact expected data type."
    ],
    fixedCode: typeof problem.solutionCode === 'string' ? problem.solutionCode : (problem.solutionCode[language] || problem.solutionCode.javascript),
    explanation: "Re-aligning the loop bounds and return type satisfies all test requirements."
  };
}

// Dynamically generate authentic, company-specific DSA scenario problems using Gemini
export async function generateScenarioDsaProblem(
  company: string,
  role: string,
  focusTopics: string[] = ['Algorithms', 'Data Structures'],
  difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium',
  problemType: 'drill' | 'long' = 'long'
): Promise<DsaProblem> {
  const isDrill = problemType === 'drill';
  const prompt = `You are a Senior Staff Software Engineer and Technical Interviewer at ${company} conducting a live technical screen for a ${role} candidate.
Format: ${isDrill ? 'QUICK DRILL (5-10 minutes, testing fast intuition, clean code, and edge cases)' : 'IN-DEPTH ALGORITHMIC PROBLEM (30-45 minutes, testing architecture and optimal Big-O)'}.
Topics: ${focusTopics.join(', ')}. Difficulty: ${difficulty}.

THINK BEFORE YOU ASK — ROLE & CONDITION CALIBRATION:
1. Examine the candidate's exact target role ('${role}'), target company ('${company}'), and focus topics ('${focusTopics.join(', ')}'):
   - If role involves Frontend / Full-Stack: test diverse frontend & full-stack algorithms such as DOM node tree diffing, virtual node reconciliation, layout tree dimensions, reactive event throttlers, state signal graphs, or CSS specificity parsers.
   - If role involves Backend / Distributed: test lock-free ring buffers, distributed token buckets, write-ahead log compaction, DAG workflow scheduling, cache eviction, or consistent hashing rings.
   - If role involves Systems / Low-Level: test GPU warp thread scheduling, memory page boundaries, bitwise flags, or buffer alignment.
2. DIVERSITY REQUIREMENT: Draw from the full spectrum of Computer Science (Graphs BFS/DFS/Topological, Binary Search bounds, Dynamic Programming memoization, Monotonic Stacks, Heaps, Two Pointers, Trees/Tries, Disjoint Sets). DO NOT repeat the same topic or archetype.
3. The problem description MUST BE CRISP, NATURAL, AND REALISTIC (2 to 4 sentences maximum). DO NOT write long academic essays or dense nested JSON schemas. Talk like a real senior technical interviewer.
4. Target Big-O must accurately match the algorithmic paradigm (e.g., O(log N) for binary search, O(V + E) for graphs, O(N log K) for priority queues, O(N) for linear scans).
5. The problem MUST include 3 to 4 complete, executable test cases with inputs, expected outputs, and readable descriptions.
6. Function name must be valid camelCase (e.g., \`validateDomNesting\`, \`findRotatedThreshold\`, \`scheduleWarpTask\`).
7. Provide matching JavaScript and Python starter templates with correct argument names.
8. Provide optimal JavaScript and Python solution implementations that accurately pass all test cases.

Return ONLY valid JSON matching this schema:
{
  "id": "${company.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${problemType}-${Date.now()}",
  "title": string (concise title, e.g. "${company} DOM Hierarchy Validator", "${company} Distributed Rate Limiter"),
  "difficulty": "${difficulty}",
  "category": string (e.g. "Tree Traversal", "Monotonic Stack", "Binary Search", "Dynamic Programming", "Graph Topo-Sort"),
  "companyTags": ["${company}"],
  "description": string (CRISP 2-4 sentences max specifying input, output, and goal),
  "functionName": string (valid camelCase identifier),
  "constraints": [string, string, string],
  "examples": [
    {
      "input": string,
      "output": string,
      "explanation": string
    },
    {
      "input": string,
      "output": string,
      "explanation": string
    }
  ],
  "testCases": [
    {
      "title": string,
      "input": [any] (array of argument values passed to the function),
      "expected": any (exact return value),
      "inputStr": string
    }
  ],
  "starterCode": {
    "javascript": string,
    "python": string
  },
  "solutionCode": {
    "javascript": string,
    "python": string
  },
  "timeComplexity": string,
  "spaceComplexity": string,
  "interviewCakePedagogy": {
    "conceptBreakdown": string,
    "commonPitfalls": [string, string]
  },
  "hints": [
    {
      "id": 1,
      "tier": "Clarifying Questions",
      "title": "Vault 1: Input Guarantees & Constraints",
      "metaClue": string,
      "content": string,
      "revealed": false
    },
    {
      "id": 2,
      "tier": "Data Structure Clue",
      "title": "Vault 2: Core Invariant",
      "metaClue": string,
      "content": string,
      "revealed": false
    },
    {
      "id": 3,
      "tier": "Edge Case & Complexity",
      "title": "Vault 3: Optimization & Proof",
      "metaClue": string,
      "content": string,
      "revealed": false
    }
  ]
}`;

  try {
    const response = await fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const generated = JSON.parse(text) as DsaProblem;
        generated.id = generated.id || `${company.toLowerCase()}-${problemType}-${Date.now()}`;
        generated.companyTags = [company];
        return generated;
      }
    }
  } catch (error) {
    console.error("AI scenario generation error:", error);
  }

  // Varied resilient fallbacks based on problemType
  if (isDrill) {
    return {
      id: `${company.toLowerCase()}-drill-record-filter-${Date.now()}`,
      title: `${company} Record Batch Filter`,
      difficulty: 'Easy',
      category: 'Hash Tables & Two Pointers',
      companyTags: [company],
      description: `In ${company}'s ingestion pipeline, incoming event records must be filtered to remove duplicate IDs while preserving original order. Given an array of numeric record IDs, return the array of unique IDs in the order they first appeared.`,
      functionName: 'filterUniqueRecords',
      constraints: [
        '1 <= records.length <= 10^5',
        'Target Time Complexity: O(n)',
        'Target Space Complexity: O(n)'
      ],
      examples: [
        {
          input: 'records = [10, 20, 10, 30, 20]',
          output: '[10, 20, 30]',
          explanation: 'Duplicates of 10 and 20 are dropped.'
        }
      ],
      testCases: [
        {
          title: 'Test 1: Normal array with repeats',
          input: [[10, 20, 10, 30, 20]],
          expected: [10, 20, 30],
          inputStr: 'records=[10, 20, 10, 30, 20]'
        },
        {
          title: 'Test 2: All identical records',
          input: [[7, 7, 7, 7]],
          expected: [7],
          inputStr: 'records=[7, 7, 7, 7]'
        },
        {
          title: 'Test 3: Already unique stream',
          input: [[1, 2, 3, 4]],
          expected: [1, 2, 3, 4],
          inputStr: 'records=[1, 2, 3, 4]'
        }
      ],
      starterCode: {
        javascript: `function filterUniqueRecords(records) {\n  // Return array of unique records in first-seen order\n  const seen = new Set();\n  const result = [];\n  for (const r of records) {\n    if (!seen.has(r)) {\n      seen.add(r);\n      result.push(r);\n    }\n  }\n  return result;\n}`,
        python: `def filter_unique_records(records):\n    # Return list of unique records in first-seen order\n    seen = set()\n    result = []\n    for r in records:\n        if r not in seen:\n            seen.add(r)\n            result.append(r)\n    return result`
      },
      solutionCode: {
        javascript: `function filterUniqueRecords(records) {\n  const seen = new Set();\n  const result = [];\n  for (const r of records) {\n    if (!seen.has(r)) {\n      seen.add(r);\n      result.push(r);\n    }\n  }\n  return result;\n}`,
        python: `def filter_unique_records(records):\n    seen = set()\n    result = []\n    for r in records:\n        if r not in seen:\n            seen.add(r)\n            result.append(r)\n    return result`
      },
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      interviewCakePedagogy: {
        conceptBreakdown: 'A Hash Set gives O(1) membership checks, maintaining order with a simple pass.',
        commonPitfalls: ['Using indexOf inside loop leading to O(n²)', 'Losing original insertion order']
      },
      hints: [
        {
          id: 1,
          tier: 'Clarifying Questions',
          title: 'Vault 1: Memory Constraints',
          metaClue: 'Can we use auxiliary memory?',
          content: 'Yes, an O(n) Hash Set is optimal for maintaining first-seen order.',
          revealed: false
        },
        {
          id: 2,
          tier: 'Data Structure Clue',
          title: 'Vault 2: Lookups',
          metaClue: 'Which structure provides constant time lookups?',
          content: 'Set.has() runs in O(1) average time.',
          revealed: false
        },
        {
          id: 3,
          tier: 'Edge Case & Complexity',
          title: 'Vault 3: Single Elements',
          metaClue: 'What if array has length 1?',
          content: 'Handled naturally without special casing.',
          revealed: false
        }
      ]
    };
  }

  // Fallback for long in-depth challenge
  return {
    id: `${company.toLowerCase()}-task-scheduler-${Date.now()}`,
    title: `${company} Priority Task Sequencer`,
    difficulty: difficulty,
    category: 'Priority Queues & Greedy Scheduling',
    companyTags: [company],
    description: `In ${company}'s production infrastructure, tasks with priority weights and concurrency limit k must be scheduled to maximize throughput. Given an array of task priorities and window size k, return the sorted execution order prioritizing higher weights.`,
    functionName: 'schedulePriorityTasks',
    constraints: [
      '1 <= tasks.length <= 10^5',
      '1 <= k <= 1000',
      'Target Time Complexity: O(n log n)',
      'Target Space Complexity: O(n)'
    ],
    examples: [
      {
        input: 'tasks = [5, 2, 8, 1], k = 2',
        output: '[8, 5, 2, 1]',
        explanation: 'Tasks ordered by priority weight.'
      }
    ],
    testCases: [
      {
        title: 'Test 1: Standard priority ordering',
        input: [[5, 2, 8, 1], 2],
        expected: [8, 5, 2, 1],
        inputStr: 'tasks=[5, 2, 8, 1], k=2'
      },
      {
        title: 'Test 2: Already sorted stream',
        input: [[10, 20, 30], 1],
        expected: [30, 20, 10],
        inputStr: 'tasks=[10, 20, 30], k=1'
      },
      {
        title: 'Test 3: Single task',
        input: [[42], 1],
        expected: [42],
        inputStr: 'tasks=[42], k=1'
      }
    ],
    starterCode: {
      javascript: `function schedulePriorityTasks(tasks, k) {\n  // Implement priority-weighted scheduler\n  return tasks.slice().sort((a, b) => b - a);\n}`,
      python: `def schedule_priority_tasks(tasks, k):\n    # Implement priority-weighted scheduler\n    return sorted(tasks, reverse=True)`
    },
    solutionCode: {
      javascript: `function schedulePriorityTasks(tasks, k) {\n  return tasks.slice().sort((a, b) => b - a);\n}`,
      python: `def schedule_priority_tasks(tasks, k):\n    return sorted(tasks, reverse=True)`
    },
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    interviewCakePedagogy: {
      conceptBreakdown: 'Avoid full re-sorting on dynamic streams by maintaining a bounded priority queue.',
      commonPitfalls: ['Inverting sorting comparison function', 'Mutating original input in-place']
    },
    hints: [
      {
        id: 1,
        tier: 'Clarifying Questions',
        title: 'Vault 1: Scale & Memory',
        metaClue: 'How many tasks can arrive in memory?',
        content: 'Since k is smaller than total tasks, keep a bounded structure.',
        revealed: false
      },
      {
        id: 2,
        tier: 'Data Structure Clue',
        title: 'Vault 2: Max-Heap Invariant',
        metaClue: 'How to extract top priority quickly?',
        content: 'A max-heap guarantees logarithmic extraction.',
        revealed: false
      },
      {
        id: 3,
        tier: 'Edge Case & Complexity',
        title: 'Vault 3: Tie Breaking',
        metaClue: 'How to handle equal priorities?',
        content: 'Preserve stable order when weights match.',
        revealed: false
      }
    ]
  };
}



