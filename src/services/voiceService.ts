// Web Speech API Voice Synthesis & Recognition Service

class VoiceService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private isSpeaking: boolean = false;
  private isListening: boolean = false;
  private listeners: Set<(isSpeaking: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  // Subscribe to speaking state changes (for waveform animations)
  public onSpeakingChange(callback: (isSpeaking: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isSpeaking);
    return () => this.listeners.delete(callback);
  }

  private setSpeaking(state: boolean) {
    this.isSpeaking = state;
    this.listeners.forEach(cb => cb(state));
  }

  // Text-To-Speech (TTS)
  public speak(
    text: string, 
    options?: {
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    if (!this.synth) {
      console.warn("Speech synthesis not supported in this browser.");
      options?.onEnd?.();
      return;
    }

    // Cancel any ongoing speech
    this.stopSpeaking();

    // Clean markdown symbols from spoken text
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#>[\]()]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate ?? 1.05;
    utterance.pitch = options?.pitch ?? 1.0;

    // Pick a natural English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Premium')))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.setSpeaking(true);
    };

    utterance.onend = () => {
      this.setSpeaking(false);
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.setSpeaking(false);
      this.currentUtterance = null;
      options?.onError?.(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.setSpeaking(false);
      this.currentUtterance = null;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  // Speech-To-Text (STT) via Web Speech API
  public startListening(
    onResult: (transcript: string) => void,
    options?: {
      onError?: (err: any) => void;
      onEnd?: () => void;
    }
  ): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn("Speech recognition not supported in this browser.");
      options?.onError?.("Speech recognition not supported in this browser. Please type instead.");
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          onResult(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        options?.onError?.(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        options?.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      options?.onError?.(err);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();
