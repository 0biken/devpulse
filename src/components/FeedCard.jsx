import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { sanitize } from '../utils/sanitize';
import { TABS } from '../constants/tabs';
import { IconStar, IconStarFilled } from '@tabler/icons-react';

export function FeedCard({ item, tabId, isSeen, isBookmarked, isFocused, onSeen, onBookmark, onTagClick }) {
  const tab = TABS.find(t => t.id === tabId);

  const ref = useIntersectionObserver(() => {
    setTimeout(() => onSeen(item.id), 2000);
  });

  return (
    <a
      ref={ref}
      href={item.url || '#'}
      target={item.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!item.url) e.preventDefault();
        onSeen(item.id);
      }}
      className={`block relative p-3.5 mb-2 bg-[var(--dp-surface)] border rounded-lg border-l-2 transition-all duration-200 group ${
        isFocused ? 'ring-2 ring-[var(--dp-text)] border-[var(--dp-border-hover)]' : 'border-[var(--dp-border)] hover:border-[var(--dp-border-hover)]'
      } ${
        isSeen && !isFocused ? 'opacity-70 saturate-50' : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20'
      }`}
      style={{ borderLeftColor: tab.color }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          {item.badge && (
            <span 
              className="inline-block text-[10px] px-2 py-0.5 rounded-full mb-1.5 font-medium tracking-wide"
              style={{ backgroundColor: `${tab.color}15`, color: tab.color }}
            >
              {item.badge}
            </span>
          )}
          <h3 className="text-[13px] font-medium leading-relaxed text-[var(--dp-text)] group-hover:text-blue-400 transition-colors">
            {sanitize(item.title)}
          </h3>
          {item.description && (
            <p className="text-[11px] text-[var(--dp-muted)] mt-1.5 leading-snug line-clamp-2">
              {sanitize(item.description)}
            </p>
          )}
        </div>
        
        {item.stat && (
          <span className="font-mono text-[11px] text-[var(--dp-muted)] whitespace-nowrap mt-0.5">
            {item.stat}
          </span>
        )}
      </div>

      {item.meta?.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mt-2">
          {item.meta.map((m, i) => (
            <span key={i} className="text-[11px] text-[var(--dp-hint)] flex items-center gap-1">
              {m}
            </span>
          ))}
        </div>
      )}

      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {item.tags.slice(0, 4).map(t => (
            <button 
              key={t} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onTagClick) onTagClick(t);
              }}
              className="text-[10px] text-[var(--dp-hint)] hover:text-[var(--dp-text)] hover:border-[var(--dp-border-hover)] transition-colors bg-[var(--dp-bg)] px-2 py-0.5 rounded-full border border-[var(--dp-border)]"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBookmark(item);
        }}
        className="absolute bottom-3 right-3 text-[var(--dp-hint)] hover:text-yellow-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
      >
        {isBookmarked ? <IconStarFilled size={16} className="text-yellow-500" /> : <IconStar size={16} />}
      </button>
      
      {isBookmarked && (
        <div className="absolute top-3 right-3 opacity-100 group-hover:opacity-0 transition-opacity">
          <IconStarFilled size={14} className="text-yellow-500" />
        </div>
      )}
    </a>
  );
}
