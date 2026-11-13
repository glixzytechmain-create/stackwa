import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X, 
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserInterviewProfile, DayPlan, DsaProblem, OnboardingMessage } from '../types';
import { conductOnboardingTurn, generateDynamicChallenge } from '../services/aiService';
import { voiceService } from '../services/voiceService';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserInterviewProfile, roadmap: DayPlan[], customChallenge?: DsaProblem) => void;
  initialProfile?: UserInterviewProfile | null;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialProfile
}) => {
  const [messages, setMessages] = useState<OnboardingMessage[]>([
    {
      id: 'init',
      sender: 'interviewer',
      text: initialProfile?.targetCompany 
        ? `Welcome back! We are currently calibrated for ${initialProfile.targetCompany} (${initialProfile.role}). Would you like to recalibrate for a new company, role, or specific upcoming interview date?`
        : "Welcome to Stackwa. I'm your Technical Interview Lead. Let's calibrate your high-stakes preparation: What company and engineering role are you interviewing for, when is your interview scheduled, and what rounds or topics feel most intimidating right now?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Read initial greeting aloud on mount if open
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      voiceService.speak(messages[0].text, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
      setIsSpeaking(true);
    }
    return () => {
      voiceService.stopSpeaking();
      voiceService.stopListening();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVoiceToggle = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      const started = voiceService.startListening(
        (transcript) => {
          setInputText(transcript);
        },
        {
          onError: () => setIsListening(false),
          onEnd: () => setIsListening(false)
        }
      );
      setIsListening(started);
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isTyping || isGeneratingPlan) return;

    voiceService.stopSpeaking();
    setIsSpeaking(false);

    const userMsg: OnboardingMessage = {
      id: `usr-${Date.now()}`,
      sender: 'candidate',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsTyping(true);

    try {
      const result = await conductOnboardingTurn(newHistory, text);

      const aiMsg: OnboardingMessage = {
        id: `ai-${Date.now()}`,
        sender: 'interviewer',
        text: result.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);

      // Speak interviewer reply
      setIsSpeaking(true);
      voiceService.speak(result.replyText, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });

      // If calibration is complete, synthesize full custom plan & challenge
      if (result.isComplete && result.extractedProfile) {
        setIsGeneratingPlan(true);

        const extracted = result.extractedProfile;
        const targetCompany = extracted.targetCompany || 'Tech Company';
        const role = extracted.role || 'Software Engineer';
        const seniority = extracted.seniority || 'Mid-Level';
        const days = Math.max(3, extracted.daysRemaining || 7);
        const focusAreas = extracted.focusAreas || ['System Architecture', 'Algorithmic Optimization', 'Defensive Edge Cases'];

        // Synthesize dynamic challenge for their exact company
        const customChallenge = await generateDynamicChallenge(targetCompany, role, focusAreas[0]);

        // Generate tailored daywise roadmap matching their exact timeline
        const roadmap: DayPlan[] = [];
        for (let d = 1; d <= Math.min(days, 14); d++) {
          roadmap.push({
            dayNumber: d,
            dateLabel: `Day ${d} — ${d === 1 ? 'Diagnostic & Constraints' : d === days ? 'Final Mock Simulation' : 'Deep Mastery'}`,
            theme: d === 1 
              ? `${targetCompany} Core Invariants & Complexity` 
              : `${focusAreas[(d - 1) % focusAreas.length]} Deep Dive`,
            dsaProblemId: customChallenge.id,
            uiChallengeId: 'linear-command-palette',
            dailyRitual: `Spend 25 minutes solving ${targetCompany} algorithmic boundaries without looking at hints.`,
            isCompleted: false
          });
        }

        const profile: UserInterviewProfile = {
          targetCompany,
          role,
          seniority,
          interviewDate: extracted.interviewDate || new Date(Date.now() + days * 86400000).toISOString().split('T')[0],
          daysRemaining: days,
          focusAreas,
          calendarConnected: false,
          onboardingCompleted: true
        };

        setTimeout(() => {
          setIsGeneratingPlan(false);
          onComplete(profile, roadmap, customChallenge);
          onClose();
        }, 1500);
      }
    } catch (e) {
      setIsTyping(false);
      console.warn("Error in onboarding turn:", e);
    }
  };

  const handleToggleAudio = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      const lastAiMessage = [...messages].reverse().find(m => m.sender === 'interviewer');
      if (lastAiMessage) {
        setIsSpeaking(true);
        voiceService.speak(lastAiMessage.text, {
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false)
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="relative w-full max-w-2xl oled-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col h-[650px] overflow-hidden"
      >
        {/* Subtle Ambient Background Sweep */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">AI Interview Calibration</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                  Socratic Lead
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Conversational calibration tailoring Stackwa to your specific company, role, & date.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-xl transition border ${
                isSpeaking 
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/30 animate-pulse' 
                  : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border-white/5'
              }`}
              title={isSpeaking ? "Mute Interviewer Voice" : "Listen to Interviewer Voice"}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                voiceService.stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start ${msg.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-1 ${
                  msg.sender === 'candidate'
                    ? 'bg-rose-600/20 border border-rose-500/40 text-rose-100 rounded-tr-none'
                    : 'bg-neutral-900/90 border border-white/10 text-neutral-200 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                  <span className={msg.sender === 'candidate' ? 'text-rose-400 font-bold' : 'text-neutral-300 font-bold'}>
                    {msg.sender === 'candidate' ? 'You' : 'AI Interview Lead'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-neutral-400 p-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Interviewer is evaluating your response...</span>
            </div>
          )}

          {isGeneratingPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-neutral-950 border border-rose-500/40 text-center space-y-2"
            >
              <div className="flex items-center justify-center space-x-2 text-rose-400 font-bold text-xs">
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Synthesizing Company-Specific Challenges & Daywise Plan...</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Grounding test cases, constraints, and architecture in your target role.
              </p>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice Support */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center space-x-2 bg-black/70 rounded-2xl p-2 border border-white/15 focus-within:border-rose-500 transition">
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`p-2.5 rounded-xl transition ${
                isListening 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
              }`}
              title={isListening ? "Stop listening" : "Speak via Voice"}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isListening ? "Listening to your voice..." : "Type your target company, role, timeline, and focus areas..."}
              className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none px-2"
              disabled={isTyping || isGeneratingPlan}
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping || isGeneratingPlan}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2 px-1">
            <span>Example: "Senior Frontend Engineer at Stripe in 18 days, nervous about concurrency & payment state"</span>
            <span>Supports Voice (Mic) & Keyboard</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
