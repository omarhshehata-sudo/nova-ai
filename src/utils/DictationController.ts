// DictationController.ts
// Production-quality speech-to-text controller for React apps

export type DictationState = 'idle' | 'listening' | 'processing' | 'error';

export interface DictationCallbacks {
  onTranscript: (finalTranscript: string, interimTranscript: string) => void;
  onStateChange: (state: DictationState) => void;
  onError: (error: string) => void;
}

export class DictationController {
  private recognition: any = null;
  private isListening = false;
  private transcript = '';
  private interimTranscript = '';
  private state: DictationState = 'idle';
  private silenceTimeout: number | null = null;
  private readonly silenceMs: number;
  private readonly lang: string;
  private readonly callbacks: DictationCallbacks;

  constructor(callbacks: DictationCallbacks, lang = 'en-US', silenceMs = 4000) {
    this.callbacks = callbacks;
    this.lang = lang;
    this.silenceMs = silenceMs;
    this.init();
  }

  private init() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.state = 'error';
      this.callbacks.onError('Speech recognition is not supported in this browser.');
      this.callbacks.onStateChange(this.state);
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;
    this.recognition.onresult = this.handleResult;
    this.recognition.onend = this.handleEnd;
    this.recognition.onerror = this.handleError;
  }

  private handleResult = (event: SpeechRecognitionEvent) => {
    let finalText = '';
    let interimText = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += text;
      } else {
        interimText += text;
      }
    }
    if (finalText) {
      this.transcript += finalText;
    }
    this.interimTranscript = interimText;
    this.callbacks.onTranscript(this.transcript, this.interimTranscript);
    // Reset silence timer
    if (this.silenceTimeout) window.clearTimeout(this.silenceTimeout);
    this.silenceTimeout = window.setTimeout(() => {
      this.stop();
    }, this.silenceMs);
  };

  private handleEnd = () => {
    this.isListening = false;
    this.state = 'idle';
    this.interimTranscript = '';
    this.callbacks.onTranscript(this.transcript, '');
    this.callbacks.onStateChange(this.state);
    if (this.silenceTimeout) {
      window.clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  };

  private handleError = (event: any) => {
    let message = 'Dictation error. Please try again.';
    if (event.error === 'not-allowed') {
      message = 'Microphone access is required for dictation.';
    } else if (event.error === 'no-speech') {
      message = 'No speech detected. Try again.';
    } else if (event.error === 'aborted') {
      // User stopped, not an error
      this.handleEnd();
      return;
    }
    this.state = 'error';
    this.isListening = false;
    this.callbacks.onError(message);
    this.callbacks.onStateChange(this.state);
    if (this.silenceTimeout) {
      window.clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  };

  public start() {
    if (!this.recognition || this.isListening) return;
    this.transcript = '';
    this.interimTranscript = '';
    this.state = 'listening';
    this.isListening = true;
    this.callbacks.onTranscript('', '');
    this.callbacks.onStateChange(this.state);
    try {
      this.recognition.start();
    } catch (e) {
      // Prevent double start error
    }
  }

  public stop() {
    if (!this.recognition || !this.isListening) return;
    this.state = 'processing';
    this.callbacks.onStateChange(this.state);
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch (e) {}
    if (this.silenceTimeout) {
      window.clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  public cancel() {
    if (!this.recognition) return;
    this.isListening = false;
    this.state = 'idle';
    this.transcript = '';
    this.interimTranscript = '';
    this.callbacks.onTranscript('', '');
    this.callbacks.onStateChange(this.state);
    try {
      this.recognition.abort();
    } catch (e) {}
    if (this.silenceTimeout) {
      window.clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  public isActive() {
    return this.isListening;
  }

  public getTranscript() {
    return this.transcript;
  }

  public getInterim() {
    return this.interimTranscript;
  }

  public getState() {
    return this.state;
  }
}
