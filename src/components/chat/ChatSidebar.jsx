"use client";

import React from 'react';
import { Plus, Trash2, MessageSquare } from 'lucide-react';

const ChatSidebar = ({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  isOpen,
  onClose,
}) => {
  // Group conversations by time
  const grouped = React.useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    const today = [];
    const yesterday = [];
    const previous = [];

    conversations.forEach(c => {
      const age = now - c.createdAt;
      if (age < dayMs) today.push(c);
      else if (age < dayMs * 2) yesterday.push(c);
      else previous.push(c);
    });

    return { today, yesterday, previous };
  }, [conversations]);

  const renderGroup = (label, items) => {
    if (items.length === 0) return null;
    return (
      <div className="chat-sidebar-group">
        <div className="chat-sidebar-group-label">{label}</div>
        {items.map(c => (
          <div
            key={c.id}
            className={`chat-sidebar-item ${c.id === activeId ? 'active' : ''}`}
            onClick={() => {
              onSelect(c.id);
              onClose?.();
            }}
          >
            <MessageSquare size={14} className="chat-sidebar-item-icon" />
            <span className="chat-sidebar-item-title">{c.title || 'New Chat'}</span>
            <button
              className="chat-sidebar-item-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="chat-sidebar-overlay" onClick={onClose} />}

      <aside className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="chat-sidebar-header">
          <button className="chat-new-btn" onClick={() => { onCreate(); onClose?.(); }}>
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="chat-sidebar-list">
          {conversations.length === 0 ? (
            <div className="chat-sidebar-empty">
              <p>No conversations yet</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Start a new chat to begin</p>
            </div>
          ) : (
            <>
              {renderGroup('Today', grouped.today)}
              {renderGroup('Yesterday', grouped.yesterday)}
              {renderGroup('Previous', grouped.previous)}
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
