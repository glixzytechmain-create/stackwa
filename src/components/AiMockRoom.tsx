import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  ArrowUpRight, 
  User as UserIcon,
  RefreshCw,
  Download
} from 'lucide-react';
import { ChatMessage, InterviewScorecard } from '../types';

interface AiMockRoomProps {
  solvedCount: number;
  completedFlowsCount: number;
}

export const AiMockRoom: React.FC<AiMockRoomProps> = ({ 
  solvedCount, 
  completedFlowsCount 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello! I'm your Socratic AI Mock Interviewer at Stackwa. 
I'm here to challenge your code's time/space complexity, test edge cases, and evaluate your Frontend UI system design. 

What problem or UI pattern are you currently working through? Or would you like me to quiz you on one?`,
      timestamp: 'Just now'
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scorecard, setScorecard] = useState<InterviewScorecard | null>(null);

  const quickPrompts = [
    'How do I optimize Apple Stocks from O(n²) to O(n)?',
    'What are the edge cases for Linear Command Palette?',
    'Why should modal filters use draft state instead of global state?',
    'Generate my Interview Readiness Scorecard'
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';

      if (text.toLowerCase().includes('scorecard') || text.toLowerCase().includes('readiness')) {
        reply = `I have compiled your Interview Readiness Report based on your progress across Interview Cake DSA and Mobbin UI challenges! Check out your scorecard on the right panel.`;
        setScorecard({
          overallScore: Math.min(95, 70 + (solvedCount * 8) + (completedFlowsCount * 6)),
          problemSolving: Math.min(98, 75 + (solvedCount * 8)),
          systemArchitecture: Math.min(94, 68 + (completedFlowsCount * 9)),
          communication: 90,
          strengths: [
            'Recognizes Greedy vs Brute Force optimization patterns early',
            'Strong understanding of draft vs global state separation in complex modals',
            'Careful attention to keyboard accessibility and focus trapping'
          ],
          improvements: [
            'Remember to explicitly check for array length < 2 before index access',
            'Practice articulating time complexity tradeoffs out loud before coding'
          ],
          summary: `Strong candidate profile. Demonstrates mastery over both low-level algorithmic efficiency and high-level React UI component design.`
        });
      } else if (text.toLowerCase().includes('apple stocks') || text.toLowerCase().includes('o(n)')) {
        reply = `Great question! The brute force method checks every buy/sell combination, taking O(n²). 

To reach O(n), think like an opportunistic investor: as you walk through the array:
1. Always remember the **lowest price seen so far** (\`minPrice\`).
2. At every minute, check: *"If I sold right now having bought at \`minPrice\`, what would my profit be?"*
3. Update \`maxProfit\` if this profit beats your record.

**Socratic Question:** What should \`maxProfit\` be initialized to if prices continuously fall all day (e.g. [9, 7, 5, 2])?`;
      } else if (text.toLowerCase().includes('command palette') || text.toLowerCase().includes('linear')) {
        reply = `For Linear's Command Palette, top edge cases to watch for in FAANG interviews:
1. **Focus Trap:** When opened, the tab key must cycle only within the modal. Pressing Escape must return focus to the exact button that launched it.
2. **Virtualization:** What happens when an organization has 5,000 issues? You must virtualize the list (rendering only 15 items in DOM) to prevent lag.
3. **IME Composition:** If a user searches in Japanese/Chinese, avoid firing search queries mid-keystroke during character composition!`;
      } else if (text.toLowerCase().includes('draft state') || text.toLowerCase().includes('filter')) {
        reply = `In Airbnb's filter drawer, using **draft state** is critical:
If the filter modal directly edited the global application state, every movement of the price slider would trigger re-fetching listing data and re-rendering map markers! 

By keeping a cloned \`draftFilters\` state locally inside the modal, network requests and map calculations are deferred until the user explicitly commits by clicking *"Show stays"*. If they hit cancel, the draft is discarded without touching global state.`;
      } else {
        reply = `That's a classic interview discussion point! 

In an interview, I recommend structuring your answer with the **P.A.T.H.** framework:
1. **P**arameters & Constraints (Clarify scale, duplicates, null values).
2. **A**pproach (Start with the naive O(n²) solution, then propose the optimal O(n) or O(n log n) data structure).
3. **T**radeoffs (Explain why you chose space complexity over time, or vice-versa).
4. **H**appy path & Edge test (Walk through a 3-element test case).

Would you like me to walk through a test case or generate your readiness scorecard?`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        timestamp: 'Just now'
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chat Feed Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[700px] glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          
          {/* Chat Header */}
          <div className="bg-slate-900/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Stackwa Socratic AI Coach</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-slate-400">Trained on Interview Cake Pedagogy & Mobbin Architecture</p>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([messages[0]]);
                setScorecard(null);
              }}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 transition"
              title="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap pl-1">Ask:</span>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white hover:bg-indigo-600/30 border border-slate-800 transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'glass-card border border-slate-800 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`block text-[10px] mt-2 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-500 text-xs italic">
                <Bot className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>AI Coach is analyzing your reasoning...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-slate-900/80 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a technical question, paste your code, or ask for feedback..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md transition flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Scorecard Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Interview Readiness Scorecard</h3>
              </div>
              
              {scorecard && (
                <button
                  onClick={() => alert("Report exported! Ready for your portfolio and hackathon submission.")}
                  className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              )}
            </div>

            {scorecard ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Overall Score Dial */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30 border border-indigo-500/30 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">Overall Readiness</span>
                  <div className="text-4xl font-extrabold text-white mt-1 mb-1">
                    {scorecard.overallScore}%
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">
                    Tier 1 Ready (FAANG / High-Growth Startup)
                  </span>
                </div>

                {/* Sub Scores */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Algorithmic Problem Solving</span>
                      <span className="text-indigo-400">{scorecard.problemSolving}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${scorecard.problemSolving}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">UI & System Architecture</span>
                      <span className="text-purple-400">{scorecard.systemArchitecture}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${scorecard.systemArchitecture}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Technical Communication</span>
                      <span className="text-emerald-400">{scorecard.communication}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scorecard.communication}%` }} />
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Observed Strengths:</span>
                  </span>
                  <ul className="space-y-1">
                    {scorecard.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Recommended Polish:</span>
                  </span>
                  <ul className="space-y-1">
                    {scorecard.improvements.map((imp, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No scorecard generated yet</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Click the button below or type in the chat to have the AI evaluate your current problem-solving and UI design progress.
                </p>
                <button
                  onClick={() => handleSendMessage('Generate my Interview Readiness Scorecard')}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
                >
                  Generate Evaluation Report
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
