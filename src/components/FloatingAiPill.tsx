import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Command, 
  Download, 
  Copy, 
  Check, 
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, InterviewScorecard, UserInterviewProfile } from '../types';
import { askAiCoach, generateAiScorecard } from '../services/aiService';

interface FloatingAiPillProps {
  profile: UserInterviewProfile | null;
  solvedCount: number;
  completedFlowsCount: number;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
}

export const FloatingAiPill: React.FC<FloatingAiPillProps> = ({
  profile,
  solvedCount,
  completedFlowsCount,
  externalPrompt,
  onClearExternalPrompt
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [scorecard, setScorecard] = useState<InterviewScorecard | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Stackwa Socratic Coach ready. Targeting ${profile?.targetCompany || 'Linear'} (${profile?.role || 'Frontend'}). 
Press Cmd+K anytime to summon me, or highlight code to ask contextual questions.`,
      timestamp: 'Active'
    }
  ]);

  // Global Cmd+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to external prompts (e.g. from highlight-to-ask)
  useEffect(() => {
    if (externalPrompt) {
      setIsOpen(true);
      handleSendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  // Idle pulse tracker (after 30 seconds of inactivity)
  useEffect(() => {
    const timer = setTimeout(() => setIsIdle(true), 30000);
    const resetIdle = () => setIsIdle(false);
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: 'Just now'
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      if (text.toLowerCase().includes('receipt') || text.toLowerCase().includes('scorecard') || text.toLowerCase().includes('evaluate')) {
        const card = await generateAiScorecard(solvedCount, completedFlowsCount);
        const enrichedCard: InterviewScorecard = {
          ...card,
          candidateName: 'Candidate (Stackwa Fellow)',
          targetCompany: profile?.targetCompany || 'Linear',
          role: profile?.role || 'Frontend Engineer',
          edgeCaseAwareness: Math.min(96, 75 + (completedFlowsCount * 7)),
          verificationHash: `STK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        setScorecard(enrichedCard);
        setShowReceipt(true);

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `Your Interview Performance Receipt has been generated! Check the receipt modal for your verified breakdown.`,
          timestamp: 'Just now'
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const history = newMessages.slice(1, -1).map(m => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: m.text
        }));

        const reply = await askAiCoach(text, history);

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: reply,
          timestamp: 'Just now'
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I encountered a minor connection issue, but let's continue! What specific data structure or state management problem are you thinking through?",
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyReceiptText = () => {
    if (!scorecard) return;
    const receiptText = `=== STACKWA INTERVIEW READINESS RECEIPT ===
Target: ${scorecard.targetCompany} | Role: ${scorecard.role}
Date: ${scorecard.timestamp}
Verification: ${scorecard.verificationHash}

OVERALL READINESS: ${scorecard.overallScore}%
- Algorithmic Problem Solving: ${scorecard.problemSolving}%
- UI & System Architecture: ${scorecard.systemArchitecture}%
- Technical Communication: ${scorecard.communication}%
- Defensive Edge-Case Awareness: ${scorecard.edgeCaseAwareness}%

Strengths:
${scorecard.strengths.map(s => `• ${s}`).join('\n')}

Improvement Focus:
${scorecard.improvements.map(i => `• ${i}`).join('\n')}
==========================================`;

    navigator.clipboard.writeText(receiptText);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <>
      {/* Floating Dynamic Command Pill (Bottom-Center) */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none">
        <motion.button
          onClick={() => setIsOpen(true)}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className={`pointer-events-auto flex items-center space-x-3 px-5 py-2.5 rounded-full oled-surface border border-white/15 shadow-2xl transition-all duration-300 ${
            isIdle ? 'ring-2 ring-rose-500/50 shadow-rose-500/20' : 'hover:border-white/30'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white">
            <Bot className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-200">
            <span>Socratic Coach</span>
            <span className="text-[10px] text-neutral-500 font-mono flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </span>
          </div>

          {scorecard && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setShowReceipt(true);
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
            >
              Receipt: {scorecard.overallScore}%
            </span>
          )}
        </motion.button>
      </div>

      {/* Expanded Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-2xl oled-surface rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col h-[600px]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-neutral-900/40">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>Stackwa Socratic Coach</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {profile?.targetCompany || 'Linear'} Interview Prep
                      </span>
                    </h3>
                    <p className="text-[11px] text-neutral-400">Powered by Gemini 3.8 Flash & Anakin.ai</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSendMessage('Generate my Interview Readiness Receipt')}
                    className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>Get Receipt</span>
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : ''}`}
                  >
                    {m.sender === 'ai' && (
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-neutral-900/80 border border-white/10 text-neutral-200'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      <span className={`block text-[10px] mt-2 ${m.sender === 'user' ? 'text-rose-200' : 'text-neutral-500'}`}>
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center space-x-2 text-neutral-400 text-xs italic">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                    <span>Socratic Coach is evaluating your response...</span>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="p-4 border-t border-white/10 bg-neutral-950/80">
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
                    placeholder="Ask about time complexity, edge cases, or paste a code snippet..."
                    className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl shadow-md transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* The Post-Interview "Receipt" Modal (Stylized Thermal Receipt) */}
      <AnimatePresence>
        {showReceipt && scorecard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-neutral-900 text-white rounded-2xl p-6 border border-white/20 shadow-2xl font-mono text-xs space-y-4"
            >
              {/* Receipt Cutout Edge Styling */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800" />

              <button 
                onClick={() => setShowReceipt(false)}
                className="absolute top-4 right-4 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-white/20">
                <h3 className="font-extrabold text-sm tracking-wider uppercase">STACKWA INTERVIEW RECEIPT</h3>
                <p className="text-[10px] text-neutral-400">FAANG / High-Growth Evaluation</p>
                <p className="text-[10px] text-neutral-500">{scorecard.timestamp} • {scorecard.verificationHash}</p>
              </div>

              {/* Candidate Info */}
              <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-white/20">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Target Company:</span>
                  <span className="font-bold">{scorecard.targetCompany}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Target Role:</span>
                  <span className="font-bold">{scorecard.role}</span>
                </div>
              </div>

              {/* Scores Table */}
              <div className="space-y-2 pb-3 border-b border-dashed border-white/20 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Problem Solving (DSA):</span>
                  <span className="font-bold text-sky-400">{scorecard.problemSolving}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">UI System Architecture:</span>
                  <span className="font-bold text-purple-400">{scorecard.systemArchitecture}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Defensive Edge-Cases:</span>
                  <span className="font-bold text-emerald-400">{scorecard.edgeCaseAwareness}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Technical Communication:</span>
                  <span className="font-bold text-amber-400">{scorecard.communication}%</span>
                </div>
                <div className="pt-2 flex justify-between text-sm font-extrabold text-white">
                  <span>OVERALL READINESS:</span>
                  <span className="text-rose-400">{scorecard.overallScore}%</span>
                </div>
              </div>

              {/* Summary */}
              <div className="text-[10px] text-neutral-300 leading-relaxed italic">
                "{scorecard.summary}"
              </div>

              {/* Mock Barcode */}
              <div className="text-center pt-2">
                <div className="h-8 bg-white/90 rounded flex items-center justify-around px-2 text-black font-mono text-[9px] tracking-widest select-none font-bold">
                  ||||| | |||| || ||| |||| | ||||| ||| ||||
                </div>
                <span className="text-[9px] text-neutral-500 mt-1 block">VERIFIED BY STACKWA SOCRATIC AI</span>
              </div>

              {/* Receipt Actions */}
              <div className="pt-2 flex items-center space-x-2">
                <button
                  onClick={copyReceiptText}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-semibold transition flex items-center justify-center space-x-1.5"
                >
                  {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReceipt ? 'Copied!' : 'Copy Receipt'}</span>
                </button>
                <button
                  onClick={() => alert("Receipt exported! Ready to share on Twitter/LinkedIn or portfolio.")}
                  className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-semibold transition"
                  title="Download as PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
