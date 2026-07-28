import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const iconFrameVariants = cva('flex h-11 w-11 items-center justify-center rounded-2xl', {
  variants: {
    tone: {
      default: 'bg-primary/10 text-primary',
      success: 'bg-success/10 text-success',
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

export const IconFrame = ({ className, tone, ...props }) => (
  <div className={cn(iconFrameVariants({ tone }), className)} {...props} />
);
