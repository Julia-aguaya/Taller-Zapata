import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export const ShadcnSelect = SelectPrimitive.Root;
export const ShadcnSelectValue = SelectPrimitive.Value;

export const ShadcnSelectTrigger = ({ className, children, ...props }) => (
  <SelectPrimitive.Trigger className={cn('flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70', className)} {...props}>
    {children}
    <SelectPrimitive.Icon asChild><ChevronDown className="h-4 w-4 opacity-50" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

export const ShadcnSelectContent = ({ className, children, ...props }) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content className={cn('z-50 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-haze', className)} {...props}>
      <SelectPrimitive.ScrollUpButton className="flex h-6 cursor-default items-center justify-center"><ChevronUp className="h-4 w-4" /></SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex h-6 cursor-default items-center justify-center"><ChevronDown className="h-4 w-4" /></SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

export const ShadcnSelectItem = ({ className, children, ...props }) => (
  <SelectPrimitive.Item className={cn('relative flex h-9 cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground', className)} {...props}>
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="h-4 w-4" /></SelectPrimitive.ItemIndicator></span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);
