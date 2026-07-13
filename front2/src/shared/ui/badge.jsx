import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const badgeVariants = cva('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide', {
  variants: {
    variant: {
      default: 'bg-primary/15 text-primary',
      secondary: 'bg-secondary text-secondary-foreground',
      outline: 'border border-border bg-transparent text-foreground',
      destructive: 'bg-destructive/15 text-destructive',
      success: 'bg-success/15 text-success',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const Badge = ({ className, variant, ...props }) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
