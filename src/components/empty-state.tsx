export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center">
      <div className="text-lg font-semibold text-[var(--text-primary)]">{title}</div>
      <div className="mt-2 text-sm text-[var(--text-secondary)]">{description}</div>
    </div>
  );
}
