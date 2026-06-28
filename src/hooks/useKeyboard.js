import { useEffect } from 'react';

export function useKeyboard({ onNext, onPrev, onOpen, onBookmark, onRefresh, onTabSwitch, onHelp, onSearchToggle }) {
  useEffect(() => {
    function handler(e) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSearchToggle?.();
        return;
      }

      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case 'j': case 'ArrowDown': e.preventDefault(); onNext(); break;
        case 'k': case 'ArrowUp':   e.preventDefault(); onPrev(); break;
        case 'o': case 'Enter':     e.preventDefault(); onOpen(); break;
        case 'b':                   e.preventDefault(); onBookmark(); break;
        case 'r':                   e.preventDefault(); onRefresh(); break;
        case 'H': case 'h':         if (e.shiftKey) { e.preventDefault(); onTabSwitch(-1); } break;
        case 'L': case 'l':         if (e.shiftKey) { e.preventDefault(); onTabSwitch(+1); } break;
        case '?':                   e.preventDefault(); onHelp(); break;
        default: break;
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext, onPrev, onOpen, onBookmark, onRefresh, onTabSwitch, onHelp, onSearchToggle]);
}
