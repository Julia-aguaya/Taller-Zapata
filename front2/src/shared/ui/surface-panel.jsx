import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const surfacePanelVariants = cva('border', {
  variants: {
    tone: {
      default: 'border-border/60 bg-card text-card-foreground',
      muted: 'border-border/70 bg-background/75 text-foreground',
      subtle: 'border-border/60 bg-background/70 text-foreground',
      soft: 'border-border/70 bg-background/60 text-muted-foreground',
      danger: 'border-destructive/20 bg-destructive/5 text-destructive',
    },
    radius: {
      md: 'rounded-2xl',
      lg: 'rounded-3xl',
      xl: 'rounded-[28px]',
    },
    padding: {
      none: '',
      sm: 'px-4 py-3',
      md: 'p-4',
      lg: 'px-5 py-8',
    },
    borderStyle: {
      solid: '',
      dashed: 'border-dashed',
    },
    interactive: {
      true: 'transition hover:border-primary/30 hover:bg-background',
      false: '',
    },
  },
  defaultVariants: {
    tone: 'default',
    radius: 'md',
    padding: 'sm',
    borderStyle: 'solid',
    interactive: false,
  },
});

export const SurfacePanel = ({ className, tone, radius, padding, borderStyle, interactive, ...props }) => (
  <div
    className={cn(surfacePanelVariants({ tone, radius, padding, borderStyle, interactive }), className)}
    {...props}
  />
);
