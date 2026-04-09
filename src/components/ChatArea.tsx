import React, { useEffect, useRef } from 'react';
import type { Message as MessageType } from '../types';
import { Message } from './Message';
import '../styles/ChatArea.css';

interface ChatAreaProps {
  messages: MessageType[];
  isLoading: boolean;
  userProfilePic?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isLoading, userProfilePic }) => {
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
              <p className="hero-subtitle">Your ideas, powered instantly.</p>

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
              <Message key={msg.id} message={msg} userProfilePic={userProfilePic} />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="message message-assistant">
                <div className="message-container">
                  <div className="message-avatar">
                    <div className="avatar-glow-ring" />
                    <div className="avatar-inner">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="nova-avatar-logo">
                        <defs>
                          <radialGradient id="novaGlowLoading" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
                          </radialGradient>
                          <linearGradient id="novaGradientLoading" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00d9ff" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="11" fill="url(#novaGlowLoading)" />
                        <circle cx="12" cy="12" r="10.5" stroke="url(#novaGradientLoading)" strokeWidth="1.4" opacity="1" />
                        <path d="M 7 18 L 7 6 M 7 6 L 17 18 M 17 18 L 17 6" stroke="url(#novaGradientLoading)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="17" cy="5" r="1.3" fill="#00d9ff" />
                      </svg>
                    </div>
                  </div>
                  <div className="message-bubble">
                    <span className="message-role-label">Nova</span>
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
