import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/components/ui/utils';

/** Label, control, then either the error or a hint underneath, with consistent spacing. */
export function FormField({ label, htmlFor, required, hint, error, className, children }: {
  label: React.ReactNode; htmlFor?: string; required?: boolean; hint?: React.ReactNode; error?: React.ReactNode | null;
  className?: string; children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
      </Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function FieldError({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn('flex items-start gap-1 text-xs font-medium text-destructive', className)}>
      <AlertCircle className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Form-level error shown next to the submit buttons: a tinted box with an icon so it is hard to miss. */
export function FormAlert({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn('flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive', className)}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
