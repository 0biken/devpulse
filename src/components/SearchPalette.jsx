import { useEffect, useRef } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';

export function SearchPalette({ isOpen, onClose, query, setQuery }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure render before focus
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-[var(--dp-surface)] border border-[var(--dp-border)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--dp-border)]">
          <IconSearch className="text-[var(--dp-muted)] mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-[var(--dp-text)] placeholder-[var(--dp-hint)] text-lg"
            placeholder="Search active feed... (press Esc to close)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--dp-hint)] hover:text-[var(--dp-text)]">
              <IconX size={18} />
            </button>
          )}
        </div>
        
        {query && (
          <div className="px-4 py-2 bg-[#1a1a1e] border-b border-[var(--dp-border)] flex items-center justify-between text-xs text-[var(--dp-hint)]">
            <span>Filtering current tab</span>
            <span><kbd className="bg-[var(--dp-border)] px-1 rounded mr-1">Enter</kbd> or <kbd className="bg-[var(--dp-border)] px-1 rounded">↓</kbd> to view</span>
          </div>
        )}
      </div>
    </div>
  );
}
