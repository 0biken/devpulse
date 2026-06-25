# DevPulse — Technical Specification

**Version:** 1.0  
**Last updated:** June 2026  
**Scope:** Component architecture, state management, caching, error handling, UX behaviour

---

## 1. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 18 + Vite | Fast dev, simple deploy, no SSR needed |
| Styling | CSS Modules or inline styles | No build-time CSS dependency |
| State | `useState` + `useReducer` | No external store — scope doesn't justify Redux/Zustand |
| Persistence | `localStorage` | No auth, no backend, no sync needed in V1 |
| Routing | None | Single-page, no URL routing in V1 |
| Deploy | Vercel (static) | Free, zero-config, instant |
| Package manager | npm or pnpm | Standard |

---

## 2. Project Structure

```
devpulse/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Root component
│   ├── components/
│   │   ├── Header.jsx        # Logo, timer, status
│   │   ├── Ticker.jsx        # Scrolling news ticker
│   │   ├── TabBar.jsx        # Tab navigation
│   │   ├── FeedCard.jsx      # Individual card
│   │   ├── FeedList.jsx      # Card list + skeletons
│   │   ├── ErrorState.jsx    # Per-tab error display
│   │   ├── EmptyState.jsx    # No results display
│   │   ├── KeyboardHelp.jsx  # ? modal overlay
│   │   └── Footer.jsx        # Refresh, timestamp, count
│   ├── hooks/
│   │   ├── useFeed.js        # Fetch + cache logic per tab
│   │   ├── useTimer.js       # Ambient focus timer
│   │   ├── useKeyboard.js    # Global keyboard shortcuts
│   │   └── usePersistence.js # Seen state + bookmarks
│   ├── api/
│   │   ├── hn.js             # Hacker News fetcher
│   │   ├── devto.js          # DEV.to fetcher
│   │   ├── github.js         # GitHub Search fetcher
│   │   ├── jobs.js           # HN Jobs fetcher
│   │   ├── news.js           # Currents API fetcher
│   │   └── learn.js          # Gemini fetcher
│   ├── utils/
│   │   ├── timeAgo.js        # Date formatting
│   │   ├── cache.js          # Session + localStorage cache
│   │   └── sanitize.js       # XSS prevention for card titles
│   └── constants/
│       ├── tabs.js           # Tab config (id, label, color, icon)
│       └── keys.js           # Keyboard shortcut map
├── .env.local                # API keys (never commit)
├── .env.example              # Template for contributors
├── vite.config.js
└── package.json
```

---

## 3. Component Specifications

### 3.1 `App.jsx` — Root

Owns global state. Passes down via props (no context needed at this scale).

```jsx
function App() {
  const [activeTab, setActiveTab] = useState('hn');
  const [feeds, dispatch] = useReducer(feedReducer, {});
  const { seen, bookmarks, markSeen, toggleBookmark } = usePersistence();
  const { elapsed, isRunning } = useTimer();

  return (
    <div id="dp-root">
      <Header elapsed={elapsed} isRunning={isRunning} />
      <Ticker feeds={feeds} />
      <TabBar tabs={TABS} active={activeTab} onSwitch={setActiveTab} feeds={feeds} />
      <FeedList
        tabId={activeTab}
        feeds={feeds}
        dispatch={dispatch}
        seen={seen}
        bookmarks={bookmarks}
        onSeen={markSeen}
        onBookmark={toggleBookmark}
      />
      <Footer tabId={activeTab} feeds={feeds} dispatch={dispatch} />
    </div>
  );
}
```

### 3.2 `useFeed.js` — Data fetching hook

```javascript
import { useEffect } from 'react';
import { fetchTab } from '../api';
import { sessionCache } from '../utils/cache';

export function useFeed(tabId, dispatch) {
  useEffect(() => {
    if (sessionCache.has(tabId)) {
      dispatch({ type: 'SET', tabId, items: sessionCache.get(tabId) });
      return;
    }
    dispatch({ type: 'LOADING', tabId });
    fetchTab(tabId)
      .then(items => {
        sessionCache.set(tabId, items);
        dispatch({ type: 'SET', tabId, items });
      })
      .catch(err => {
        dispatch({ type: 'ERROR', tabId, error: err.message });
      });
  }, [tabId]);
}
```

### 3.3 Feed Reducer

```javascript
const initialState = {
  // tabId: { status: 'idle' | 'loading' | 'success' | 'error', items: [], error: null }
};

function feedReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, [action.tabId]: { status: 'loading', items: [], error: null } };
    case 'SET':
      return { ...state, [action.tabId]: { status: 'success', items: action.items, error: null } };
    case 'ERROR':
      return { ...state, [action.tabId]: { status: 'error', items: [], error: action.error } };
    case 'CLEAR':
      const next = { ...state };
      delete next[action.tabId];
      return next;
    default:
      return state;
  }
}
```

