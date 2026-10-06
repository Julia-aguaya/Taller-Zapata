import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export const ShadcnCheckbox = ({ className, ...props }) => (
  <CheckboxPrimitive.Root className={cn('peer h-4 w-4 shrink-0 rounded border border-primary shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', className)} {...props}>
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current"><Check className="h-3.5 w-3.5" /></CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
