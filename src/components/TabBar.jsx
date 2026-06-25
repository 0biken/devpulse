import * as TablerIcons from '@tabler/icons-react';

export function TabBar({ tabs, active, onSwitch, feeds }) {
  return (
    <div className="flex overflow-x-auto gap-1 px-3 py-1.5 bg-[var(--dp-surface)] border-b border-[var(--dp-border)] scrollbar-hide">
      {tabs.map(tab => {
        const Icon = TablerIcons[tab.icon.replace(/-./g, x => x[1].toUpperCase()).replace('ti', 'Icon')];
        const isActive = active === tab.id;
        const hasData = feeds[tab.id]?.items?.length > 0;
        
        return (
          <button
            key={tab.id}
            onClick={() => onSwitch(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-all duration-200 ${
              isActive 
                ? 'bg-[var(--dp-bg)] text-[var(--dp-text)] font-medium shadow-sm' 
                : 'text-[var(--dp-muted)] hover:bg-[var(--dp-bg)] hover:text-[var(--dp-text)]'
            }`}
          >
            {Icon && <Icon size={14} style={{ color: tab.color }} />}
            {tab.label}
            <div 
              className="w-1.5 h-1.5 rounded-full transition-opacity duration-300"
              style={{ 
                backgroundColor: tab.dot, 
                opacity: hasData ? 1 : 0.2 
              }} 
            />
          </button>
        );
      })}
    </div>
  );
}
