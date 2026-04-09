import React from 'react';
import type { UserProfile } from '../types';
import '../styles/Sidebar.css';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onAuthClick?: () => void;
  userProfile?: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onSectionChange,
  onAuthClick,
  userProfile,
}) => {
  const handleLogout = () => {
    localStorage.removeItem('githubAuth');
    localStorage.removeItem('userProfile');
    window.location.reload();
  };
  return (
    <div className="sidebar-chatgpt">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="nova-logo"
          >
            <defs>
              <radialGradient id="novaGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="novaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d9ff" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <filter id="novaFilter">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Glow circle */}
            <circle cx="12" cy="12" r="11" fill="url(#novaGlow)" />
            
            {/* Outer circle border with glow */}
            <circle cx="12" cy="12" r="10.5" stroke="url(#novaGradient)" strokeWidth="1.2" opacity="0.8" filter="url(#novaFilter)" />
            
            {/* Stylized N shape */}
            <path d="M 7 18 L 7 6 M 7 6 L 17 18 M 17 18 L 17 6" stroke="url(#novaGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#novaFilter)" />
            
            {/* Sparkle/star element */}
            <circle cx="17" cy="5" r="1.2" fill="#00d9ff" filter="url(#novaFilter)" />
            <path d="M 17 3 L 17.3 4 L 18.3 4.3 L 17.3 4.6 L 17 5.6 L 16.7 4.6 L 15.7 4.3 L 16.7 4 Z" fill="#00d9ff" opacity="0.9" filter="url(#novaFilter)" />
          </svg>
        </div>
      </div>





      <div className="sidebar-bottom">
        <button
          className="sidebar-nav-item"
          onClick={() => onSectionChange('settings')}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d9ff" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <g fill="url(#gearGradient)">
              {/* Center circle */}
              <circle cx="12" cy="12" r="3.2" />
              {/* Gear teeth - top */}
              <rect x="10" y="1" width="4" height="3" rx="1" />
              {/* Gear teeth - top-right */}
              <rect x="17.5" y="3.5" width="3" height="4" rx="1" transform="rotate(45 19 5.5)" />
              {/* Gear teeth - right */}
              <rect x="20" y="10" width="3" height="4" rx="1" />
              {/* Gear teeth - bottom-right */}
              <rect x="17.5" y="16.5" width="3" height="4" rx="1" transform="rotate(45 19 18.5)" />
              {/* Gear teeth - bottom */}
              <rect x="10" y="20" width="4" height="3" rx="1" />
              {/* Gear teeth - bottom-left */}
              <rect x="3.5" y="16.5" width="3" height="4" rx="1" transform="rotate(45 5 18.5)" />
              {/* Gear teeth - left */}
              <rect x="1" y="10" width="3" height="4" rx="1" />
              {/* Gear teeth - top-left */}
              <rect x="3.5" y="3.5" width="3" height="4" rx="1" transform="rotate(45 5 5.5)" />
            </g>
          </svg>
          <span>Settings</span>
        </button>

        {userProfile ? (
          <div className="user-profile-section">
            <img src={userProfile.profilePic} alt={userProfile.username} className="user-profile-pic" />
            <div className="user-profile-info">
              <p className="user-profile-name">{userProfile.username}</p>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <button
            className="sidebar-auth-btn-chatgpt"
            onClick={onAuthClick}
            title="Login or Signup"
          >
            <span>Login or Signup</span>
          </button>
        )}
      </div>
    </div>
  );
};
