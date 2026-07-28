import { cn } from '@/shared/lib/cn';

export const Table = ({ className, containerClassName, ...props }) => (
  <div className={cn('overflow-hidden rounded-3xl border border-border/70 bg-card shadow-haze', containerClassName)}>
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  </div>
);

export const TableHeader = ({ className, ...props }) => (
  <thead className={cn('bg-muted/50 text-left', className)} {...props} />
);

export const TableBody = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr className={cn('border-b border-border/50 transition hover:bg-accent/30', className)} {...props} />
);

export const TableHead = ({ className, ...props }) => (
  <th className={cn('px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground', className)} {...props} />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 align-middle text-foreground', className)} {...props} />
);
