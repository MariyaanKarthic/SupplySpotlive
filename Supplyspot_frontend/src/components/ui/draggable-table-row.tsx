import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TableRow, TableCell, TableHead } from './table';
import { Checkbox } from './checkbox';
import { cn } from '@/lib/utils';

interface DraggableTableRowProps {
  id: string | number;
  children: React.ReactNode;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  showDragHandle?: boolean;
  className?: string;
}

export function DraggableTableRow({
  id,
  children,
  isSelected = false,
  onSelect,
  showDragHandle = true,
  className,
}: DraggableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isSelected && 'bg-muted/50',
        isDragging && 'opacity-50 bg-muted',
        className
      )}
    >
      {showDragHandle && (
        <TableCell className="w-10 min-w-[40px] max-w-[40px] p-2 text-center sticky left-0 z-30 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded inline-flex items-center justify-center"
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
        </TableCell>
      )}
      {onSelect && (
        <TableCell className="w-10 min-w-[40px] max-w-[40px] p-2 text-center sticky left-10 z-30 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select row ${id}`}
          />
        </TableCell>
      )}
      {children}
    </TableRow>
  );
}

interface DraggableTableHeaderProps {
  showDragHandle?: boolean;
  allSelected?: boolean;
  onSelectAll?: (selected: boolean) => void;
  children?: React.ReactNode;
}

export function DraggableTableHeader({
  showDragHandle = true,
  allSelected = false,
  onSelectAll,
  children,
}: DraggableTableHeaderProps) {
  return (
    <TableRow>
      {showDragHandle && (
        <TableHead className="w-10 min-w-[40px] max-w-[40px] p-2 text-center sticky left-0 z-30 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <span className="sr-only">Drag</span>
        </TableHead>
      )}
      {onSelectAll && (
        <TableHead className="w-12 p-4 sticky left-8 z-30 bg-inherit">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            aria-label="Select all rows"
          />
        </TableHead>
      )}
      {children}
    </TableRow>
  );
}
