export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-16 text-sm text-muted-foreground" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      {label}
    </div>
  );
}
