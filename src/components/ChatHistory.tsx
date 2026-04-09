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
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input-chatgpt"
            autoFocus
          />
        </div>
      )}
      <div className="chat-history-list-chatgpt">
        {filteredChats.length === 0 ? (
          <p className="no-chats-chatgpt">
            {chats.length === 0 ? 'No conversations yet' : 'No chats found'}
          </p>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-history-item-chatgpt ${activeChat === chat.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="chat-item-content-chatgpt">
                <p className="chat-item-title-chatgpt">{chat.title}</p>
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
