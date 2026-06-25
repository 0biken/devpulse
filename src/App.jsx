import { useState, useReducer } from 'react';
import { Header } from './components/Header';
import { Ticker } from './components/Ticker';
import { TabBar } from './components/TabBar';
import { FeedList } from './components/FeedList';
import { Footer } from './components/Footer';
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
  const { seen, bookmarks, markSeen, toggleBookmark } = usePersistence();
  const { elapsed, isRunning } = useTimer();

  useKeyboard({
    onNext: () => { /* implement scroll next */ },
    onPrev: () => { /* implement scroll prev */ },
    onOpen: () => { /* open top visible item */ },
    onBookmark: () => { /* toggle bookmark on top visible */ },
    onRefresh: () => dispatch({ type: 'CLEAR', tabId: activeTab }),
    onTabSwitch: (dir) => {
      const idx = TABS.findIndex(t => t.id === activeTab);
      const nextIdx = (idx + dir + TABS.length) % TABS.length;
      setActiveTab(TABS[nextIdx].id);
    },
    onHelp: () => { /* toggle help */ }
  });

  return (
    <div id="dp-root" className="flex flex-col h-screen bg-[var(--dp-bg)] text-[var(--dp-text)] font-sans antialiased overflow-hidden selection:bg-[var(--dp-green)] selection:text-white">
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
        />
      </main>
      
      <Footer tabId={activeTab} feeds={feeds} dispatch={dispatch} />
    </div>
  );
}
