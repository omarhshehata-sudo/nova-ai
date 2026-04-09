import React, { useState, useRef, useEffect } from 'react';
import { IconPlus, IconSend, IconMic } from './Icons';
import '../styles/InputArea.css';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  return (
    <div className="input-area">
      <div className={`input-dock${focused ? ' input-dock--focused' : ''}`}>
        <button className="input-icon-btn input-icon-btn--subtle" aria-label="Add attachment">
          <IconPlus />
        </button>

        <textarea
          ref={textareaRef}
          className="input-field"
          placeholder="Ask Nova anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={isLoading}
          rows={1}
        />

        <div className="input-actions">
          <button
            className="input-icon-btn input-icon-btn--subtle"
            aria-label="Voice input"
            disabled={isLoading}
          >
            <IconMic />
          </button>
          <button
            className="input-icon-btn input-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <IconSend />
          </button>
        </div>
      </div>
      <p className="input-disclaimer">Nova can make mistakes. Consider checking important information.</p>
    </div>
  );
};
