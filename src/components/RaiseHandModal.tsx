import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DsaProblem, InterviewClarifyingQuestion } from '../types';
import { askClarifyingQuestion } from '../services/aiService';
import { voiceService } from '../services/voiceService';
import { DecryptedText } from './DecryptedText';

interface RaiseHandModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: DsaProblem;
  clarifyingQuestions: InterviewClarifyingQuestion[];
  onAddQuestion: (q: InterviewClarifyingQuestion) => void;
}

export const RaiseHandModal: React.FC<RaiseHandModalProps> = ({
  isOpen,
  onClose,
  problem,
  clarifyingQuestions,
  onAddQuestion
}) => {
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingAnswer, setIsSpeakingAnswer] = useState(false);

  if (!isOpen) return null;

  const COMMON_QUESTIONS = [
    "Can the input array contain negative numbers or be empty?",
    "Are the inputs guaranteed to be sorted?",
    "What are the target memory constraints for this environment?",
    "Can we mutate the input collection in-place?"
  ];

  const handleVoiceToggle = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      const started = voiceService.startListening(
        (transcript) => {
          setQuestionText(transcript);
        },
        {
          onError: () => setIsListening(false),
          onEnd: () => setIsListening(false)
        }
      );
      setIsListening(started);
    }
  };

  const handleSubmit = async (textToSubmit?: string) => {
    const q = textToSubmit || questionText;
    if (!q.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setQuestionText('');

    try {
      const answer = await askClarifyingQuestion(problem, q);
      const newEntry: InterviewClarifyingQuestion = {
        id: `q-${Date.now()}`,
        question: q,
        answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onAddQuestion(newEntry);

      // Speak answer aloud
      setIsSpeakingAnswer(true);
      voiceService.speak(answer, {
        onEnd: () => setIsSpeakingAnswer(false),
        onError: () => setIsSpeakingAnswer(false)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpeakAnswer = (text: string) => {
    if (isSpeakingAnswer) {
      voiceService.stopSpeaking();
      setIsSpeakingAnswer(false);
    } else {
      setIsSpeakingAnswer(true);
      voiceService.speak(text, {
        onEnd: () => setIsSpeakingAnswer(false),
        onError: () => setIsSpeakingAnswer(false)
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-2xl oled-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg">
              ✋
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Raise Hand — Clarifying Question</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Interviewer Active
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                In real technical screens, proactive clarification of constraints is rewarded.
              </p>
            </div>
          </div>

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

        {/* Question Log History */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {clarifyingQuestions.length === 0 ? (
            <div className="p-5 rounded-2xl bg-neutral-900/40 border border-white/5 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-300">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>Common Clarifying Vectors for {problem.title}:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(q)}
                    className="p-3 text-left rounded-xl bg-neutral-950 border border-white/5 hover:border-rose-500/40 text-neutral-300 hover:text-white text-xs transition"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {clarifyingQuestions.map(item => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-start justify-end">
                    <div className="max-w-[85%] bg-rose-600/20 border border-rose-500/30 rounded-2xl p-3 text-xs text-rose-100">
                      <div className="text-[10px] text-rose-400 font-mono mb-1">Candidate ({item.timestamp})</div>
                      {item.question}
                    </div>
                  </div>

                  <div className="flex items-start justify-start">
                    <div className="max-w-[85%] bg-neutral-900/90 border border-white/10 rounded-2xl p-3 text-xs text-neutral-200 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-sky-400 font-mono">
                        <span>Interviewer Response</span>
                        <button
                          onClick={() => handleSpeakAnswer(item.answer)}
                          className="flex items-center space-x-1 hover:text-white transition"
                        >
                          {isSpeakingAnswer ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isSpeakingAnswer ? 'Stop' : 'Listen'}</span>
                        </button>
                      </div>
                      <DecryptedText text={item.answer} speed={15} maxDurationMs={350} className="leading-relaxed block" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Bar with Voice Support */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center space-x-2 bg-black/60 rounded-2xl p-2 border border-white/15 focus-within:border-rose-500 transition">
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`p-2.5 rounded-xl transition ${
                isListening 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
              }`}
              title={isListening ? "Stop listening" : "Speak question (Voice input)"}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={isListening ? "Listening to your voice..." : "Ask a clarifying constraint or scale question..."}
              className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none px-2"
              disabled={isSubmitting}
            />

            <button
              onClick={() => handleSubmit()}
              disabled={!questionText.trim() || isSubmitting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2 px-1">
            <span>Clarifications are recorded and positively impact your communication score.</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
