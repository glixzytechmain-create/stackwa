import { InterviewScorecard } from '../types';

const getEndpoint = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY || ''}`;

const SYSTEM_INSTRUCTION = `You are the Stackwa AI Socratic Technical Interview Coach for IceHacks 2026.
Your focus:
1. Interview Cake Pedagogy: Guide the candidate with progressive Socratic questions and hints rather than giving away full answers.
2. Mobbin UI System Design: When discussing UI flows (like Linear, Airbnb, Spotify), discuss component hierarchies, state separation (draft vs global vs server cache), and edge cases (focus trap, offline mode, virtualization).
3. Big-O Complexity: Always prompt candidates to state and justify their Time and Space complexity.
Keep your responses conversational, structured, concise, and formatted in clean markdown.`;

export async function askAiCoach(
  userPrompt: string, 
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> {
  try {
    const contents = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_INSTRUCTION }]
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (replyText) {
      return replyText;
    }
    throw new Error("No response parts received");
  } catch (error) {
    console.warn("Falling back to local Socratic reasoning:", error);
    // Intelligent fallback in case of network issues
    if (userPrompt.toLowerCase().includes('apple') || userPrompt.toLowerCase().includes('stock')) {
      return `To optimize Apple Stocks to O(n) time and O(1) space, track \`minPrice\` and \`maxProfit\` greedily in a single pass. 
**Question for you:** What should \`maxProfit\` be initialized to if prices keep falling all day (e.g. \`[10, 8, 5, 2]\`)?`;
    }
    return `That's a key interview topic! In a technical screen, remember to:
1. Clarify constraints & scale first.
2. Outline the brute force O(n²) baseline, then introduce the optimal O(n) structure.
3. Walk through an edge case test.
What specific part would you like to evaluate next?`;
  }
}

export async function generateAiScorecard(
  solvedCount: number, 
  completedFlowsCount: number
): Promise<InterviewScorecard> {
  try {
    const prompt = `Based on a candidate who has solved ${solvedCount} Interview Cake DSA problems and mastered ${completedFlowsCount} Mobbin UI System Design flows, generate a realistic Interview Readiness Scorecard.
Return ONLY valid JSON matching this schema:
{
  "overallScore": number (70-98),
  "problemSolving": number (70-98),
  "systemArchitecture": number (70-98),
  "communication": number (70-98),
  "strengths": [string, string, string],
  "improvements": [string, string],
  "summary": string
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
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonText) {
        return JSON.parse(jsonText) as InterviewScorecard;
      }
    }
  } catch (e) {
    console.warn("Fallback scorecard generation:", e);
  }

  // Fallback
  return {
    overallScore: Math.min(96, 72 + (solvedCount * 8) + (completedFlowsCount * 6)),
    problemSolving: Math.min(98, 75 + (solvedCount * 8)),
    systemArchitecture: Math.min(94, 68 + (completedFlowsCount * 9)),
    communication: 92,
    strengths: [
      'Recognizes single-pass Greedy optimizations over O(n²) loops',
      'Understands draft vs global state isolation in complex modals',
      'Attention to keyboard accessibility and focus trapping'
    ],
    improvements: [
      'Explicitly guard against empty or single-element inputs',
      'Articulate Big-O trade-offs aloud before writing code'
    ],
    summary: 'Candidate shows strong dual competency in algorithmic data structures and modern component state architecture.'
  };
}
