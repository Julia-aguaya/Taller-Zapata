import { cn } from '@/shared/lib/cn';
import { Card } from '@/shared/ui/card';

export const SectionCard = ({ className, ...props }) => (
  <Card className={cn('border-white/50 bg-card/90 shadow-haze', className)} {...props} />
);
