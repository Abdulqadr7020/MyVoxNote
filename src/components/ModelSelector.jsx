"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Cpu, Check, AlertCircle } from 'lucide-react';

/**
 * ModelSelector — premium glass-morphism dropdown for AI provider/model selection.
 *
 * Props:
 *   selectedProvider  – current provider ID (e.g. 'groq')
 *   selectedModel     – current model ID
 *   onSelect          – (providerId, modelId) => void
 *   availableProviders – array from /api/providers
 */
const ModelSelector = ({ selectedProvider, selectedModel, onSelect, availableProviders = [], compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Close on outside click ────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ── Close on Escape ───────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isOpen]);

  // ── Resolve current selection labels ──────────────────────────────
  const currentProvider = availableProviders.find(p => p.id === selectedProvider);
  const currentModel = currentProvider?.models?.find(m => m.id === selectedModel);

  const displayProviderName = currentProvider?.name || 'Select Model';
  const displayProviderIcon = currentProvider?.icon || '🤖';
  const displayModelName = currentModel?.name || 'Default';

  const handleSelect = useCallback((providerId, modelId) => {
    onSelect(providerId, modelId);
    setIsOpen(false);
  }, [onSelect]);

  // ── Tag color map ─────────────────────────────────────────────────
  const tagColors = {
    'Recommended': { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgba(139, 92, 246, 0.4)', color: '#c4b5fd' },
    'Best Free':   { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', color: '#6ee7b7' },
    'Fast':        { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', color: '#93c5fd' },
    'Fastest':     { bg: 'rgba(14, 165, 233, 0.2)', border: 'rgba(14, 165, 233, 0.4)', color: '#7dd3fc' },
    'Free':        { bg: 'rgba(34, 197, 94, 0.2)',  border: 'rgba(34, 197, 94, 0.4)',  color: '#86efac' },
    'New':         { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgba(251, 146, 60, 0.4)', color: '#fdba74' },
    'Reasoning':   { bg: 'rgba(244, 114, 182, 0.2)', border: 'rgba(244, 114, 182, 0.4)', color: '#f9a8d4' },
    'Popular':     { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', color: '#d8b4fe' },
    '32K Context': { bg: 'rgba(234, 179, 8, 0.2)',  border: 'rgba(234, 179, 8, 0.4)',  color: '#fde047' },
    'Balanced':    { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' },
    'Powerful':    { bg: 'rgba(239, 68, 68, 0.2)',  border: 'rgba(239, 68, 68, 0.4)',  color: '#fca5a5' },
  };

  const getTagStyle = (tag) => {
    const colors = tagColors[tag] || { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)', color: '#94a3b8' };
    return {
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      color: colors.color,
      fontSize: '0.6rem',
      fontWeight: 700,
      padding: '2px 7px',
      borderRadius: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    };
  };

  if (availableProviders.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 14px', borderRadius: '12px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        fontSize: '0.78rem', color: 'rgba(239, 68, 68, 0.7)',
      }}>
        <AlertCircle size={14} />
        <span>No AI providers configured</span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: 50 }}>
      {/* ── Collapsed Trigger ──────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover-lift"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? '6px' : '10px',
          padding: compact ? '6px 12px' : '10px 16px',
          borderRadius: compact ? '12px' : '14px',
          background: compact ? 'rgba(255, 255, 255, 0.03)' : 'rgba(139, 92, 246, 0.06)',
          border: compact ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(139, 92, 246, 0.15)',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          width: '100%',
        }}
      >
        <Cpu size={compact ? 13 : 15} style={{ color: 'var(--accent-primary)', opacity: 0.7 }} />
        
        {!compact && (
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
          }}>
            AI Model
          </span>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: compact ? '0.85rem' : '0.95rem' }}>{displayProviderIcon}</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: compact ? '0.75rem' : '0.82rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}>
            {displayProviderName}
          </div>
          <div style={{
            fontSize: compact ? '0.6rem' : '0.68rem',
            color: 'var(--text-secondary)',
            opacity: 0.7,
          }}>
            {displayModelName}
          </div>
        </div>

        <ChevronDown
          size={compact ? 12 : 14}
          style={{
            color: 'var(--text-secondary)',
            transition: 'transform 0.25s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* ── Expanded Dropdown ──────────────────────────────────────── */}
      {isOpen && (
        <div
          className="animate-slide-up"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: '240px',
            background: 'rgba(13, 15, 25, 0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            borderRadius: '18px',
            padding: '10px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139, 92, 246, 0.08)',
            maxHeight: '380px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {availableProviders.map((provider) => (
            <div key={provider.id} style={{ marginBottom: '6px' }}>
              {/* Provider header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px 4px',
              }}>
                <span style={{ fontSize: '1rem' }}>{provider.icon}</span>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {provider.name}
                </div>
              </div>

              {/* Model list */}
              <div style={{ paddingLeft: '12px' }}>
                {provider.models.map((model) => {
                  const isSelected = selectedProvider === provider.id && selectedModel === model.id;

                  return (
                    <button
                      key={model.id}
                      onClick={() => handleSelect(provider.id, model.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '11px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: isSelected
                          ? 'rgba(139, 92, 246, 0.12)'
                          : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isSelected
                          ? 'rgba(139, 92, 246, 0.12)'
                          : 'transparent';
                      }}
                    >
                      {/* Minimal indicator removed, using background color only */}

                      {/* Model name */}
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        flex: 1,
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}>
                        {model.name}
                      </span>

                      {/* Tag */}
                      {model.tag && (
                        <span style={{...getTagStyle(model.tag), transform: 'scale(0.9)'}}>
                          {model.tag}
                        </span>
                      )}

                      {/* Selected Check */}
                      {isSelected && (
                        <Check size={14} style={{ color: 'var(--accent-primary)' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
