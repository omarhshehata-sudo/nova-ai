import React, { useEffect, useRef, useState } from 'react';
import '../styles/ChatContextMenu.css';

interface ChatContextMenuProps {
  chatId: string;
  chatTitle: string;
  isPinned?: boolean;
  isArchived?: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: (chatId: string, newTitle: string) => void;
  onPin: (chatId: string) => void;
  onArchive: (chatId: string) => void;
  onDelete: (chatId: string) => void;
}

/* SVG Icons */
const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z" />
  </svg>
);

const ArchiveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
  chatId,
  chatTitle,
  isPinned = false,
  isArchived = false,
  position,
  onClose,
  onRename,
  onPin,
  onArchive,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chatTitle);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Focus rename input
  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.bottom > viewH - 10) {
        menuRef.current.style.top = `${position.y - rect.height}px`;
      }
    }
  }, [position]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== chatTitle) {
      onRename(chatId, trimmed);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(chatId);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="chat-context-menu"
      style={{ top: position.y, left: position.x }}
    >
      {renaming ? (
        <div className="context-menu-rename">
          <input
            ref={inputRef}
            className="context-menu-rename-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') onClose();
            }}
            maxLength={80}
          />
          <button className="context-menu-rename-ok" onClick={handleRenameSubmit}>
            Done
          </button>
        </div>
      ) : (
        <>
          <button className="context-menu-item" onClick={() => setRenaming(true)}>
            <PencilIcon />
            <span>Rename</span>
          </button>
          <button className="context-menu-item" onClick={() => { onPin(chatId); onClose(); }}>
            <PinIcon />
            <span>{isPinned ? 'Unpin' : 'Pin to top'}</span>
          </button>
          <button className="context-menu-item" onClick={() => { onArchive(chatId); onClose(); }}>
            <ArchiveIcon />
            <span>{isArchived ? 'Unarchive' : 'Archive'}</span>
          </button>
          <div className="context-menu-divider" />
          <button
            className={`context-menu-item context-menu-item--danger ${confirmDelete ? 'context-menu-item--confirm' : ''}`}
            onClick={handleDelete}
          >
            <TrashIcon />
            <span>{confirmDelete ? 'Confirm delete' : 'Delete'}</span>
          </button>
        </>
      )}
    </div>
  );
};
