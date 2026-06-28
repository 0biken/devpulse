import { IconClock } from '@tabler/icons-react';

import logoUrl from '../assets/logo.png';

export function Header({ elapsed, isRunning }) {
  const formatTime = (ms) => {
    const totalS = Math.floor(ms / 1000);
    if (totalS < 60) return `${totalS}s`;
    return `${Math.floor(totalS / 60)}m ${totalS % 60}s`;
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[var(--dp-surface)] border-b border-[var(--dp-border)]">
      <div className="flex items-center gap-2">
        <img src={logoUrl} alt="DevPulse Logo" className="w-5 h-5 rounded-sm" />
        <span className="font-mono text-sm font-medium text-[var(--dp-green)] tracking-tight">DevPulse</span>
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--dp-green)] animate-pulse" />
        <span className="text-[11px] text-[var(--dp-hint)] ml-2">live</span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--dp-muted)]">
        <IconClock size={14} className={isRunning ? 'text-[var(--dp-amber)]' : 'text-[var(--dp-muted)]'} />
        <span>focus:</span>
        <span className="text-[var(--dp-amber)] font-medium">{formatTime(elapsed)}</span>
      </div>
    </header>
  );
}