### 3.4 `FeedCard.jsx`

```jsx
function FeedCard({ item, tabId, isSeen, isBookmarked, onSeen, onBookmark }) {
  const tab = TABS.find(t => t.id === tabId);

  // Mark seen after 2 seconds in viewport
  const ref = useIntersectionObserver(() => {
    setTimeout(() => onSeen(item.id), 2000);
  });

  return (
    <a
      ref={ref}
      href={item.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`dp-card ${isSeen ? 'dp-card--seen' : ''}`}
      style={{ borderLeftColor: tab.color }}
      onClick={(e) => {
        if (!item.url) e.preventDefault();
        onSeen(item.id);
      }}
    >
      {item.badge && <Badge text={item.badge} color={tab.color} />}
      <div className="dp-card-top">
        <h3 className="dp-card-title">{sanitize(item.title)}</h3>
        {item.stat && <span className="dp-card-stat">{item.stat}</span>}
      </div>
      {item.meta?.length > 0 && (
        <div className="dp-card-meta">
          {item.meta.map((m, i) => <span key={i} className="dp-meta-item">{m}</span>)}
        </div>
      )}
      {item.tags?.length > 0 && (
        <div className="dp-tags">
          {item.tags.slice(0, 4).map(t => <span key={t} className="dp-tag">#{t}</span>)}
        </div>
      )}
      <button
        className={`dp-bookmark ${isBookmarked ? 'dp-bookmark--active' : ''}`}
        onClick={(e) => { e.preventDefault(); onBookmark(item); }}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
      >
        {isBookmarked ? '★' : '☆'}
      </button>
    </a>
  );
}
```

### 3.5 `useTimer.js` — Ambient focus timer

Auto-starts when the tab gains focus. Pauses when the user switches away. Accurately measures actual time spent in the feed.

```javascript
import { useState, useEffect, useRef } from 'react';

export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(document.hasFocus());
  const startRef = useRef(null);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    function onFocus() {
      setIsRunning(true);
      startRef.current = Date.now();
    }
    function onBlur() {
      setIsRunning(false);
      if (startRef.current) {
        accumulatedRef.current += Date.now() - startRef.current;
        startRef.current = null;
      }
    }
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    if (document.hasFocus()) startRef.current = Date.now();
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const current = startRef.current ? Date.now() - startRef.current : 0;
      setElapsed(accumulatedRef.current + current);
    }, 500);
    return () => clearInterval(interval);
  }, [isRunning]);

  return { elapsed, isRunning };
}
```

### 3.6 `useKeyboard.js` — Global shortcuts

```javascript
import { useEffect } from 'react';

export function useKeyboard({ onNext, onPrev, onOpen, onBookmark, onRefresh, onTabSwitch, onHelp }) {
  useEffect(() => {
    function handler(e) {
      // Don't intercept when typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case 'j': case 'ArrowDown': e.preventDefault(); onNext(); break;
        case 'k': case 'ArrowUp':   e.preventDefault(); onPrev(); break;
        case 'o': case 'Enter':     e.preventDefault(); onOpen(); break;
        case 'b':                   e.preventDefault(); onBookmark(); break;
        case 'r':                   e.preventDefault(); onRefresh(); break;
        case 'h':                   if (e.shiftKey) { e.preventDefault(); onTabSwitch(-1); } break;
        case 'l':                   if (e.shiftKey) { e.preventDefault(); onTabSwitch(+1); } break;
        case '?':                   e.preventDefault(); onHelp(); break;
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext, onPrev, onOpen, onBookmark, onRefresh, onTabSwitch, onHelp]);
}
```

**Keyboard map:**

| Key | Action |
|-----|--------|
| `J` / `↓` | Next card |
| `K` / `↑` | Previous card |
| `O` / `Enter` | Open card URL |
| `B` | Bookmark / unbookmark |
| `R` | Refresh current tab |
| `Shift+H` | Previous tab |
| `Shift+L` | Next tab |
| `?` | Toggle keyboard help |

> **Note:** `Tab` is intentionally not overridden — left for native browser focus behaviour and accessibility.

### 3.7 `usePersistence.js` — Seen state + bookmarks

```javascript
import { useState, useEffect } from 'react';

const SEEN_KEY = 'dp_seen';
const BOOKMARKS_KEY = 'dp_bookmarks';
const SEEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    // Purge entries older than 7 days
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
```

