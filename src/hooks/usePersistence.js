import { useState, useEffect } from 'react';

const SEEN_KEY = 'dp_seen';
const BOOKMARKS_KEY = 'dp_bookmarks';
const SEEN_TTL = 7 * 24 * 60 * 60 * 1000;

function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(data).filter(([, ts]) => now - ts < SEEN_TTL)
    );
  } catch { return {}; }
}

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
  } catch { return []; }
}

export function usePersistence() {
  const [seen, setSeen] = useState(loadSeen);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);

  const markSeen = (id) => {
    setSeen(prev => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: Date.now() };
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleBookmark = (item) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.id === item.id);
      const next = exists ? prev.filter(b => b.id !== item.id) : [...prev, item];
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearSeen = () => {
    localStorage.removeItem(SEEN_KEY);
    setSeen({});
  };

  const clearBookmarks = () => {
    localStorage.removeItem(BOOKMARKS_KEY);
    setBookmarks([]);
  };

  return { seen, bookmarks, markSeen, toggleBookmark, clearSeen, clearBookmarks };
}
