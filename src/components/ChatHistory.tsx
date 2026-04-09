import React, { useState, useMemo } from 'react';
import type { Chat } from '../types';
import { IconTrash, IconSearch, IconNewChat } from './Icons';
import { ConfirmDialog } from './ConfirmDialog';
import '../styles/ChatHistory.css';

interface ChatHistoryProps {
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onNewChat?: () => void;
}

const getPreview = (chat: Chat): string => {
  const last = chat.messages[chat.messages.length - 1];
  if (!last) return 'Empty conversation';
  const text = last.content.replace(/\n+/g, ' ').trim();
  return text.length > 60 ? text.slice(0, 60) + '…' : text;
};

const formatRelative = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  chats,
  activeChat,
  onSelectChat,
  onDeleteChat,
  onNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
  };

  const handleConfirmDelete = () => {
    if (chatToDelete && onDeleteChat) {
      onDeleteChat(chatToDelete);
      setChatToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setChatToDelete(null);
  };

  return (
    <div className="chat-history-chatgpt">
      <div className="chat-history-search-header-chatgpt">
        {onNewChat && (
          <button
            className="new-chat-btn-history-chatgpt"
            onClick={onNewChat}
            title="New chat"
            aria-label="Start a new conversation"
          >
            <IconNewChat />
            <span>New chat</span>
          </button>
        )}
        <button
          className="chat-search-toggle-chatgpt"
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) setSearchQuery('');
          }}
          title={showSearch ? 'Close search' : 'Search chats'}
        >
          <IconSearch />
        </button>
      </div>
      {showSearch && (
        <div className="chat-history-search-chatgpt">
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input-chatgpt"
            autoFocus
          />
        </div>
      )}
      <div className="chat-history-list-chatgpt">
        {filteredChats.length === 0 ? (
          <div className="no-chats-chatgpt">
            <div className="no-chats-icon-wrapper">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="no-chats-title">
              {chats.length === 0 ? 'No conversations yet' : 'No results found'}
            </p>
            <p className="no-chats-subtitle">
              {chats.length === 0 ? 'Start a new chat to begin exploring' : 'Try a different search term'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat, index) => (
            <div
              key={chat.id}
              className={`chat-history-item-chatgpt ${activeChat === chat.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="chat-item-accent" />
              <div className="chat-item-content-chatgpt">
                <div className="chat-item-top-row">
                  <p className="chat-item-title-chatgpt">{chat.title}</p>
                  <span className="chat-item-time">{formatRelative(chat.updatedAt)}</span>
                </div>
                <p className="chat-item-preview">{getPreview(chat)}</p>
              </div>
              {onDeleteChat && (
                <button
                  className="chat-item-delete-chatgpt"
                  onClick={(e) => handleDeleteClick(chat.id, e)}
                  title="Delete chat"
                >
                  <IconTrash />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={chatToDelete !== null}
        title="Delete Conversation"
        message="This conversation and all its associated memories, images, documents, and analyses will be permanently removed. This action cannot be undone."
        confirmText="Delete"
        cancelText="Keep"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDangerous={true}
      />
    </div>
  );
};
