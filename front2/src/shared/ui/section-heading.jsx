import { cn } from '@/shared/lib/cn';

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  actions,
  className,
  contentClassName,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
  align = 'start',
}) => (
  <div
    className={cn(
      'flex flex-col gap-3 md:flex-row md:justify-between',
      align === 'center' ? 'md:items-center' : 'md:items-start',
      className,
    )}
  >
    <div className={cn('min-w-0', contentClassName)}>
      {eyebrow ? (
        <p className={cn('text-xs uppercase tracking-[0.24em] text-muted-foreground', eyebrowClassName)}>{eyebrow}</p>
      ) : null}
      <h3 className={cn('mt-2 text-2xl font-semibold tracking-tight', titleClassName)}>{title}</h3>
      {description ? <p className={cn('mt-2 text-sm text-muted-foreground', descriptionClassName)}>{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);
