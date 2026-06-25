import { useEffect, useRef } from 'react';

export function Ticker({ feeds }) {
  const containerRef = useRef(null);
  
  // Aggregate top items across all fetched feeds
  const items = Object.values(feeds)
    .flatMap(f => f.items || [])
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);

  useEffect(() => {
    if (!items.length || !containerRef.current) return;
    
    let x = 0;
    let animationFrameId;
    const el = containerRef.current;
    
    // Total width of one set of items
    const totalW = el.scrollWidth / 2;
    
    const tick = () => {
      x -= 0.5;
      if (Math.abs(x) >= totalW) x = 0;
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      animationFrameId = requestAnimationFrame(tick);
    };
    
    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [items.length]);

  if (!items.length) {
    return (
      <div className="flex h-6 items-center overflow-hidden bg-[var(--dp-bg)] border-b border-[var(--dp-border)]">
        <span className="text-[11px] font-mono text-[var(--dp-hint)] px-4">
          ⟨/⟩ waiting for live data...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-6 items-center overflow-hidden bg-[var(--dp-bg)] border-b border-[var(--dp-border)] relative">
      <div className="flex whitespace-nowrap will-change-transform" ref={containerRef}>
        {[...items, ...items].map((i, idx) => (
          <span 
            key={`${i.id}-${idx}`} 
            className="text-[11px] font-mono text-[var(--dp-hint)] px-5 border-r border-[var(--dp-border)] flex items-center gap-2 hover:text-[var(--dp-text)] transition-colors cursor-default"
          >
            {i.stat && <span className="text-[var(--dp-amber)]">{i.stat.split(' ')[0]}</span>}
            {i.title.slice(0, 50)}{i.title.length > 50 ? '…' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
