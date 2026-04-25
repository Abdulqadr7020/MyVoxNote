'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Search, History, Trash2, FolderOpen, AlertTriangle, Clock } from 'lucide-react';

const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDateGroup = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  return 'Earlier';
};

const groupByDate = (sessions) => {
  const groups = {};
  const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  sessions.forEach((s) => {
    const group = getDateGroup(s.timestamp);
    if (!groups[group]) groups[group] = [];
    groups[group].push(s);
  });

  return order.filter((g) => groups[g]).map((g) => ({ label: g, sessions: groups[g] }));
};

/* ─── Single Session Card ─────────────────────────────────── */
const SessionCard = ({ session, onLoad, onDelete, deletingId }) => {
  const isDeleting = deletingId === session.id;

  return (
    <div
      className="focus-history-card"
      style={{
        background: isDeleting
          ? 'rgba(239, 68, 68, 0.08)'
          : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isDeleting ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default',
        opacity: isDeleting ? 0.5 : 1,
        transform: isDeleting ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      {/* Title */}
      <p
        style={{
          margin: 0,
          fontSize: '0.88rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {session.title}
      </p>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.55 }}>
        <Clock size={12} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
          {formatTimestamp(session.timestamp)}
        </span>
        {session.bullets?.length > 0 && (
          <>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ fontSize: '0.75rem' }}>{session.bullets.length} key points</span>
          </>
        )}
        {session.questions?.length > 0 && (
          <>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ fontSize: '0.75rem' }}>{session.questions.length} Q&amp;A</span>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
        <button
          onClick={() => onLoad(session)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'var(--accent-gradient)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <FolderOpen size={13} />
          Open
        </button>
        <button
          onClick={() => onDelete(session.id)}
          disabled={isDeleting}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'rgba(239, 68, 68, 0.8)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isDeleting) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = 'rgb(239, 68, 68)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = 'rgba(239, 68, 68, 0.8)';
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

/* ─── Empty State ─────────────────────────────────────────── */
const EmptyState = () => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '40px 20px',
      textAlign: 'center',
      opacity: 0.45,
    }}
  >
    <div
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: 'rgba(139, 92, 246, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <History size={28} color="var(--accent-color)" />
    </div>
    <div>
      <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>No history yet</p>
      <p style={{ fontSize: '0.82rem', marginTop: '6px', lineHeight: 1.5, opacity: 0.8 }}>
        Your analyzed sessions will appear here. Start by recording or typing something!
      </p>
    </div>
  </div>
);

/* ─── Clear Confirm Prompt ────────────────────────────────── */
const ClearConfirm = ({ onConfirm, onCancel }) => (
  <div
    style={{
      margin: '0 0 12px',
      padding: '16px',
      borderRadius: '14px',
      background: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <AlertTriangle size={16} color="rgb(239,68,68)" />
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgb(239,68,68)' }}>
        Clear all history?
      </span>
    </div>
    <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.7, lineHeight: 1.5 }}>
      This will permanently delete all saved sessions. This action cannot be undone.
    </p>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={onConfirm}
        style={{
          flex: 1,
          padding: '8px',
          borderRadius: '10px',
          background: 'rgb(239, 68, 68)',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.8rem',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Yes, Clear All
      </button>
      <button
        onClick={onCancel}
        style={{
          flex: 1,
          padding: '8px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.05)',
          color: 'var(--text-secondary)',
          fontWeight: 700,
          fontSize: '0.8rem',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </div>
  </div>
);

/* ─── Main Panel ──────────────────────────────────────────── */
const FocusHistoryPanel = ({ isOpen, onClose, history, onLoadSession, onDeleteSession, onClearAll }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const t = setTimeout(() => {
        setMounted(false);
        setSearchQuery('');
        setShowClearConfirm(false);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Prevent body scroll when panel open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.transcript?.toLowerCase().includes(q) ||
        s.summary?.toLowerCase().includes(q)
    );
  }, [history, searchQuery]);

  const grouped = useMemo(() => groupByDate(filteredHistory), [filteredHistory]);

  const handleDelete = useCallback(
    (id) => {
      setDeletingId(id);
      setTimeout(() => {
        onDeleteSession(id);
        setDeletingId(null);
      }, 300);
    },
    [onDeleteSession]
  );

  const handleClearAll = useCallback(() => {
    setShowClearConfirm(false);
    onClearAll();
  }, [onClearAll]);

  if (!mounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 900,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.35s ease',
          cursor: 'pointer',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '380px',
          maxWidth: '90vw',
          background: 'rgba(10, 12, 18, 0.98)',
          backdropFilter: 'blur(30px)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.6)',
          zIndex: 901,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <History size={16} color="white" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Session History
                </h2>
                <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.45, fontWeight: 600 }}>
                  {history.length} session{history.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {history.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  title="Clear all history"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(239,68,68,0.1)',
                    color: 'rgba(239,68,68,0.7)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                    e.currentTarget.style.color = 'rgb(239,68,68)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                    e.currentTarget.style.color = 'rgba(239,68,68,0.7)';
                  }}
                >
                  <Trash2 size={11} /> Clear All
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div
            style={{
              position: 'relative',
              marginTop: '16px',
            }}
          >
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 34px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
          }}
        >
          {showClearConfirm && (
            <ClearConfirm onConfirm={handleClearAll} onCancel={() => setShowClearConfirm(false)} />
          )}

          {filteredHistory.length === 0 ? (
            <EmptyState />
          ) : (
            grouped.map(({ label, sessions }) => (
              <div key={label} style={{ marginBottom: '20px' }}>
                {/* Date group label */}
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-color)',
                    opacity: 0.7,
                    marginBottom: '10px',
                    paddingLeft: '2px',
                  }}
                >
                  {label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onLoad={onLoadSession}
                      onDelete={handleDelete}
                      deletingId={deletingId}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default FocusHistoryPanel;
