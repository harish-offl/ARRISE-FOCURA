export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-lg font-bold text-white shadow-sm">
        {compact ? "F" : "FO"}
      </div>
      {!compact ? (
        <div>
          <div className="text-xl font-semibold tracking-tight">FOCURA</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Own Your Focus
          </div>
        </div>
      ) : null}
    </div>
  );
}
