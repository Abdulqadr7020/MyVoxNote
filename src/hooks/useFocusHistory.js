'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'voxnote-focus-history';
const MAX_SESSIONS = 50;

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('VoxNote: Could not persist history to localStorage', e);
  }
};

const generateTitle = (transcript) => {
  if (!transcript) return 'Untitled Session';
  const cleaned = transcript.trim().replace(/\s+/g, ' ');
  return cleaned.length > 65 ? cleaned.slice(0, 62) + '...' : cleaned;
};

export function useFocusHistory() {
  const [history, setHistory] = useState(() => loadFromStorage());

  const saveSession = useCallback((transcript, formattedData) => {
    if (!formattedData || (!formattedData.summary && !formattedData.bullets)) return;

    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      title: generateTitle(transcript),
      transcript: transcript || '',
      summary: formattedData.summary || '',
      detailed: formattedData.detailed || '',
      bullets: formattedData.bullets || [],
      questions: formattedData.questions || [],
      visuals: formattedData.visuals || null,
    };

    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_SESSIONS);
      persistToStorage(updated);
      return updated;
    });
  }, []);

  const deleteSession = useCallback((id) => {
    setHistory((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      persistToStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setHistory([]);
    persistToStorage([]);
  }, []);

  return { history, saveSession, deleteSession, clearAll };
}
