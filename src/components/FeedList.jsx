import { FeedCard } from './FeedCard';
import { Skeleton, ErrorState, EmptyState } from './States';
import { useFeed } from '../hooks/useFeed';

export function FeedList({ tabId, feeds, dispatch, seen, bookmarks, onSeen, onBookmark }) {
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
      {feed.items.map(item => (
        <FeedCard
          key={item.id}
          item={item}
          tabId={tabId}
          isSeen={!!seen[item.id]}
          isBookmarked={bookmarks.some(b => b.id === item.id)}
          onSeen={onSeen}
          onBookmark={onBookmark}
        />
      ))}
    </div>
  );
}