---

## 4. Caching Architecture

Two levels of cache:

### Level 1 — Session cache (in-memory)

Cleared on page refresh. Prevents re-fetching when switching between tabs in the same session.

```javascript
// src/utils/cache.js
const store = new Map();

export const sessionCache = {
  has: (key) => store.has(key),
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  delete: (key) => store.delete(key),
  clear: () => store.clear(),
};
```

### Level 2 — localStorage cache (Learn tab only)

Persists across sessions. 24-hour TTL to avoid burning Gemini free quota.

```javascript
export function getCachedLearn() {
  try {
    const raw = localStorage.getItem('dp_learn');
    if (!raw) return null;
    const { items, ts } = JSON.parse(raw);
    if (Date.now() - ts > 24 * 3600 * 1000) return null;
    return items;
  } catch { return null; }
}

export function setCachedLearn(items) {
  localStorage.setItem('dp_learn', JSON.stringify({ items, ts: Date.now() }));
}
```

---

## 5. Error Handling

### Per-tab error boundary

Each tab fails independently. A broken GitHub tab does not affect HN.

```jsx
function FeedList({ tabId, feeds, dispatch }) {
  const feed = feeds[tabId];

  if (!feed || feed.status === 'loading') return <Skeleton />;
  if (feed.status === 'error') return (
    <ErrorState
      message={feed.error}
      onRetry={() => {
        dispatch({ type: 'CLEAR', tabId });
        // useFeed will re-trigger on next render
      }}
    />
  );
  if (!feed.items.length) return <EmptyState />;
  return feed.items.map(item => <FeedCard key={item.id || item.url} item={item} tabId={tabId} />);
}
```

### ErrorState component

```jsx
function ErrorState({ message, onRetry }) {
  return (
    <div className="dp-error">
      <span className="dp-error-icon">⚠</span>
      <p>Could not load this feed.</p>
      <small>{message}</small>
      <button onClick={onRetry}>Try again</button>
    </div>
  );
}
```

### Network error handling

```javascript
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}
```

---

## 6. XSS Prevention

Card titles come from external APIs. Never use `dangerouslySetInnerHTML`.

```javascript
// src/utils/sanitize.js
export function sanitize(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

React's JSX escapes strings by default, so `{item.title}` is already safe. The sanitize utility is only needed if you ever use `innerHTML` directly (avoid this).

---

## 7. Card Data Shape

All API fetchers must return items conforming to this shape:

```typescript
interface CardItem {
  id?: string | number;     // Unique ID for seen state tracking
  title: string;            // Required — main heading
  url: string | null;       // Link target. null for Learn tips.
  badge?: string;           // Small label (language, category, "TIL")
  stat?: string;            // Right-aligned metric ("▲ 847", "★ 12k")
  meta?: string[];          // Small metadata items below title
  tags?: string[];          // Hashtag pills
  preview?: string;         // Expanded content (Learn tab only)
}
```

---

## 8. Tab Configuration

Centralise tab config in one place. Components read from this, never hardcode.

```javascript
// src/constants/tabs.js
export const TABS = [
  { id: 'hn',     label: 'HN',      icon: 'ti-brand-y-combinator', color: '#BA7517', dot: '#EF9F27' },
  { id: 'devto',  label: 'DEV.to',  icon: 'ti-brand-dev-to',       color: '#534AB7', dot: '#7F77DD' },
  { id: 'github', label: 'GitHub',  icon: 'ti-brand-github',        color: '#1D9E75', dot: '#1D9E75' },
  { id: 'jobs',   label: 'Jobs',    icon: 'ti-briefcase',           color: '#185FA5', dot: '#378ADD' },
  { id: 'news',   label: 'News',    icon: 'ti-news',                color: '#993C1D', dot: '#D85A30' },
  { id: 'learn',  label: 'Learn',   icon: 'ti-bulb',                color: '#3B6D11', dot: '#639922' },
];
```

---

## 9. Performance Notes

- **Lazy fetch** — only fetch a tab when the user visits it. Don't prefetch all tabs on load.
- **Parallel item fetching** — HN and Jobs require N+1 requests. Use `Promise.all` not sequential awaits.
- **Image lazy loading** — if memes or news thumbnails are added, use `loading="lazy"` on `<img>` tags.
- **Ticker performance** — use `requestAnimationFrame` + `transform: translateX` (not `left` or `margin`) for the scrolling ticker. Avoid layout thrashing.
- **Debounce keyboard** — `J/K` held down should not fire dozens of renders per second. Throttle to 100ms.
