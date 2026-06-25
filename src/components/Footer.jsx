import { IconRefresh } from '@tabler/icons-react';

export function Footer({ tabId, feeds, dispatch }) {
  const feed = feeds[tabId];
  const count = feed?.items?.length || 0;
  
  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-[var(--dp-border)] bg-[var(--dp-surface)]">
      <span className="text-[11px] text-[var(--dp-hint)]">
        {count} items &middot; synced just now
      </span>
      <button 
        onClick={() => dispatch({ type: 'CLEAR', tabId })}
        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 text-[var(--dp-muted)] border border-[var(--dp-border)] rounded hover:bg-[var(--dp-bg)] transition-colors"
      >
        <IconRefresh size={12} />
        refresh
      </button>
    </footer>
  );
}
