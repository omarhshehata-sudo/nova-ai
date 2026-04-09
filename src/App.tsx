import { useState, useCallback, useRef, useEffect } from 'react';
import type { Chat, UserProfile, GitHubAuth } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { ChatHistory } from './components/ChatHistory';
import { AuthModal } from './components/AuthModal';
import { ProfileSetup } from './components/ProfileSetup';
import { createNewChat, createMessage, generateChatTitle, simulateStreamingResponse } from './utils';
import { supabase } from './supabaseClient';
import './styles/globals.css';
import './styles/App.css';

function App() {
  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      const saved = localStorage.getItem('chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeChat, setActiveChat] = useState<string | null>(() => {
    return localStorage.getItem('activeChat') || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);
  const [githubAuth, setGithubAuth] = useState<GitHubAuth | null>(null);
  const streamingResponseRef = useRef<string>('');

  // Save chats to localStorage whenever they change (only if logged in)
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats, userProfile]);

  // Save active chat to localStorage (only if logged in)
  useEffect(() => {
    if (!userProfile) return;
    if (activeChat) {
      localStorage.setItem('activeChat', activeChat);
    } else {
      localStorage.removeItem('activeChat');
    }
  }, [activeChat, userProfile]);

  // Check for existing profile on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (err) {
        console.error('Failed to parse saved profile:', err);
      }
    }
  }, []);

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

      simulateStreamingResponse(
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
        }
      );
    },
    [activeChat, chats]
  );

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

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

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
      {/* Temp logout button for testing - remove later */}
      {userProfile && (
        <button
          onClick={() => {
            localStorage.removeItem('githubAuth');
            localStorage.removeItem('userProfile');
            setUserProfile(null);
            setGithubAuth(null);
          }}
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            zIndex: 9999,
            padding: '6px 12px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Logout (temp)
        </button>
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
            onNewChat={handleNewChat}
          />
          <div className="chat-container">
            <ChatArea
              messages={currentChat?.messages || []}
              isLoading={isLoading}
            />
            <InputArea
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </>
      ) : (
        <div className="section-container">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>
              {activeSection === 'search' && '🔍'}
              {activeSection === 'memory' && '💾'}
              {activeSection === 'images' && '🖼️'}
              {activeSection === 'tools' && '🛠️'}
              {activeSection === 'settings' && '⚙️'}
            </div>
            <p>
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} section coming soon...
            </p>
            {activeSection === 'settings' && (
              <button
                onClick={() => handleSectionChange('chat')}
                style={{
                  marginTop: '24px',
                  padding: '10px 24px',
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Back
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
