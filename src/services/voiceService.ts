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

  private preferredGender: 'male' | 'female' = 'female';

  public getVoiceGender(): 'male' | 'female' {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stackwa_preferred_voice_gender');
      if (saved === 'male' || saved === 'female') {
        this.preferredGender = saved;
      }
    }
    return this.preferredGender;
  }

  public setVoiceGender(gender: 'male' | 'female'): void {
    this.preferredGender = gender;
    if (typeof window !== 'undefined') {
      localStorage.setItem('stackwa_preferred_voice_gender', gender);
    }
  }

  // Text-To-Speech (TTS)
  public speak(
    text: string, 
    options?: {
      gender?: 'male' | 'female';
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

    const targetGender = options?.gender || this.getVoiceGender();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate ?? 1.05;
    utterance.pitch = options?.pitch ?? (targetGender === 'male' ? 0.95 : 1.12);

    const voices = this.synth.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (targetGender === 'male') {
      // Find fixed natural male voice
      selectedVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('Fred') || v.name.includes('David') || v.name.includes('Male'))
      ) || voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google'))) || null;
    } else {
      // Find fixed natural female voice
      selectedVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Zira') || v.name.includes('Female'))
      ) || voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google'))) || null;
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en')) || null;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
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

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
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
        try { this.recognition.abort(); } catch {}
      }

      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onResult(transcript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Gracefully ignore brief pauses while candidate is thinking
          return;
        }
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
