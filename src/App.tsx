import { useState, useCallback, useRef, useEffect } from 'react';
import type { Chat, UserProfile, GitHubAuth } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { ChatHistory } from './components/ChatHistory';
import { AuthModal } from './components/AuthModal';
import { ProfileSetup } from './components/ProfileSetup';
import { createNewChat, createMessage, generateChatTitle, simulateStreamingResponse } from './utils';
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
  const streamingResponseRef = useRef<string>('');

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

  const handleAuthSuccess = useCallback(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      // Already has a profile - just load it
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (err) {
        console.error('Failed to parse saved profile:', err);
      }
      return;
    }

    // No profile yet - open profile setup
    const savedAuth = localStorage.getItem('githubAuth');
    if (savedAuth) {
      try {
        setGithubAuth(JSON.parse(savedAuth));
      } catch (err) {
        console.error('Failed to parse auth data:', err);
      }
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
