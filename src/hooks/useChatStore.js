"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { sendChatMessage, consumeStream } from '../services/chat';
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from '../config/aiProviders';

const STORAGE_KEY = 'voxnote-chat-history';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const loadFromStorage = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (conversations) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Storage full or unavailable
  }
};

/**
 * Custom hook for managing chat conversations with streaming support.
 */
export function useChatStore() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  // ── AI Model selection (shared with Focus Mode via localStorage) ──
  const [selectedProvider, setSelectedProvider] = useState(DEFAULT_PROVIDER);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [availableProviders, setAvailableProviders] = useState([]);

  // Hydrate model selection from localStorage
  useEffect(() => {
    const sp = localStorage.getItem('voxnote-ai-provider');
    const sm = localStorage.getItem('voxnote-ai-model');
    if (sp) setSelectedProvider(sp);
    if (sm) setSelectedModel(sm);
  }, []);

  // Fetch available providers
  useEffect(() => {
    fetch('/api/providers')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAvailableProviders(data); })
      .catch(() => { });
  }, []);

  const handleModelChange = useCallback((providerId, modelId) => {
    setSelectedProvider(providerId);
    setSelectedModel(modelId);
    localStorage.setItem('voxnote-ai-provider', providerId);
    localStorage.setItem('voxnote-ai-model', modelId);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    setConversations(stored);
    if (stored.length > 0) {
      setActiveId(stored[0].id);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (conversations.length > 0) {
      saveToStorage(conversations);
    }
  }, [conversations]);

  const activeConversation = conversations.find(c => c.id === activeId) || null;

  const createConversation = useCallback(() => {
    const newConvo = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setConversations(prev => [newConvo, ...prev]);
    setActiveId(newConvo.id);
    return newConvo.id;
  }, []);

  const switchConversation = useCallback((id) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback((id) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        saveToStorage([]);
      }
      return filtered;
    });
    setActiveId(prev => {
      if (prev === id) {
        const remaining = conversations.filter(c => c.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return prev;
    });
  }, [conversations]);

  const renameConversation = useCallback((id, title) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, title } : c)
    );
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isStreaming) return;

    let targetId = activeId;

    // If no active conversation, create one
    if (!targetId) {
      const newConvo = {
        id: generateId(),
        title: text.slice(0, 40) + (text.length > 40 ? '...' : ''),
        messages: [],
        createdAt: Date.now(),
      };
      setConversations(prev => [newConvo, ...prev]);
      setActiveId(newConvo.id);
      targetId = newConvo.id;
    }

    const userMessage = { role: 'user', content: text };

    // Add user message
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== targetId) return c;
        const updated = { ...c, messages: [...c.messages, userMessage] };
        // Auto-title from first message
        if (c.messages.length === 0) {
          updated.title = text.slice(0, 40) + (text.length > 40 ? '...' : '');
        }
        return updated;
      })
    );

    // Add empty assistant message placeholder
    const assistantMessage = { role: 'assistant', content: '' };
    setConversations(prev =>
      prev.map(c =>
        c.id === targetId
          ? { ...c, messages: [...c.messages, assistantMessage] }
          : c
      )
    );

    setIsStreaming(true);

    try {
      // Build messages array for API (get fresh state)
      const currentConvo = conversations.find(c => c.id === targetId);
      const apiMessages = [
        ...(currentConvo?.messages || []),
        userMessage,
      ].map(m => ({ role: m.role, content: m.content }));

      const reader = await sendChatMessage(apiMessages, selectedProvider, selectedModel);
      abortRef.current = reader;

      await consumeStream(
        reader,
        (token) => {
          // Append token to the last assistant message
          setConversations(prev =>
            prev.map(c => {
              if (c.id !== targetId) return c;
              const msgs = [...c.messages];
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                msgs[msgs.length - 1] = { ...lastMsg, content: lastMsg.content + token };
              }
              return { ...c, messages: msgs };
            })
          );
        },
        () => {
          setIsStreaming(false);
          abortRef.current = null;
        }
      );
    } catch (error) {
      console.error('Chat send error:', error);
      // Update the assistant message with error
      setConversations(prev =>
        prev.map(c => {
          if (c.id !== targetId) return c;
          const msgs = [...c.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
            msgs[msgs.length - 1] = { ...lastMsg, content: '⚠️ Failed to get response. Please try again.' };
          }
          return { ...c, messages: msgs };
        })
      );
      setIsStreaming(false);
    }
  }, [activeId, isStreaming, conversations, selectedProvider, selectedModel]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      try {
        abortRef.current.cancel();
      } catch { }
      abortRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  return {
    conversations,
    activeConversation,
    activeId,
    isStreaming,
    createConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    stopStreaming,
    // Model selection
    selectedProvider,
    selectedModel,
    availableProviders,
    handleModelChange,
  };
}
