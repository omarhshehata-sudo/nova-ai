import React, { useState, useMemo } from 'react';
import type { Chat } from '../types';
import { IconSearch, IconNewChat } from './Icons';
import { ChatContextMenu } from './ChatContextMenu';
import '../styles/ChatHistory.css';

interface ChatHistoryProps {
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onRenameChat?: (chatId: string, newTitle: string) => void;
  onPinChat?: (chatId: string) => void;
  onArchiveChat?: (chatId: string) => void;
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

/* Three-dots icon */
const DotsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

/* Pin indicator icon */
const PinSmallIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z" />
  </svg>
);

/* Archive icon for tab */
const ArchiveTabIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

type ViewMode = 'chats' | 'archived';

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  chats,
  activeChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onPinChat,
  onArchiveChat,
  onNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chats');
  const [contextMenu, setContextMenu] = useState<{
    chatId: string;
    position: { x: number; y: number };
  } | null>(null);

  const archivedChats = useMemo(() =>
    chats.filter((c) => c.archived),
    [chats]
  );

  const activeChats = useMemo(() =>
    chats.filter((c) => !c.archived),
    [chats]
  );

  const displayChats = viewMode === 'archived' ? archivedChats : activeChats;

  const filteredChats = useMemo(() => {
    let list = displayChats;
    if (searchQuery.trim()) {
      list = list.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Sort: pinned first, then by updatedAt descending
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [displayChats, searchQuery]);

  const pinnedChats = filteredChats.filter((c) => c.pinned);
  const unpinnedChats = filteredChats.filter((c) => !c.pinned);

  const handleContextMenu = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    setContextMenu({
      chatId,
      position: { x: rect.right + 4, y: rect.top },
    });
  };

  const renderChatItem = (chat: Chat, index: number) => (
    <div
      key={chat.id}
      className={`chat-history-item-chatgpt ${activeChat === chat.id ? 'active' : ''}`}
      onClick={() => onSelectChat(chat.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({
          chatId: chat.id,
          position: { x: e.clientX, y: e.clientY },
        });
      }}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="chat-item-accent" />
      <div className="chat-item-content-chatgpt">
        <div className="chat-item-top-row">
          <p className="chat-item-title-chatgpt">
            {chat.pinned && <span className="chat-pin-indicator"><PinSmallIcon /></span>}
            {chat.title}
          </p>
          <span className="chat-item-time">{formatRelative(chat.updatedAt)}</span>
        </div>
        <p className="chat-item-preview">{getPreview(chat)}</p>
      </div>
      <button
        className="chat-item-dots-btn"
        onClick={(e) => handleContextMenu(chat.id, e)}
        title="More options"
      >
        <DotsIcon />
      </button>
    </div>
  );

  const contextChat = contextMenu ? chats.find((c) => c.id === contextMenu.chatId) : null;

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

      {/* View mode tabs */}
      <div className="chat-view-tabs">
        <button
          className={`chat-view-tab ${viewMode === 'chats' ? 'chat-view-tab--active' : ''}`}
          onClick={() => setViewMode('chats')}
        >
          Chats
        </button>
        <button
          className={`chat-view-tab ${viewMode === 'archived' ? 'chat-view-tab--active' : ''}`}
          onClick={() => setViewMode('archived')}
        >
          <ArchiveTabIcon />
          Archived
          {archivedChats.length > 0 && (
            <span className="chat-view-tab-badge">{archivedChats.length}</span>
          )}
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
              {viewMode === 'archived'
                ? 'No archived chats'
                : chats.length === 0
                  ? 'No conversations yet'
                  : 'No results found'}
            </p>
            <p className="no-chats-subtitle">
              {viewMode === 'archived'
                ? 'Archived chats will appear here'
                : chats.length === 0
                  ? 'Start a new chat to begin exploring'
                  : 'Try a different search term'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'chats' && pinnedChats.length > 0 && (
              <>
                <div className="chat-section-label">
                  <PinSmallIcon />
                  <span>Pinned</span>
                </div>
                {pinnedChats.map((chat, i) => renderChatItem(chat, i))}
                {unpinnedChats.length > 0 && (
                  <div className="chat-section-label">
                    <span>Recent</span>
                  </div>
                )}
              </>
            )}
            {(viewMode === 'archived' ? filteredChats : unpinnedChats).map((chat, i) =>
              renderChatItem(chat, pinnedChats.length + i)
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && contextChat && onDeleteChat && onRenameChat && onPinChat && onArchiveChat && (
        <ChatContextMenu
          chatId={contextMenu.chatId}
          chatTitle={contextChat.title}
          isPinned={contextChat.pinned}
          isArchived={contextChat.archived}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onRename={onRenameChat}
          onPin={onPinChat}
          onArchive={onArchiveChat}
          onDelete={onDeleteChat}
        />
      )}
    </div>
  );
};
