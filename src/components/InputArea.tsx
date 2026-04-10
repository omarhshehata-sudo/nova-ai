import React, { useState, useRef, useEffect } from 'react';
import { IconPlus, IconSend } from './Icons';
import '../styles/InputArea.css';
import { DictationController } from '../utils/DictationController';
import type { DictationState } from '../utils/DictationController';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onStopGenerating: () => void;
  isLoading: boolean;
  enterToSend?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onStopGenerating, isLoading, enterToSend = true }) => {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [dictationState, setDictationState] = useState<DictationState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [dictationError, setDictationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dictationRef = useRef<DictationController | null>(null);

  // When user sends, use transcript if dictation was active, else use input
  const handleSend = () => {
    const value = dictationState === 'listening' || dictationState === 'processing' ? transcript : input;
    if (value.trim() && !isLoading) {
      onSendMessage(value);
      setInput('');
      setTranscript('');
      setInterimTranscript('');
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
  }, [input, transcript, interimTranscript]);

  // Dictation controller setup
  useEffect(() => {
    dictationRef.current = new DictationController({
      onTranscript: (final, interim) => {
        setTranscript(final);
        setInterimTranscript(interim);
      },
      onStateChange: (state) => {
        setDictationState(state);
        if (state === 'idle') setInterimTranscript('');
      },
      onError: (err) => {
        setDictationError(err);
      },
    });
    return () => {
      dictationRef.current?.cancel();
    };
  }, []);

  // Start/stop/cancel dictation handlers
  const handleMicClick = () => {
    if (!dictationRef.current) return;
    if (dictationState === 'listening') {
      dictationRef.current.stop();
    } else {
      setTranscript(input); // Use current input as base
      dictationRef.current.start();
    }
  };

  const handleCancelDictation = () => {
    dictationRef.current?.cancel();
    setTranscript('');
    setInterimTranscript('');
    setInput('');
    setDictationError(null);
  };



  return (
    <div className="input-area">
      <div className={`input-dock${focused ? ' input-dock--focused' : ''}${dictationState === 'listening' ? ' input-dock--dictating' : ''}`}>
        <button className="input-icon-btn input-icon-btn--subtle" aria-label="Add attachment">
          <IconPlus />
        </button>

        <textarea
          ref={textareaRef}
          className="input-field"
          placeholder={
            dictationState === 'listening'
              ? 'Listening…'
              : dictationState === 'processing'
              ? 'Processing…'
              : isLoading
              ? 'Generating…'
              : 'Ask Nova anything…'
          }
          value={dictationState === 'listening' || dictationState === 'processing' ? transcript + interimTranscript : input}
          onChange={(e) => {
            setInput(e.target.value);
            if (dictationState !== 'idle') setTranscript(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={1}
        />

        <div className="input-actions">
          <button
            className={`input-icon-btn ${dictationState === 'listening' ? 'input-mic-btn--active' : 'input-icon-btn--subtle'}`}
            aria-label={dictationState === 'listening' ? 'Stop dictation' : 'Voice input'}
            onClick={handleMicClick}
            disabled={isLoading}
          >
            {dictationState === 'listening' ? (
              <span className="sound-bars">
                <span className="bar bar1" />
                <span className="bar bar2" />
                <span className="bar bar3" />
                <span className="bar bar4" />
              </span>
            ) : dictationState === 'processing' ? (
              <span className="input-mic-processing" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
          {dictationState === 'listening' && (
            <button
              className="input-icon-btn input-cancel-btn"
              aria-label="Cancel dictation"
              onClick={handleCancelDictation}
              type="button"
            >
              Cancel
            </button>
          )}
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
              disabled={!(dictationState === 'listening' || dictationState === 'processing' ? transcript.trim() : input.trim())}
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
