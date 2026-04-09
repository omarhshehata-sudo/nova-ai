import React, { useState, useRef } from 'react';
import { IconPlus, IconSend, IconMic } from './Icons';
import '../styles/InputArea.css';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-area-chatgpt">
      <div className="input-dock-chatgpt">
        {/* Text Input */}
        <div className="input-field-wrapper-chatgpt">
          <button className="input-btn-chatgpt input-plus-chatgpt" aria-label="Add attachment">
            <IconPlus />
          </button>
          <textarea
            ref={textareaRef}
            className="input-field-chatgpt"
            placeholder="Message Nova AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <div className="input-actions">
            <button
              className="input-btn-chatgpt input-mic-chatgpt"
              aria-label="Voice input"
              disabled={isLoading}
            >
              <IconMic />
            </button>
            <button
              className={`input-btn-chatgpt input-send-chatgpt ${!input.trim() || isLoading ? 'disabled' : ''}`}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <IconSend />
            </button>
          </div>
        </div>
      </div>
      <p className="input-hint">Free research preview. Our AI makes mistakes sometimes. Please double-check important info.</p>
    </div>
  );
};
