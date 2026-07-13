export const FullScreenLoader = ({ label, compact = false }) => (
  <div className={compact ? 'flex min-h-[40vh] items-center justify-center' : 'flex min-h-screen items-center justify-center bg-background'}>
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
);
