import React, { useEffect, useRef } from 'react';
import type { Message as MessageType } from '../types';
import { Message } from './Message';
import '../styles/ChatArea.css';

interface ChatAreaProps {
  messages: MessageType[];
  isLoading: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestions = [
    { icon: '✏️', title: 'Create', desc: 'A detailed plan for learning' },
    { icon: '🔍', title: 'Analyze', desc: 'Pros and cons of remote work' },
    { icon: '📝', title: 'Write', desc: 'A poem about spring' },
    { icon: '💡', title: 'Brainstorm', desc: 'Ideas for a new product' },
  ];

  return (
    <div className="chat-area-chatgpt">
      {messages.length > 0 && (
        <div className="chat-header-chatgpt">
          <span className="chat-header-title">Nova AI</span>
        </div>
      )}
      <div className="chat-content-chatgpt">
        {messages.length === 0 ? (
          <>
            {/* Hero Section */}
            <div className="hero-section-chatgpt">
              <h1 className="hero-title">Nova AI</h1>
              <p className="hero-subtitle">Ask anything, get instant answers</p>

              {/* Suggestion Cards */}
              <div className="suggestions-grid-chatgpt">
                {suggestions.map((suggestion, index) => (
                  <button key={index} className="suggestion-card-chatgpt">
                    <span className="suggestion-icon">{suggestion.icon}</span>
                    <span className="suggestion-title">{suggestion.title}</span>
                    <span className="suggestion-desc">{suggestion.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="messages-container-chatgpt">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="message message-assistant">
                <div className="message-container">
                  <div className="message-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="2" y="2" width="20" height="20" rx="2" fill="#10A37F"/>
                      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="white"/>
                    </svg>
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
