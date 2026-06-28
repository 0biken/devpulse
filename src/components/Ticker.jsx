export function Ticker({ feeds }) {
  // Aggregate top items across all fetched feeds
  const items = Object.values(feeds)
    .flatMap(f => f.items || [])
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);

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
    <div className="flex h-6 items-center overflow-hidden bg-[var(--dp-bg)] border-b border-[var(--dp-border)] relative w-full">
      <div className="flex whitespace-nowrap animate-ticker w-max hover:[animation-play-state:paused]">
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
