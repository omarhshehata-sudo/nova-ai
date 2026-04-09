import { useState, useCallback } from 'react';
import type { UserProfile } from '../types';
import '../styles/Settings.css';

interface SettingsProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
  onClearChats: () => void;
  onBack: () => void;
}

type SettingsSection = 'general' | 'chat' | 'privacy' | 'account';

interface SettingsState {
  theme: 'dark' | 'light';
  fontSize: number;
  uiDensity: 'compact' | 'comfortable' | 'spacious';
  enterToSend: boolean;
  showTimestamps: boolean;
  autoScroll: boolean;
  saveChatHistory: boolean;
  allowDataUsage: boolean;
}

const defaultSettings: SettingsState = {
  theme: 'dark',
  fontSize: 16,
  uiDensity: 'comfortable',
  enterToSend: true,
  showTimestamps: false,
  autoScroll: true,
  saveChatHistory: true,
  allowDataUsage: false,
};

function loadSettings(): SettingsState {
  try {
    const saved = localStorage.getItem('novaSettings');
    if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...defaultSettings };
}

function saveSettings(settings: SettingsState) {
  localStorage.setItem('novaSettings', JSON.stringify(settings));
}

/* ===== SVG Icons ===== */
const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <GearIcon /> },
  { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
  { id: 'privacy', label: 'Privacy', icon: <ShieldIcon /> },
  { id: 'account', label: 'Account', icon: <UserIcon /> },
];

