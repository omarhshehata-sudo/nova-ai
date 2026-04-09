import React, { useState } from 'react';
import type { Memory, MemoryCategory } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import '../styles/MemoryPage.css';

interface MemoryPageProps {
  memories: Memory[];
  memoryEnabled: boolean;
  onToggleMemory: (enabled: boolean) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
  onBack: () => void;
}

const CATEGORY_CONFIG: Record<MemoryCategory, { label: string; color: string }> = {
  personal: { label: 'Personal', color: '#f472b6' },
  preferences: { label: 'Preferences', color: '#60a5fa' },
  projects: { label: 'Projects', color: '#34d399' },
  goals: { label: 'Goals', color: '#fbbf24' },
  other: { label: 'Other', color: '#a78bfa' },
};

const CATEGORIES: MemoryCategory[] = ['personal', 'preferences', 'projects', 'goals', 'other'];

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const BrainIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.58.67 3 1.74 4.01L4 13l2 1.5V20a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5.5L20 13l-1.74-1.49A5.48 5.48 0 0 0 20 7.5 5.5 5.5 0 0 0 14.5 2" />
    <path d="M12 2v8" />
    <path d="M8 8h8" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const MemoryPage: React.FC<MemoryPageProps> = ({
  memories,
  memoryEnabled,
  onToggleMemory,
  onDeleteMemory,
  onClearAllMemories,
  onBack,
}) => {
  const [filter, setFilter] = useState<MemoryCategory | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);

  const filtered = filter === 'all' ? memories : memories.filter(m => m.category === filter);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = memories.filter(m => m.category === cat).length;
    return acc;
  }, {} as Record<MemoryCategory, number>);

  return (
    <div className="memory-container">
      {/* Header */}
      <div className="memory-header">
        <button className="memory-back-btn" onClick={onBack}>
          <ArrowLeftIcon />
          <span>Back</span>
        </button>
        <div className="memory-title-block">
          <div className="memory-title-row">
            <BrainIcon />
            <h1 className="memory-title">Memory</h1>
          </div>
          <p className="memory-subtitle">Nova remembers useful things to personalize your experience. You can review and delete memories anytime.</p>
        </div>
        <div className="memory-header-actions">
          <div className="memory-toggle-wrap">
            <span className="memory-toggle-label">{memoryEnabled ? 'On' : 'Off'}</span>
            <button
              className={`memory-toggle ${memoryEnabled ? 'memory-toggle--on' : ''}`}
              onClick={() => onToggleMemory(!memoryEnabled)}
              role="switch"
              aria-checked={memoryEnabled}
            >
              <span className="memory-toggle__thumb" />
            </button>
          </div>
        </div>
      </div>

      {!memoryEnabled && (
        <div className="memory-disabled-banner">
          Memory is turned off. Nova won't save or use memories while this is disabled.
        </div>
      )}

      {/* Category filters */}
      <div className="memory-filters">
        <button
          className={`memory-filter-chip ${filter === 'all' ? 'memory-filter-chip--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All <span className="memory-filter-count">{memories.length}</span>
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`memory-filter-chip ${filter === cat ? 'memory-filter-chip--active' : ''}`}
            onClick={() => setFilter(cat)}
            style={{ '--chip-color': CATEGORY_CONFIG[cat].color } as React.CSSProperties}
          >
            {CATEGORY_CONFIG[cat].label}
            <span className="memory-filter-count">{categoryCounts[cat]}</span>
          </button>
        ))}
      </div>

      {/* Memory list */}
      <div className="memory-list">
        {filtered.length === 0 ? (
          <div className="memory-empty">
            <div className="memory-empty-icon">
              <BrainIcon />
            </div>
            <h3>No memories yet</h3>
            <p>{filter === 'all'
              ? 'Nova will remember useful things about you as you chat. Memories help personalize your experience.'
              : `No ${CATEGORY_CONFIG[filter as MemoryCategory].label.toLowerCase()} memories saved yet.`}
            </p>
          </div>
        ) : (
          filtered.map(memory => (
            <div className="memory-item" key={memory.id}>
              <div className="memory-item-content">
                <span
                  className="memory-category-chip"
                  style={{ '--chip-color': CATEGORY_CONFIG[memory.category].color } as React.CSSProperties}
                >
                  {CATEGORY_CONFIG[memory.category].label}
                </span>
                <p className="memory-item-text">{memory.content}</p>
                <span className="memory-item-date">{formatDate(memory.createdAt)}</span>
              </div>
              <button
                className="memory-item-delete"
                onClick={() => setDeleteTarget(memory.id)}
                aria-label="Delete memory"
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Clear all button */}
      {memories.length > 0 && (
        <div className="memory-footer">
          <button className="memory-clear-all-btn" onClick={() => setShowClearAll(true)}>
            <TrashIcon />
            Clear All Memories
          </button>
        </div>
      )}

      {/* Delete single confirm */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Memory"
          message="Are you sure you want to delete this memory? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => { onDeleteMemory(deleteTarget); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
          isDangerous
        />
      )}

      {/* Clear all confirm */}
      {showClearAll && (
        <ConfirmDialog
          isOpen={true}
          title="Clear All Memories"
          message="This will permanently delete all saved memories. This action cannot be undone."
          confirmText="Clear All"
          cancelText="Cancel"
          onConfirm={() => { onClearAllMemories(); setShowClearAll(false); }}
          onCancel={() => setShowClearAll(false)}
          isDangerous
        />
      )}
    </div>
  );
};
