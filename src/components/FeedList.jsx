import { FeedCard } from './FeedCard';
import { Skeleton, ErrorState, EmptyState } from './States';
import { AdSlot } from './AdSlot';
import { useFeed } from '../hooks/useFeed';

import { IconX } from '@tabler/icons-react';

export function FeedList({ tabId, feeds, filteredItems, dispatch, seen, bookmarks, onSeen, onBookmark, focusedIndex, searchQuery, activeTag, onTagClick, onClearFilters, onOpenInEditor }) {
  useFeed(tabId, dispatch);
  
  const feed = feeds[tabId];

  if (!feed || feed.status === 'loading') {
    return <div className="p-2"><Skeleton /></div>;
  }
  
  if (feed.status === 'error') {
    return (
      <div className="p-2">
        <ErrorState 
          message={feed.error} 
          onRetry={() => dispatch({ type: 'CLEAR', tabId })} 
        />
      </div>
    );
  }
  
  if (!feed.items?.length) {
    return <div className="p-2"><EmptyState /></div>;
  }

  const hasFilters = searchQuery || activeTag;

  return (
    <div className="p-2 flex flex-col h-full overflow-y-auto min-h-0">
      {hasFilters && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 bg-[var(--dp-border)] rounded-md text-sm text-[var(--dp-text)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--dp-muted)]">Filtering by:</span>
            {searchQuery && <span className="font-mono bg-[var(--dp-surface)] px-2 py-0.5 rounded">"{searchQuery}"</span>}
            {activeTag && <span className="font-mono text-[var(--dp-blue)] bg-[var(--dp-surface)] px-2 py-0.5 rounded">#{activeTag}</span>}
            <span className="text-[var(--dp-muted)] text-xs ml-2">({filteredItems.length} results)</span>
          </div>
          <button onClick={onClearFilters} className="text-[var(--dp-hint)] hover:text-[var(--dp-coral)] transition-colors flex items-center gap-1 text-xs">
            <IconX size={14} /> Clear
          </button>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="p-8 text-center text-[var(--dp-hint)]">No items match your filters.</div>
      ) : (
        filteredItems.map((item, i) => {
          const isFocused = i === focusedIndex;
          // Inject an AdSlot after every 5th item
          const showAd = (i + 1) % 5 === 0;

          return (
            <div key={item.id} id={`feed-item-${i}`}>
              <FeedCard
                item={item}
                tabId={tabId}
                isSeen={!!seen[item.id]}
                isBookmarked={bookmarks.some(b => b.id === item.id)}
                isFocused={isFocused}
                onSeen={onSeen}
                onBookmark={onBookmark}
                onTagClick={onTagClick}
                onOpenInEditor={onOpenInEditor}
              />
              {showAd && <AdSlot id={`ad-slot-${i}`} />}
            </div>
          );
        })
      )}
    </div>
  );
}
