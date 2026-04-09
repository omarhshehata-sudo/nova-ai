import React from 'react';
import type { Message as MessageType } from '../types';
import { IconUser } from './Icons';
import '../styles/Message.css';

interface MessageProps {
  message: MessageType;
  userProfilePic?: string;
  showTimestamp?: boolean;
}

const NovaAvatar: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="nova-avatar-logo"
  >
    <defs>
      <radialGradient id="novaGlowAvatar" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
      </radialGradient>
      <linearGradient id="novaGradientAvatar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00d9ff" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <filter id="novaFilterAvatar">
        <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="12" cy="12" r="11" fill="url(#novaGlowAvatar)" />
    <circle cx="12" cy="12" r="10.5" stroke="url(#novaGradientAvatar)" strokeWidth="1.4" opacity="1" filter="url(#novaFilterAvatar)" />
    <path d="M 7 18 L 7 6 M 7 6 L 17 18 M 17 18 L 17 6" stroke="url(#novaGradientAvatar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#novaFilterAvatar)" />
    <circle cx="17" cy="5" r="1.3" fill="#00d9ff" filter="url(#novaFilterAvatar)" />
    <path d="M 17 3 L 17.3 4 L 18.3 4.3 L 17.3 4.6 L 17 5.6 L 16.7 4.6 L 15.7 4.3 L 16.7 4 Z" fill="#00d9ff" opacity="1" filter="url(#novaFilterAvatar)" />
  </svg>
);

export const Message: React.FC<MessageProps> = ({ message, userProfilePic, showTimestamp = false }) => {
  const isUser = message.role === 'user';

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message message-${message.role}`}>
      <div className="message-container">
        <div className="message-avatar">
          <div className="avatar-glow-ring" />
          <div className="avatar-inner">
            {isUser ? (
              userProfilePic ? (
                <img src={userProfilePic} alt="You" className="message-avatar-img" />
              ) : (
                <IconUser />
              )
            ) : (
              <NovaAvatar />
            )}
          </div>
        </div>
        <div className="message-bubble">
          <span className="message-role-label">
            {isUser ? 'You' : 'Nova'}
            {showTimestamp && <span className="message-timestamp">{formatTime(message.timestamp)}</span>}
          </span>
          <div className="message-text">{message.content}</div>
        </div>
      </div>
    </div>
  );
};
