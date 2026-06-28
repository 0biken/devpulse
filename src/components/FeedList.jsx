import { FeedCard } from './FeedCard';
import { Skeleton, ErrorState, EmptyState } from './States';
import { AdSlot } from './AdSlot';
import { useFeed } from '../hooks/useFeed';

export function FeedList({ tabId, feeds, dispatch, seen, bookmarks, onSeen, onBookmark, focusedIndex }) {
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

  return (
    <div className="p-2 flex flex-col overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
      {feed.items.map((item, i) => {
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
            />
            {showAd && <AdSlot id={`ad-slot-${i}`} />}
          </div>
        );
      })}
    </div>
  );
}
