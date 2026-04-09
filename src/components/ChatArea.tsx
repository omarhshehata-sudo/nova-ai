import React, { useEffect, useRef } from 'react';
import type { Message as MessageType } from '../types';
import { Message } from './Message';
import '../styles/ChatArea.css';

interface ChatAreaProps {
  messages: MessageType[];
  isLoading: boolean;
  userProfilePic?: string;
  onSendMessage?: (message: string) => void;
}

/* ===== SVG ICONS FOR FEATURE CARDS ===== */
const IconCreate = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const IconAnalyze = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3" />
    <path d="M7 14l4-4 4 4 6-6" />
  </svg>
);
const IconWrite = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconBrainstorm = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 12 18.469c-.386-.866-.94-1.553-1.535-2.097L9.88 15.79z" />
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isLoading, userProfilePic, onSendMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const features = [
    { icon: <IconCreate />, title: 'Create', desc: 'Build plans, outlines & strategies', color: 'purple' },
    { icon: <IconAnalyze />, title: 'Analyze', desc: 'Break down ideas & compare options', color: 'cyan' },
    { icon: <IconWrite />, title: 'Write', desc: 'Draft content, stories & emails', color: 'blue' },
    { icon: <IconBrainstorm />, title: 'Brainstorm', desc: 'Generate fresh ideas & concepts', color: 'teal' },
  ];

  const quickPrompts = [
    'Explain quantum computing simply',
    'Write a professional email template',
    'Compare React vs Vue for a startup',
    'Create a 30-day fitness plan',
  ];

  const handlePromptClick = (prompt: string) => {
    onSendMessage?.(prompt);
  };

  return (
    <div className="chat-area-chatgpt">
      {messages.length > 0 && (
        <div className="chat-header-chatgpt">
          <span className="chat-header-title">Nova AI</span>
        </div>
      )}
      <div className="chat-content-chatgpt">
        {messages.length === 0 ? (
          <div className="hero-section-chatgpt">
            {/* Ambient glow orbs */}
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-orb hero-orb-3" />

            {/* Title block */}
            <div className="hero-title-block">
              <h1 className="hero-title">Nova AI</h1>
              <p className="hero-subtitle">Your ideas, powered instantly.</p>
            </div>

            {/* Feature cards */}
            <div className="suggestions-grid-chatgpt">
              {features.map((feature, index) => (
                <button
                  key={index}
                  className={`suggestion-card-chatgpt card-${feature.color}`}
                  style={{ animationDelay: `${200 + index * 80}ms` }}
                >
                  <div className="card-icon-wrap">
                    {feature.icon}
                  </div>
                  <div className="card-text">
                    <span className="suggestion-title">{feature.title}</span>
                    <span className="suggestion-desc">{feature.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick prompts */}
            <div className="quick-prompts">
              <span className="quick-prompts-label">Try asking</span>
              <div className="quick-prompts-list">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="quick-prompt-chip"
                    style={{ animationDelay: `${500 + index * 60}ms` }}
                    onClick={() => handlePromptClick(prompt)}
                  >
                    <span>{prompt}</span>
                    <IconArrow />
                  </button>
                ))}
              </div>
            </div>
          </div>
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
