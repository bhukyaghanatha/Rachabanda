/**
 * Speech synthesis & audio playback helper for Telugu Voice News
 */

class VoiceNewsService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(
    text: string,
    rate: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void
  ) {
    if (!this.synth) {
      if (onError) onError();
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Look for Telugu or Indian English voice
    const voices = this.synth.getVoices();
    const teluguVoice = voices.find(
      (v) => v.lang.includes('te') || v.name.toLowerCase().includes('telugu')
    );
    const indianVoice = voices.find(
      (v) => v.lang.includes('en-IN') || v.lang.includes('hi-IN')
    );

    if (teluguVoice) {
      utterance.voice = teluguVoice;
    } else if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onError) onError();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}

export const voiceNewsService = new VoiceNewsService();
