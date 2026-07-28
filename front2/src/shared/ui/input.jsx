import { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

export const Input = forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20',
      className,
    )}
    {...props}
  />
));

Input.displayName = 'Input';
