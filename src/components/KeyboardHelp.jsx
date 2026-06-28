import { useEffect } from 'react';

export function KeyboardHelp({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'J / ↓', action: 'Next card' },
    { key: 'K / ↑', action: 'Previous card' },
    { key: 'O / Enter', action: 'Open card URL' },
    { key: 'B', action: 'Bookmark / Unbookmark' },
    { key: 'R', action: 'Refresh current tab' },
    { key: 'Shift+H', action: 'Previous tab' },
    { key: 'Shift+L', action: 'Next tab' },
    { key: '?', action: 'Toggle keyboard help' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-[var(--dp-surface)] border border-[var(--dp-border)] rounded-xl shadow-2xl max-w-sm w-full p-6 text-[var(--dp-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-medium tracking-tight">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-[var(--dp-hint)] hover:text-[var(--dp-text)] transition-colors">
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex justify-between items-center text-sm">
              <span className="text-[var(--dp-muted)]">{action}</span>
              <kbd className="font-mono text-xs bg-[var(--dp-bg)] border border-[var(--dp-border)] px-2 py-1 rounded text-[var(--dp-text)] shadow-sm">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
