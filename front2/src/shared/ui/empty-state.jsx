import { Card } from '@/shared/ui/card';

export const EmptyState = ({ title, description }) => (
  <Card className="border-dashed border-border/80 bg-card/90 p-10 text-center shadow-haze">
    <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
    <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">{description}</p>
  </Card>
);
