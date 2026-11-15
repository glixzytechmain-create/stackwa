import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { voiceService } from '../services/voiceService';
import { gradeVoiceDebate, VoiceDebateEvaluation } from '../services/aiService';

export interface VoiceDebateRoomProps {
  role: string;
  company: string;
  problemTitle: string;
  problemCategory: string;
  problemCode?: string;
  onConcludeDebate: (evaluation: VoiceDebateEvaluation) => void;
  existingScore?: number | null;
}

interface DebateMessage {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export const VoiceDebateRoom: React.FC<VoiceDebateRoomProps> = ({
  role,
  company,
  problemTitle,
  problemCategory,
  problemCode: _problemCode = '',
  onConcludeDebate,
  existingScore = null
}) => {
  const [difficulty, setDifficulty] = useState<'Foundational' | 'Rigorous' | 'Principal Architect'>('Rigorous');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(() => voiceService.getVoiceGender());
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [candidateInput, setCandidateInput] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<VoiceDebateEvaluation | null>(null);

  const [transcript, setTranscript] = useState<DebateMessage[]>([]);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to voice speaking state for waveforms
  useEffect(() => {
    const unsubscribe = voiceService.onSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsubscribe();
      voiceService.stopSpeaking();
      voiceService.stopListening();
    };
  }, []);

  // Update voice gender
  const handleVoiceGenderChange = (gender: 'male' | 'female') => {
    setVoiceGender(gender);
    voiceService.setVoiceGender(gender);
  };

  // Initial authentic technical interview greeting from AI Lead Interviewer
  useEffect(() => {
    if (transcript.length === 0) {
      const initialGreeting = `Hello and welcome! I'm your lead technical interviewer for the ${role} role at ${company}. Great to meet you today. To get started with our session on ${problemTitle}, could you briefly introduce yourself and share how you generally approached the requirements?`;
      
      const greetingMsg: DebateMessage = {
        id: `msg-${Date.now()}`,
        sender: 'interviewer',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTranscript([greetingMsg]);

      // Speak greeting
      setTimeout(() => {
        voiceService.speak(initialGreeting, { gender: voiceGender });
      }, 400);
    }
  }, [company, role, problemTitle]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isAiThinking]);

