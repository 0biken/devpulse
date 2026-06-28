import { useState, useReducer, useEffect } from 'react';
import { Header } from './components/Header';
import { Ticker } from './components/Ticker';
import { TabBar } from './components/TabBar';
import { FeedList } from './components/FeedList';
import { Footer } from './components/Footer';
import { KeyboardHelp } from './components/KeyboardHelp';
import { useTimer } from './hooks/useTimer';
import { usePersistence } from './hooks/usePersistence';
import { useKeyboard } from './hooks/useKeyboard';
import { TABS } from './constants/tabs';

const initialState = {};

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

export default function App() {
  const [activeTab, setActiveTab] = useState('hn');
  const [feeds, dispatch] = useReducer(feedReducer, initialState);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { seen, bookmarks, markSeen, toggleBookmark } = usePersistence();
  const { elapsed, isRunning } = useTimer();

  // Reset focus when tab changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [activeTab]);

  const activeFeed = feeds[activeTab]?.items || [];

  const scrollToFocused = (idx) => {
    const el = document.getElementById(`feed-item-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useKeyboard({
    onNext: () => {
      if (activeFeed.length === 0) return;
      setFocusedIndex(prev => {
        const next = Math.min(prev + 1, activeFeed.length - 1);
        scrollToFocused(next);
        return next;
      });
    },
    onPrev: () => {
      if (activeFeed.length === 0) return;
      setFocusedIndex(prev => {
        const next = Math.max(prev - 1, 0);
        scrollToFocused(next);
        return next;
      });
    },
    onOpen: () => {
      if (focusedIndex >= 0 && activeFeed[focusedIndex]) {
        const item = activeFeed[focusedIndex];
        if (item.url) {
          window.open(item.url, '_blank');
          markSeen(item.id);
        }
      }
    },
    onBookmark: () => {
      if (focusedIndex >= 0 && activeFeed[focusedIndex]) {
        toggleBookmark(activeFeed[focusedIndex]);
      }
    },
    onRefresh: () => dispatch({ type: 'CLEAR', tabId: activeTab }),
    onTabSwitch: (dir) => {
      const idx = TABS.findIndex(t => t.id === activeTab);
      const nextIdx = (idx + dir + TABS.length) % TABS.length;
      setActiveTab(TABS[nextIdx].id);
    },
    onHelp: () => setIsHelpOpen(prev => !prev)
  });

  return (
    <div id="dp-root" className="flex flex-col h-screen bg-[var(--dp-bg)] text-[var(--dp-text)] font-sans antialiased overflow-hidden selection:bg-[var(--dp-green)] selection:text-white relative">
      <Header elapsed={elapsed} isRunning={isRunning} />
      <Ticker feeds={feeds} />
      <TabBar tabs={TABS} active={activeTab} onSwitch={setActiveTab} feeds={feeds} />
      
      <main className="flex-1 overflow-hidden relative">
        <FeedList
          tabId={activeTab}
          feeds={feeds}
          dispatch={dispatch}
          seen={seen}
          bookmarks={bookmarks}
          onSeen={markSeen}
          onBookmark={toggleBookmark}
          focusedIndex={focusedIndex}
        />
      </main>
      
      <Footer tabId={activeTab} feeds={feeds} dispatch={dispatch} />
      
      <KeyboardHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
