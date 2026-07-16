import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

interface UseDragAndSelectOptions<T extends { id: string | number }> {
  items: T[];
  onReorder?: (items: T[]) => void;
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
}

export function useDragAndSelect<T extends { id: string | number }>({
  items,
  onReorder,
  onSelectionChange,
}: UseDragAndSelectOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [draggedItem, setDraggedItem] = useState<T | null>(null);

  const handleSelectionChange = useCallback((id: string | number, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      onSelectionChange?.(newSet);
      return newSet;
    });
  }, [onSelectionChange]);

  const handleSelectAll = useCallback((selectAll: boolean, allIds: (string | number)[]) => {
    setSelectedIds((prev) => {
      const newSet = selectAll ? new Set(allIds) : new Set();
      onSelectionChange?.(newSet);
      return newSet;
    });
  }, [onSelectionChange]);

  const handleDragEnd = useCallback((activeId: string | number, overId: string | number) => {
    if (activeId !== overId) {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === overId);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder?.(newItems);
    }
    setDraggedItem(null);
  }, [items, onReorder]);

  const isSelected = useCallback((id: string | number) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.(new Set());
  }, [onSelectionChange]);

  return {
    selectedIds,
    draggedItem,
    setDraggedItem,
    handleSelectionChange,
    handleSelectAll,
    handleDragEnd,
    isSelected,
    clearSelection,
  };
}
