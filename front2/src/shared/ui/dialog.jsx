import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const Dialog = ({ open, onClose, title, description, children, scrollable = false }) => {
  const dialogRef = useRef(null);
  const previouslyFocusedElement = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previouslyFocusedElement.current = document.activeElement;
    const initialFocusTarget = dialogRef.current?.querySelector('[data-dialog-initial-focus]') ?? dialogRef.current;
    initialFocusTarget?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocusedElement.current?.focus?.();
    };
  }, [open]);

  const handleKeyDown = (event) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = dialogRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusableElements?.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex="-1" onKeyDown={handleKeyDown} className={`w-full max-w-xl rounded-[28px] border border-border bg-card p-6 shadow-haze ${scrollable ? 'flex max-h-[calc(100dvh-2rem)] flex-col' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id={titleId} className="text-xl font-semibold tracking-tight">{title}</h3>
            {description ? <p id={descriptionId} className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" size="sm" aria-label="Cerrar diálogo" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className={`mt-5 ${scrollable ? 'min-h-0 flex-1 overflow-y-auto pr-1' : ''}`}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};
