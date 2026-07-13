import { cn } from '@/shared/lib/cn';

export const Select = ({ className, children, ...props }) => (
  <select
    className={cn(
      'flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70',
      className,
    )}
    {...props}
  >
    {children}
  </select>
);