  // Toggle Mic Recording (Speech-to-Text) with Explicit Permission Check
  const toggleListening = async () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      setMicStatus(null);
    } else {
      voiceService.stopSpeaking(); // Pause interviewer speech while candidate speaks
      setMicStatus('Connecting to microphone...');

      // Request browser microphone access explicitly (essential for Safari/Chrome permissions)
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop stream tracks immediately so speech recognition takes exclusive access
          stream.getTracks().forEach(track => track.stop());
        } catch (permErr: any) {
          console.warn("Microphone access error:", permErr);
          setMicStatus('Microphone blocked. Please allow mic in browser settings.');
          setTimeout(() => setMicStatus(null), 4000);
          return;
        }
      }

      setMicStatus('Microphone Live • Listening...');
      const started = voiceService.startListening(
        (recognizedText) => {
          setCandidateInput(recognizedText);
        },
        {
          onEnd: () => {
            setIsListening(false);
            setMicStatus(null);
          },
          onError: (err) => {
            console.warn("Speech recognition error:", err);
            setIsListening(false);
            if (err === 'not-allowed') {
              setMicStatus('Microphone permission blocked. Please allow in Safari settings.');
            } else {
              setMicStatus('Microphone paused. You can also type your reply.');
            }
            setTimeout(() => setMicStatus(null), 4000);
          }
        }
      );
      if (started) {
        setIsListening(true);
      } else {
        setMicStatus('Speech recognition not supported in this browser. Please type.');
        setTimeout(() => setMicStatus(null), 4000);
      }
    }
  };

  // Send candidate turn and generate AI Socratic pushback
  const handleSendTurn = async () => {
    const textToSend = candidateInput.trim();
    if (!textToSend || isAiThinking) return;

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      setMicStatus(null);
    }

    const candidateMsg: DebateMessage = {
      id: `msg-${Date.now()}-cand`,
      sender: 'candidate',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedTranscript = [...transcript, candidateMsg];
    setTranscript(updatedTranscript);
    setCandidateInput('');
    setIsAiThinking(true);

    // Call Gemini for authentic technical interview dialogue
    try {
      const prompt = `You are a Principal Technical Interviewer at ${company} conducting a natural, high-signal technical interview for a ${role} position.
PROBLEM DISCUSSED: ${problemTitle} (${problemCategory}).
INTERVIEW LEVEL / SENIORITY: ${difficulty}.

Conversation so far:
${updatedTranscript.map(t => `${t.sender === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${t.text}`).join('\n')}

INSTRUCTIONS & CONVERSATIONAL PHASING:
1. NATURAL HUMAN CONVERSATION:
   - Speak like a friendly, sharp senior engineer having a real conversation in an interview room.
   - Keep spoken turns concise (2-3 sentences max) so it feels like natural spoken dialogue.
   - NO markdown formatting, asterisks, bullet points, or code blocks in your spoken output.
2. DYNAMIC CONVERSATION STAGES:
   - Stage 1 (Greeting & Introduction): If the candidate just greeted you or introduced themselves, acknowledge their background warmly and invite them to share how they thought about ${problemTitle} or their high-level architectural choices.
   - Stage 2 (Technical Discussion): Listen to their explanation. Ask clarifying questions about what data structures or boundaries they decided to use.
   - Stage 3 (Targeted Socratic Exploration): ONLY probe or challenge a claim if the candidate ACTUALLY made that claim in the conversation! NEVER claim the candidate said something they didn't say.
3. ADAPTIVE PROBING BASED ON DIFFICULTY (${difficulty}):
   - If Foundational: Ask about Big-O bounds and straightforward edge cases based on their stated logic.
   - If Rigorous: Probe memory footprint, concurrency safety, or cache invalidation relevant to their chosen solution.
   - If Principal Architect: Discuss distributed state consistency, cascading failure mitigation, or tail latency tradeoffs.
4. HONEST ATTRIBUTION:
   - Ground every response strictly in what the candidate actually just said. Do NOT invent claims or put words in their mouth.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiText) {
          const aiMsg: DebateMessage = {
            id: `msg-${Date.now()}-ai`,
            sender: 'interviewer',
            text: aiText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setTranscript(prev => [...prev, aiMsg]);
          setIsAiThinking(false);
          // Speak AI response in chosen natural voice
          voiceService.speak(aiText, { gender: voiceGender });
          return;
        }
      }
    } catch (err) {
      console.warn("AI debate error:", err);
    }

    // Fallback response
    const fallbackAi = `Thanks for walking through that. Looking at the invariants for ${problemTitle}, what would you consider the primary trade-off of this approach compared to an alternative design?`;
    const fallbackMsg: DebateMessage = {
      id: `msg-${Date.now()}-ai`,
      sender: 'interviewer',
      text: fallbackAi,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTranscript(prev => [...prev, fallbackMsg]);
    setIsAiThinking(false);
    voiceService.speak(fallbackAi, { gender: voiceGender });
  };

  // Conclude Debate & Grade Candidate
  const handleConcludeAndGrade = async () => {
    setIsGrading(true);
    voiceService.stopSpeaking();
    voiceService.stopListening();

    const evaluationResult = await gradeVoiceDebate(transcript, role, company, difficulty);
    setEvaluation(evaluationResult);
    setIsGrading(false);
    onConcludeDebate(evaluationResult);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="oled-panel rounded-3xl p-6 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                Round 3: Live Voice Debate
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {company} • {role}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Socratic Architectural Defense
            </h3>
          </div>

          {/* Difficulty & Voice Selection Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Difficulty Selector */}
            <div className="flex items-center p-0.5 rounded-xl bg-black/60 border border-white/10">
              {(['Foundational', 'Rigorous', 'Principal Architect'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                    difficulty === d ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {d === 'Principal Architect' ? 'Principal' : d}
                </button>
              ))}
            </div>

            {/* Voice Gender Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-black/60 border border-white/10">
              <button
                onClick={() => handleVoiceGenderChange('male')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition text-[11px] ${
                  voiceGender === 'male' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Fixed Natural Male Voice (Alex/Daniel)"
              >
                <span>👨 Male Voice</span>
              </button>
              <button
                onClick={() => handleVoiceGenderChange('female')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition text-[11px] ${
                  voiceGender === 'female' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Fixed Natural Female Voice (Samantha/Victoria)"
              >
                <span>👩 Female Voice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Audio Visualizer Banner */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isSpeaking 
                ? 'bg-rose-500 animate-ping' 
                : isListening 
                  ? 'bg-emerald-400 animate-pulse' 
                  : 'bg-neutral-600'
            }`} />
            <div className="text-xs font-mono">
              {micStatus ? (
                <span className="text-amber-400 font-bold">{micStatus}</span>
              ) : isSpeaking ? (
                <span className="text-rose-400 font-bold">Interviewer Speaking ({voiceGender} voice)...</span>
              ) : isListening ? (
                <span className="text-emerald-400 font-bold">Microphone Live • Listening to you...</span>
              ) : isAiThinking ? (
                <span className="text-amber-400 font-bold">Interviewer evaluating your thought process...</span>
              ) : (
                <span className="text-neutral-400">Ready • Speak via microphone or type your response below</span>
              )}
            </div>
          </div>

          {/* Soundwave Bars Simulation */}
          <div className="flex items-center space-x-1">
            {[4, 12, 8, 16, 6, 14, 9, 15, 7, 11].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking 
                    ? 'bg-rose-500' 
                    : isListening 
                      ? 'bg-emerald-400' 
                      : 'bg-neutral-800'
                }`}
                style={{
                  height: (isSpeaking || isListening) ? `${Math.max(4, (h * (i % 2 === 0 ? 1.5 : 0.8)))}px` : '4px'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Transcript Chat Window */}
      <div className="oled-panel rounded-3xl p-6 border border-white/10 flex flex-col h-[380px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono text-xs">
          {transcript.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.sender === 'candidate' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center space-x-2 mb-1 text-[10px] text-neutral-500">
                <span>{msg.sender === 'interviewer' ? `Lead Interviewer (${voiceGender})` : 'You (Candidate)'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div
                className={`max-w-[85%] p-4 rounded-2xl leading-relaxed text-xs ${
                  msg.sender === 'candidate'
                    ? 'bg-rose-600 text-white rounded-br-none shadow-lg'
                    : 'bg-neutral-900 border border-white/10 text-neutral-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {isAiThinking && (
            <div className="flex items-center space-x-2 text-neutral-500 text-xs italic">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Interviewer is evaluating your reasoning...</span>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Input Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center space-x-2">
          {/* Mic Toggle Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-2xl border transition flex items-center justify-center ${
              isListening
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20 animate-pulse'
                : 'bg-neutral-900 text-neutral-300 border-white/10 hover:border-white/20 hover:text-white'
            }`}
            title={isListening ? "Stop Microphone" : "Speak via Microphone"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-rose-400" />}
          </button>

          {/* Text Input Fallback */}
          <input
            type="text"
            value={candidateInput}
            onChange={(e) => setCandidateInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendTurn()}
            placeholder={isListening ? "Listening to your voice..." : "Type your defense or click the mic to speak..."}
            className="flex-1 bg-black border border-white/15 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition"
          />

          {/* Send Turn Button */}
          <button
            onClick={handleSendTurn}
            disabled={!candidateInput.trim() || isAiThinking}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-2 transition"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Defend</span>
          </button>
        </div>
      </div>

      {/* Conclude & Grade Action Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-neutral-900/60 border border-white/10">
        <div className="space-y-0.5 text-center sm:text-left">
          <h4 className="text-sm font-bold text-white">Finished Defending Your Architecture?</h4>
          <p className="text-xs text-neutral-400 font-mono">
            Conclude the debate to receive your verified Round 3 score out of 100.
          </p>
        </div>

        <button
          onClick={handleConcludeAndGrade}
          disabled={isGrading || transcript.length < 2}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition"
        >
          {isGrading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Grading Round 3 Defense...</span>
            </>
          ) : (
            <>
              <Award className="w-4 h-4" />
              <span>Conclude Debate & Grade Round 3</span>
            </>
          )}
        </button>
      </div>

      {/* Evaluation Results Card (When graded) */}
      {(evaluation || existingScore !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="oled-panel rounded-3xl p-6 border border-emerald-500/30 bg-emerald-950/20 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Round 3 Official Assessment</h4>
                <div className="text-xs text-emerald-400 font-mono">
                  Verdict: <strong>{evaluation?.verdict || 'Hire'}</strong>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-3xl font-extrabold font-mono text-emerald-400">
                {evaluation?.round3Score ?? existingScore ?? 85}
              </span>
              <span className="text-xs text-neutral-400 font-mono"> / 100</span>
            </div>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed font-mono">
            {evaluation?.feedback || "Candidate defended architectural invariants with clarity and sound engineering reasoning."}
          </p>

          {evaluation && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 font-mono uppercase">Key Strengths</span>
                <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
                  {evaluation.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-amber-400 font-mono uppercase">Points for Growth</span>
                <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
                  {evaluation.vulnerabilities.map((v, idx) => <li key={idx}>{v}</li>)}
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
