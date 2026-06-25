import { IconAlertTriangle, IconInbox } from '@tabler/icons-react';

export function Skeleton() {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-3.5 mb-2 bg-[var(--dp-surface)] border border-[var(--dp-border)] rounded-lg">
          <div className="w-16 h-3 bg-[var(--dp-border)] rounded-full mb-2.5 animate-pulse opacity-50" />
          <div className="w-[90%] h-3.5 bg-[var(--dp-border)] rounded mb-2 animate-pulse opacity-50" />
          <div className="w-[50%] h-3 bg-[var(--dp-border)] rounded animate-pulse opacity-50" />
        </div>
      ))}
    </>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--dp-surface)] rounded-lg border border-[var(--dp-border)] my-2">
      <IconAlertTriangle size={28} className="text-[var(--dp-coral)] mb-3" />
      <p className="text-[13px] text-[var(--dp-text)] font-medium mb-1">Could not load this feed</p>
      <p className="text-[11px] text-[var(--dp-hint)] mb-4 max-w-[250px] truncate">{message}</p>
      <button 
        onClick={onRetry}
        className="text-[11px] bg-[var(--dp-border)] hover:bg-[var(--dp-border-hover)] text-[var(--dp-text)] px-4 py-1.5 rounded transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--dp-muted)]">
      <IconInbox size={32} className="mb-3 opacity-50" />
      <p className="text-[13px]">No items found</p>
    </div>
  );
}
