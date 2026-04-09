import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconPlus, IconSend } from './Icons';
import '../styles/InputArea.css';

type DictationState = 'idle' | 'listening' | 'error';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onStopGenerating: () => void;
  isLoading: boolean;
  enterToSend?: boolean;
}

const SpeechRecognitionAPI =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onStopGenerating, isLoading, enterToSend = true }) => {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [dictation, setDictation] = useState<DictationState>('idle');
  const [dictationError, setDictationError] = useState<string | null>(null);
  const silenceTimeout = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const dictationBaseRef = useRef<string>('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '42px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (enterToSend) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    } else {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '42px';
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${next}px`;
  }, [input]);

  const stopDictation = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setDictation('idle');
    if (silenceTimeout.current) {
      clearTimeout(silenceTimeout.current);
      silenceTimeout.current = null;
    }
  }, []);

  const startDictation = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setDictation('error');
      setDictationError('Speech recognition is not supported in this browser.');
      setTimeout(() => { setDictation('idle'); setDictationError(null); }, 3000);
      return;
    }

    if (dictation === 'listening') {
      stopDictation();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    // Capture current input as the base text before dictation starts
    dictationBaseRef.current = input.endsWith(' ') || input === '' ? input : input + ' ';
    let finalTranscript = '';
    // (buffer removed)

    recognition.onstart = () => {
      setDictation('listening');
      setDictationError(null);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      // buffer is not used for preview
      // Reset silence timer
      if (silenceTimeout.current) clearTimeout(silenceTimeout.current);
      silenceTimeout.current = setTimeout(() => {
        setInput((dictationBaseRef.current + finalTranscript).replace(/  +/g, ' '));
        // (buffer removed)
      }, 4000);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setDictationError('Microphone access denied. Please allow microphone permission.');
      } else if (event.error === 'no-speech') {
        setDictationError('No speech detected. Try again.');
      } else {
        setDictationError('Dictation error. Please try again.');
      }
      setDictation('error');
      setTimeout(() => { setDictation('idle'); setDictationError(null); }, 3000);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setDictation('idle');
      recognitionRef.current = null;
      if (silenceTimeout.current) {
        clearTimeout(silenceTimeout.current);
        silenceTimeout.current = null;
      }
      // Only show error if there was a real error, not just on stop
    };

    recognition.start();
  }, [dictation, stopDictation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="input-area">
      <div className={`input-dock${focused ? ' input-dock--focused' : ''}${dictation === 'listening' ? ' input-dock--dictating' : ''}`}>
        <button className="input-icon-btn input-icon-btn--subtle" aria-label="Add attachment">
          <IconPlus />
        </button>

        <textarea
          ref={textareaRef}
          className="input-field"
          placeholder={dictation === 'listening' ? 'Listening…' : isLoading ? 'Generating…' : 'Ask Nova anything…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={1}
        />

        <div className="input-actions">
          <button
            className={`input-icon-btn ${dictation === 'listening' ? 'input-mic-btn--active' : 'input-icon-btn--subtle'}`}
            aria-label={dictation === 'listening' ? 'Stop dictation' : 'Voice input'}
            onClick={dictation === 'listening' ? stopDictation : startDictation}
            disabled={isLoading}
          >
            {dictation === 'listening' ? (
              <span className="sound-bars">
                <span className="bar bar1" />
                <span className="bar bar2" />
                <span className="bar bar3" />
                <span className="bar bar4" />
              </span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
          {isLoading ? (
            <button
              className="input-icon-btn input-stop-btn"
              onClick={onStopGenerating}
              aria-label="Stop generating"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <span className="stop-pulse-ring" />
            </button>
          ) : (
            <button
              className="input-icon-btn input-send-btn"
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <IconSend />
            </button>
          )}
        </div>
      </div>
      {dictationError && (
        <p className="input-dictation-error">{dictationError}</p>
      )}
      {/* Dictation buffer preview (optional, can remove if not wanted) */}
      {/* {dictation === 'listening' && dictationBuffer && (
        <div className="dictation-preview">{dictationBuffer}</div>
      )} */}
      <p className="input-disclaimer">Nova can make mistakes. Consider checking important information.</p>
    </div>
  );
};
