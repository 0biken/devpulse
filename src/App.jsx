import { useState, useReducer, useEffect } from 'react';
import { Header } from './components/Header';
import { Ticker } from './components/Ticker';
import { TabBar } from './components/TabBar';
import { FeedList } from './components/FeedList';
import { Footer } from './components/Footer';
import { KeyboardHelp } from './components/KeyboardHelp';
import { SearchPalette } from './components/SearchPalette';
import { SettingsModal } from './components/SettingsModal';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const { seen, bookmarks, markSeen, toggleBookmark } = usePersistence();
  const { elapsed, isRunning } = useTimer();

  // Reset focus and filters when tab changes
  useEffect(() => {
    setFocusedIndex(-1);
    setSearchQuery('');
    setActiveTag('');
  }, [activeTab]);

  const activeFeed = feeds[activeTab]?.items || [];

  const filteredFeed = activeFeed.filter(item => {
    if (activeTag && !item.tags?.includes(activeTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const scrollToFocused = (idx) => {
    const el = document.getElementById(`feed-item-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useKeyboard({
    onSearchToggle: () => setIsSearchOpen(prev => !prev),
    onNext: () => {
      if (filteredFeed.length === 0) return;
      setFocusedIndex(prev => {
        const next = Math.min(prev + 1, filteredFeed.length - 1);
        scrollToFocused(next);
        return next;
      });
    },
    onPrev: () => {
      if (filteredFeed.length === 0) return;
      setFocusedIndex(prev => {
        const next = Math.max(prev - 1, 0);
        scrollToFocused(next);
        return next;
      });
    },
    onOpen: () => {
      if (focusedIndex >= 0 && filteredFeed[focusedIndex]) {
        const item = filteredFeed[focusedIndex];
        if (item.url) {
          window.open(item.url, '_blank');
          markSeen(item.id);
        }
      }
    },
    onBookmark: () => {
      if (focusedIndex >= 0 && filteredFeed[focusedIndex]) {
        toggleBookmark(filteredFeed[focusedIndex]);
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
      <Header elapsed={elapsed} isRunning={isRunning} onSettingsClick={() => setIsSettingsOpen(true)} />
      <Ticker feeds={feeds} />
      <TabBar tabs={TABS} active={activeTab} onSwitch={setActiveTab} feeds={feeds} />
      
      <main className="flex-1 overflow-hidden relative">
        <FeedList
          tabId={activeTab}
          feeds={feeds}
          filteredItems={filteredFeed}
          dispatch={dispatch}
          seen={seen}
          bookmarks={bookmarks}
          onSeen={markSeen}
          onBookmark={toggleBookmark}
          focusedIndex={focusedIndex}
          searchQuery={searchQuery}
          activeTag={activeTag}
          onTagClick={setActiveTag}
          onClearFilters={() => {
            setSearchQuery('');
            setActiveTag('');
          }}
        />
      </main>
      
      <Footer tabId={activeTab} feeds={feeds} dispatch={dispatch} />
      
      <KeyboardHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SearchPalette 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        query={searchQuery} 
        setQuery={setSearchQuery} 
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
