import { cn } from '@/shared/lib/cn';

export const Card = ({ className, ...props }) => (
  <div className={cn('rounded-[28px] border border-border/60 bg-card text-card-foreground', className)} {...props} />
);
