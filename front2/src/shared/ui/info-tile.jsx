import { cn } from '@/shared/lib/cn';
import { SurfacePanel } from '@/shared/ui/surface-panel';

export const InfoTile = ({
  label,
  value,
  icon: Icon,
  className,
  labelClassName,
  valueClassName,
  tone,
  ...props
}) => (
  <SurfacePanel tone={tone} className={className} {...props}>
    {Icon ? (
      <div className={cn('flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground', labelClassName)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
    ) : (
      <p className={cn('text-xs uppercase tracking-[0.16em] text-muted-foreground', labelClassName)}>{label}</p>
    )}
    <p className={cn('mt-2 text-sm font-medium text-foreground', valueClassName)}>{value}</p>
  </SurfacePanel>
);
