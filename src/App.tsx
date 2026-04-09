import { useState, useCallback, useRef, useEffect } from 'react';
import type { Chat, UserProfile, GitHubAuth, Memory } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { ChatHistory } from './components/ChatHistory';
import { AuthModal } from './components/AuthModal';
import { ProfileSetup } from './components/ProfileSetup';
import { Settings, loadSettings, defaultSettings } from './components/Settings';
import type { SettingsState } from './components/Settings';
import { ResetPassword } from './components/ResetPassword';
import { MemoryPage } from './components/MemoryPage';
import { createNewChat, createMessage, generateChatTitle, simulateStreamingResponse, extractMemories } from './utils';
import { supabase } from './supabaseClient';
import './styles/globals.css';
import './styles/App.css';

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);
  const [githubAuth, setGithubAuth] = useState<GitHubAuth | null>(null);
  const [appSettings, setAppSettings] = useState<SettingsState>(loadSettings);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [crossTabReload, setCrossTabReload] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const streamingResponseRef = useRef<string>('');
  const abortStreamRef = useRef<(() => void) | null>(null);

  // Apply theme, font size, and UI density to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appSettings.theme);
  }, [appSettings.theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', `${appSettings.fontSize}px`);
  }, [appSettings.fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', appSettings.uiDensity);
  }, [appSettings.uiDensity]);

  // Load saved chats when user logs in, clear when logged out
  useEffect(() => {
    if (userProfile) {
      const key = userProfile.githubId || userProfile.email || userProfile.username || 'unknown';
      try {
        const saved = localStorage.getItem(`chats_${key}`);
        if (saved) {
          setChats(JSON.parse(saved));
          setActiveChat(localStorage.getItem(`activeChat_${key}`) || null);
        } else {
          setChats([]);
          setActiveChat(null);
        }
      } catch {
        setChats([]);
        setActiveChat(null);
      }
    } else {
      setChats([]);
      setActiveChat(null);
    }
  }, [userProfile]);

  // Save chats to localStorage whenever they change (only if logged in and save history is on)
  useEffect(() => {
    if (userProfile && appSettings.saveChatHistory) {
      const key = userProfile.githubId || userProfile.email || userProfile.username || 'unknown';
      localStorage.setItem(`chats_${key}`, JSON.stringify(chats));
    }
  }, [chats, userProfile, appSettings.saveChatHistory]);

  // Save active chat to localStorage (only if logged in)
  useEffect(() => {
    if (!userProfile) return;
    const key = userProfile.githubId || userProfile.email || userProfile.username || 'unknown';
    if (activeChat) {
      localStorage.setItem(`activeChat_${key}`, activeChat);
    } else {
      localStorage.removeItem(`activeChat_${key}`);
    }
  }, [activeChat, userProfile]);

  // Load memories when user profile changes
  useEffect(() => {
    if (userProfile) {
      const key = userProfile.githubId || userProfile.email || userProfile.username || 'unknown';
      try {
        const saved = localStorage.getItem(`memories_${key}`);
        if (saved) setMemories(JSON.parse(saved));
        else setMemories([]);
        const memEnabled = localStorage.getItem(`memoryEnabled_${key}`);
        setMemoryEnabled(memEnabled !== 'false');
      } catch {
        setMemories([]);
      }
    } else {
      setMemories([]);
    }
  }, [userProfile]);

  // Save memories whenever they change
  useEffect(() => {
    if (userProfile) {
      const key = userProfile.githubId || userProfile.email || userProfile.username || 'unknown';
      localStorage.setItem(`memories_${key}`, JSON.stringify(memories));
    }
  }, [memories, userProfile]);

  // Check for existing profile on mount
  useEffect(() => {
    // Clean up old shared keys from before per-user storage
    localStorage.removeItem('chats');
    localStorage.removeItem('activeChat');

    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (err) {
        console.error('Failed to parse saved profile:', err);
      }
    }
  }, []);

  // Cross-tab auth sync: detect account changes in other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'userProfile') {
        const currentProfile = userProfile ? JSON.stringify({ email: userProfile.email, username: userProfile.username }) : null;
        const newProfile = e.newValue ? (() => { try { const p = JSON.parse(e.newValue!); return JSON.stringify({ email: p.email, username: p.username }); } catch { return null; } })() : null;
        if (currentProfile !== newProfile) {
          setCrossTabReload(true);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [userProfile]);

  // Check for GitHub auth - runs on mount and when auth modal closes
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedAuth = localStorage.getItem('githubAuth');
      const savedProfile = localStorage.getItem('userProfile');
      
      console.log('Checking auth state:', { savedAuth: !!savedAuth, savedProfile: !!savedProfile });
      
      if (savedAuth && !savedProfile) {
        try {
          const auth = JSON.parse(savedAuth);
          
          // Check for a previously saved profile by user ID
          const previousProfile = localStorage.getItem(`userProfile_github_${auth.user.id}`);
          if (previousProfile) {
            const profile = JSON.parse(previousProfile) as UserProfile;
            localStorage.setItem('userProfile', JSON.stringify(profile));
            setUserProfile(profile);
            return;
          }
          
          console.log('Setting GitHub auth and opening profile setup');
          setGithubAuth(auth);
          setIsProfileSetupOpen(true);
          setIsAuthModalOpen(false);
        } catch (err) {
          console.error('Failed to parse auth data:', err);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Listen for Supabase auth state changes (Google OAuth, email login)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      // Handle password recovery redirect
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        setShowResetPassword(true);
        return;
      }

      // Only process events that have a valid session
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        // If already have a profile loaded, don't override
        const existingProfile = localStorage.getItem('userProfile');
        if (existingProfile) {
          try {
            // Backfill email on old profiles that are missing it
            const profile = JSON.parse(existingProfile) as UserProfile;
            const email = session.user.email;
            if (email && !profile.email) {
              profile.email = email;
              // Remove fake githubId "0" from old Supabase profiles
              if (profile.githubId === '0') {
                delete profile.githubId;
                delete profile.githubUsername;
              }
              localStorage.setItem('userProfile', JSON.stringify(profile));
              localStorage.setItem(`userProfile_email_${email}`, JSON.stringify(profile));
              setUserProfile(profile);
            }
          } catch { /* ignore */ }
          return;
        }

        // Check for previously saved profile by email
        const email = session.user.email;
        if (email) {
          const previousProfile = localStorage.getItem(`userProfile_email_${email}`);
          if (previousProfile) {
            const profile = JSON.parse(previousProfile) as UserProfile;
            // Ensure email is on the profile
            if (!profile.email) {
              profile.email = email;
            }
            // Remove fake githubId "0" from old Supabase profiles
            if (profile.githubId === '0') {
              delete profile.githubId;
              delete profile.githubUsername;
            }
            localStorage.setItem('userProfile', JSON.stringify(profile));
            localStorage.setItem(`userProfile_email_${email}`, JSON.stringify(profile));
            setUserProfile(profile);
            return;
          }
        }

        // No profile yet - open profile setup
        const displayName = session.user.user_metadata?.full_name || session.user.email || 'User';
        setGithubAuth({ token: '', user: { login: displayName, avatar_url: '', id: 0 } });
        setIsAuthModalOpen(false);
        setIsProfileSetupOpen(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const currentChat = chats.find((c) => c.id === activeChat);

  const handleSendMessage = useCallback(
    (userMessage: string) => {
      if (!userMessage.trim()) return;

      let chatId = activeChat;

      if (!chatId) {
        const newChat = createNewChat();
        const updatedChats = [newChat, ...chats];
        setChats(updatedChats);
        chatId = newChat.id;
        setActiveChat(chatId);
      }

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === chatId) {
            const userMsg = createMessage('user', userMessage);
            return {
              ...chat,
              messages: [...chat.messages, userMsg],
              updatedAt: Date.now(),
              title:
                chat.messages.length === 0
                  ? generateChatTitle(userMessage)
                  : chat.title,
            };
          }
          return chat;
        })
      );

      setIsLoading(true);
      streamingResponseRef.current = '';

      // Extract memories from user message if memory is enabled
      if (memoryEnabled) {
        const newMemories = extractMemories(userMessage, memories);
        if (newMemories.length > 0) {
          setMemories(prev => [...prev, ...newMemories]);
        }
      }

      const abort = simulateStreamingResponse(
        userMessage,
        (chunk) => {
          streamingResponseRef.current += chunk;
          setChats((prev) =>
            prev.map((chat) => {
              if (chat.id === chatId) {
                const messages = [...chat.messages];
                const lastMsg = messages[messages.length - 1];

                if (lastMsg && lastMsg.role === 'assistant') {
                  lastMsg.content = streamingResponseRef.current;
                } else {
                  messages.push(
                    createMessage('assistant', streamingResponseRef.current)
                  );
                }

                return {
                  ...chat,
                  messages,
                  updatedAt: Date.now(),
                };
              }
              return chat;
            })
          );
        },
        () => {
          setIsLoading(false);
          streamingResponseRef.current = '';
          abortStreamRef.current = null;
        }
      );
      abortStreamRef.current = abort;
    },
    [activeChat, chats, memoryEnabled, memories]
  );

  const handleStopGenerating = useCallback(() => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
    }
    setIsLoading(false);
    streamingResponseRef.current = '';
  }, []);

  const handleNewChat = useCallback(() => {
    const newChat = createNewChat();
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setActiveSection('chat');
  }, []);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChat(chatId);
    setActiveSection('chat');
  }, []);

  const handleDeleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat(null);
    }
  }, [activeChat]);

  const handleRenameChat = useCallback((chatId: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
    );
  }, []);

  const handlePinChat = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c))
    );
  }, []);

  const handleArchiveChat = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, archived: !c.archived } : c))
    );
    if (activeChat === chatId) {
      setActiveChat(null);
    }
  }, [activeChat]);

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  const handleDeleteMemory = useCallback((id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleClearAllMemories = useCallback(() => {
    setMemories([]);
  }, []);

  const handleToggleMemory = useCallback((enabled: boolean) => {
    setMemoryEnabled(enabled);
    if (userProfile) {
      const key = userProfile.githubId || userProfile.email || userProfile.username || 'unknown';
      localStorage.setItem(`memoryEnabled_${key}`, String(enabled));
    }
  }, [userProfile]);

  const handleAuthClick = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const handleAuthSuccess = useCallback(async () => {
    // Check current session profile
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (err) {
        console.error('Failed to parse saved profile:', err);
      }
      return;
    }

    // Check for GitHub auth first
    const savedAuth = localStorage.getItem('githubAuth');
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth) as GitHubAuth;
        setGithubAuth(auth);

        const previousProfile = localStorage.getItem(`userProfile_github_${auth.user.id}`);
        if (previousProfile) {
          const profile = JSON.parse(previousProfile) as UserProfile;
          localStorage.setItem('userProfile', JSON.stringify(profile));
          setUserProfile(profile);
          return;
        }
      } catch (err) {
        console.error('Failed to parse auth data:', err);
      }
      setIsProfileSetupOpen(true);
      return;
    }

    // Check for Supabase email auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const previousProfile = localStorage.getItem(`userProfile_email_${user.email}`);
      if (previousProfile) {
        const profile = JSON.parse(previousProfile) as UserProfile;
        localStorage.setItem('userProfile', JSON.stringify(profile));
        setUserProfile(profile);
        return;
      }
      // No profile yet — set dummy githubAuth so ProfileSetup works
      setGithubAuth({ token: '', user: { login: user.email, avatar_url: '', id: 0 } });
    } else {
      setGithubAuth({ token: '', user: { login: 'User', avatar_url: '', id: 0 } });
    }

    setIsProfileSetupOpen(true);
  }, []);

  const handleProfileSetupComplete = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setIsProfileSetupOpen(false);
  }, []);


  return (
    <div className="app-container">
      {crossTabReload && (
        <div className="cross-tab-banner">
          <span>Your account changed in another tab.</span>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <ProfileSetup
        isOpen={isProfileSetupOpen}
        githubAuth={githubAuth}
        onComplete={handleProfileSetupComplete}
      />
      {showResetPassword && (
        <ResetPassword onComplete={() => setShowResetPassword(false)} />
      )}

      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onAuthClick={handleAuthClick}
        userProfile={userProfile}
      />

      {activeSection === 'chat' ? (
        <>
          <ChatHistory
            chats={chats}
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            onPinChat={handlePinChat}
            onArchiveChat={handleArchiveChat}
            onNewChat={handleNewChat}
          />
          <div className="chat-container">
            <ChatArea
              messages={currentChat?.messages || []}
              isLoading={isLoading}
              userProfilePic={userProfile?.profilePic}
              onSendMessage={handleSendMessage}
              autoScroll={appSettings.autoScroll}
              showTimestamps={appSettings.showTimestamps}
            />
            <InputArea
              onSendMessage={handleSendMessage}
              onStopGenerating={handleStopGenerating}
              isLoading={isLoading}
              enterToSend={appSettings.enterToSend}
            />
          </div>
        </>
      ) : activeSection === 'settings' ? (
        <Settings
          userProfile={userProfile}
          settings={appSettings}
          onSettingsChange={setAppSettings}
          onLogout={async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('githubAuth');
            localStorage.removeItem('userProfile');
            setUserProfile(null);
            setGithubAuth(null);
            setActiveSection('chat');
          }}
          onClearChats={() => {
            setChats([]);
            setActiveChat(null);
          }}
          onClearAllData={async () => {
            const key = userProfile?.githubId || userProfile?.email || userProfile?.username || 'unknown';
            // Clear all per-user data
            localStorage.removeItem(`chats_${key}`);
            localStorage.removeItem(`activeChat_${key}`);
            localStorage.removeItem(`memories_${key}`);
            localStorage.removeItem(`memoryEnabled_${key}`);
            if (userProfile?.githubId) localStorage.removeItem(`userProfile_github_${userProfile.githubId}`);
            if (userProfile?.email) localStorage.removeItem(`userProfile_email_${userProfile.email}`);
            // Clear shared keys
            localStorage.removeItem('githubAuth');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('novaSettings');
            // Reset all React state
            setChats([]);
            setActiveChat(null);
            setMemories([]);
            setMemoryEnabled(true);
            setAppSettings(defaultSettings);
            setUserProfile(null);
            setGithubAuth(null);
            // Sign out from Supabase
            await supabase.auth.signOut();
            setActiveSection('chat');
          }}
          onBack={() => handleSectionChange('chat')}
          onProfileUpdate={setUserProfile}
        />
      ) : activeSection === 'memory' ? (
        <MemoryPage
          memories={memories}
          memoryEnabled={memoryEnabled}
          onToggleMemory={handleToggleMemory}
          onDeleteMemory={handleDeleteMemory}
          onClearAllMemories={handleClearAllMemories}
          onBack={() => handleSectionChange('chat')}
        />
      ) : (
        <div className="section-container">
          <div style={{ textAlign: 'center' }}>
            <p>
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} section coming soon...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