/* ===== Toggle Component ===== */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`settings-toggle ${checked ? 'settings-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="settings-toggle__thumb" />
    </button>
  );
}

export function Settings({ userProfile, onLogout, onClearChats, onBack }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsSection>('general');
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [confirmClearChats, setConfirmClearChats] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const handleClearChats = useCallback(() => {
    if (!confirmClearChats) {
      setConfirmClearChats(true);
      setTimeout(() => setConfirmClearChats(false), 3000);
      return;
    }
    onClearChats();
    setConfirmClearChats(false);
  }, [confirmClearChats, onClearChats]);

  const handleClearAllData = useCallback(() => {
    if (!confirmClearData) {
      setConfirmClearData(true);
      setTimeout(() => setConfirmClearData(false), 3000);
      return;
    }
    onClearChats();
    onLogout();
    setConfirmClearData(false);
  }, [confirmClearData, onClearChats, onLogout]);

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>
          <ArrowLeftIcon />
          <span>Back</span>
        </button>
        <h1 className="settings-title">Settings</h1>
        <button className={`settings-save-btn ${saved ? 'settings-save-btn--saved' : ''}`} onClick={handleSave}>
          {saved ? <><CheckIcon /> Saved</> : 'Save Changes'}
        </button>
      </div>

      <div className="settings-body">
        {/* Left Nav */}
        <nav className="settings-nav">
          {sections.map(s => (
            <button
              key={s.id}
              className={`settings-nav-item ${activeTab === s.id ? 'settings-nav-item--active' : ''}`}
              onClick={() => setActiveTab(s.id)}
            >
              <span className="settings-nav-icon">{s.icon}</span>
              <span className="settings-nav-label">{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Panel */}
        <div className="settings-panel">
          {activeTab === 'general' && (
            <div className="settings-section" key="general">
              <h2 className="settings-section-title">General</h2>
              <p className="settings-section-desc">Customize the look and feel of Nova AI.</p>

              <div className="settings-group">
                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Theme</span>
                    <span className="settings-row-hint">Choose your preferred color scheme</span>
                  </div>
                  <select
                    className="settings-select"
                    value={settings.theme}
                    onChange={e => updateSetting('theme', e.target.value as 'dark' | 'light')}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light (coming soon)</option>
                  </select>
                </div>

                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Font Size</span>
                    <span className="settings-row-hint">{settings.fontSize}px</span>
                  </div>
                  <div className="settings-slider-wrap">
                    <span className="settings-slider-label">12</span>
                    <input
                      type="range"
                      className="settings-slider"
                      min={12}
                      max={22}
                      step={1}
                      value={settings.fontSize}
                      onChange={e => updateSetting('fontSize', Number(e.target.value))}
                    />
                    <span className="settings-slider-label">22</span>
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">UI Density</span>
                    <span className="settings-row-hint">Adjust spacing and layout density</span>
                  </div>
                  <select
                    className="settings-select"
                    value={settings.uiDensity}
                    onChange={e => updateSetting('uiDensity', e.target.value as SettingsState['uiDensity'])}
                  >
                    <option value="compact">Compact</option>
                    <option value="comfortable">Comfortable</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="settings-section" key="chat">
              <h2 className="settings-section-title">Chat</h2>
              <p className="settings-section-desc">Configure how the chat experience works.</p>

              <div className="settings-group">
                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Enter to Send</span>
                    <span className="settings-row-hint">Press Enter to send messages instead of adding a new line</span>
                  </div>
                  <Toggle checked={settings.enterToSend} onChange={v => updateSetting('enterToSend', v)} />
                </div>

                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Show Timestamps</span>
                    <span className="settings-row-hint">Display time next to each message</span>
                  </div>
                  <Toggle checked={settings.showTimestamps} onChange={v => updateSetting('showTimestamps', v)} />
                </div>

                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Auto-Scroll</span>
                    <span className="settings-row-hint">Automatically scroll to the latest message</span>
                  </div>
                  <Toggle checked={settings.autoScroll} onChange={v => updateSetting('autoScroll', v)} />
                </div>
              </div>

              <div className="settings-group settings-group--danger">
                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Clear All Chats</span>
                    <span className="settings-row-hint">Permanently delete all conversations</span>
                  </div>
                  <button
                    className={`settings-danger-btn ${confirmClearChats ? 'settings-danger-btn--confirm' : ''}`}
                    onClick={handleClearChats}
                  >
                    <TrashIcon />
                    {confirmClearChats ? 'Confirm Delete' : 'Clear Chats'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section" key="privacy">
              <h2 className="settings-section-title">Privacy</h2>
              <p className="settings-section-desc">Manage your data and privacy preferences.</p>

              <div className="settings-group">
                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Save Chat History</span>
                    <span className="settings-row-hint">Store conversations locally on this device</span>
                  </div>
                  <Toggle checked={settings.saveChatHistory} onChange={v => updateSetting('saveChatHistory', v)} />
                </div>

                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Allow Data Usage</span>
                    <span className="settings-row-hint">Help improve Nova AI by sharing anonymized usage data</span>
                  </div>
                  <Toggle checked={settings.allowDataUsage} onChange={v => updateSetting('allowDataUsage', v)} />
                </div>
              </div>

              <div className="settings-group settings-group--danger">
                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Clear All Data</span>
                    <span className="settings-row-hint">Delete all chats, settings, and log out</span>
                  </div>
                  <button
                    className={`settings-danger-btn ${confirmClearData ? 'settings-danger-btn--confirm' : ''}`}
                    onClick={handleClearAllData}
                  >
                    <TrashIcon />
                    {confirmClearData ? 'Confirm Delete All' : 'Clear All Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section" key="account">
              <h2 className="settings-section-title">Account</h2>
              <p className="settings-section-desc">Manage your profile and subscription.</p>

              {userProfile ? (
                <>
                  <div className="settings-account-card">
                    <div className="settings-account-avatar">
                      {userProfile.profilePic ? (
                        <img src={userProfile.profilePic} alt={userProfile.username} />
                      ) : (
                        <div className="settings-account-avatar-placeholder">
                          {userProfile.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="settings-account-info">
                      <span className="settings-account-name">{userProfile.username}</span>
                      {userProfile.email && (
                        <span className="settings-account-email">{userProfile.email}</span>
                      )}
                      {userProfile.githubUsername && (
                        <span className="settings-account-github">@{userProfile.githubUsername}</span>
                      )}
                    </div>
                    <div className="settings-account-badge">Free Plan</div>
                  </div>

                  <div className="settings-group">
                    <div className="settings-row">
                      <div className="settings-row-info">
                        <span className="settings-row-label">Log Out</span>
                        <span className="settings-row-hint">Sign out of your account on this device</span>
                      </div>
                      <button className="settings-logout-btn" onClick={onLogout}>
                        <LogOutIcon />
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="settings-account-empty">
                  <UserIcon />
                  <p>You&apos;re not signed in.</p>
                  <span>Sign in to sync your settings and chat history.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
