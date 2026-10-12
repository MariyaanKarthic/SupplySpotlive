import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import { StatusTone, humanizeStatus, statusClass, toneForStatus } from './status';

/** A status pill using the shared colour language. Pass `tone` to override the guess from `status`. */
export function StatusBadge({ status, label, tone, className }: {
  status: string; label?: React.ReactNode; tone?: StatusTone; className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(statusClass(tone ?? toneForStatus(status)), className)}>
      {label ?? humanizeStatus(status)}
    </Badge>
  );
}
