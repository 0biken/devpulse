export function AdSlot({ id }) {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center bg-[var(--dp-bg)] border border-dashed border-[var(--dp-border)] rounded-lg p-4 mb-2 min-h-[90px]"
    >
      <span className="text-[10px] uppercase tracking-wider text-[var(--dp-hint)] font-medium mb-1">Advertisement</span>
      <span className="text-[11px] text-[var(--dp-muted)] text-center max-w-[200px]">
        (AdSense space reserved. Waiting for account approval.)
      </span>
    </div>
  );
}
