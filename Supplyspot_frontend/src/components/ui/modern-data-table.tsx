import React, { useState, useMemo } from 'react';
import {
  Table as BaseTable,
  TableHeader,
  TableBody,
  TableHead,
  TableCell,
} from './table';
import { Checkbox } from './checkbox';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './dropdown-menu';
import { DraggableTableRow, DraggableTableHeader } from './draggable-table-row';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Search,
  Columns,
  Grid,
  List as ListIcon,
  Table as TableIcon,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from './utils';

// Column definition interface
export interface ColumnDef<T> {
  key: string;
  header: string | React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

// Table Props
export interface ModernDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  idKey: keyof T & string; // Key to extract row ID for selection / dragging
  title?: string; // Title on the left (e.g. "Goods Intake")
  searchPlaceholder?: string;
  searchKeys?: (keyof T & string)[]; // Columns to match against searching
  draggable?: boolean;
  onRowOrderChange?: (newData: T[]) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  extraActions?: React.ReactNode;
  exportEnabled?: boolean;
  onExport?: () => void;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
}

type ViewLayout = 'table' | 'list' | 'grid';

export function ModernDataTable<T>({
  data,
  columns,
  idKey,
  title,
  searchPlaceholder = "Search...",
  searchKeys = [],
  draggable = false,
  onRowOrderChange,
  selectable = false,
  onSelectionChange,
  extraActions,
  exportEnabled = false,
  onExport,
  rowsPerPageOptions = [5, 10, 20, 50],
  defaultRowsPerPage = 10,
}: ModernDataTableProps<T>) {
  // --- State Managers ---
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  );
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // --- DnD sensors setup ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid conflict with clicks / interactive elements
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Column Toggles ---
  const toggleColumnVisibility = (colKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(colKey)) {
      if (newVisible.size > 1) {
        newVisible.delete(colKey);
      }
    } else {
      newVisible.add(colKey);
    }
    setVisibleColumns(newVisible);
  };

  const filteredColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns.has(col.key));
  }, [columns, visibleColumns]);

  // --- Filtering (Search) ---
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) => {
      // If specific search keys are provided, query only those, else match all row values
      const targetKeys = searchKeys.length > 0 ? searchKeys : (Object.keys(row as object) as (keyof T & string)[]);
      return targetKeys.some((key) => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchKeys]);

  // --- Sorting ---
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const key = sortKey as keyof T;
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Handle simple string / number / date comparisons
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal);
      }
      return aVal < bVal ? -1 : 1;
    });

    return sortDirection === 'desc' ? sorted.reverse() : sorted;
  }, [filteredData, sortKey, sortDirection]);

  // --- Pagination Slice ---
  const totalRows = sortedData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIdx, startIdx + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const itemIds = useMemo(() => {
    return paginatedData.map((item) => String(item[idKey]));
  }, [paginatedData, idKey]);

  // Reset page when filtering / sorting changes size
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortKey, sortDirection]);

  // --- Row Selection Handlers ---
  const isAllSelected = paginatedData.length > 0 && paginatedData.every((row) => selectedIds.has(row[idKey] as any));
  
  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedIds);
    paginatedData.forEach((row) => {
      const id = row[idKey] as any;
      if (checked) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
    });
    setSelectedIds(newSelected);
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelected));
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelected));
    }
  };

  // --- Sorting Headers Toggler ---
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null); // Clear sorting on third click
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // --- DnD Order Change Handler ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onRowOrderChange) {
      const oldIndex = sortedData.findIndex((item) => String(item[idKey]) === String(active.id));
      const newIndex = sortedData.findIndex((item) => String(item[idKey]) === String(over.id));
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedData = arrayMove(sortedData, oldIndex, newIndex);
        onRowOrderChange(reorderedData);
      }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 p-5">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        {title && (
          <h2 className="text-xl font-medium text-slate-800 dark:text-slate-200 tracking-tight">
            {title}
          </h2>
        )}

        <div className="flex flex-wrap items-center gap-3 ml-auto">
          {/* Search Box */}
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-9.5 text-xs rounded-xl border-slate-200 focus-visible:ring-blue-500"
            />
          </div>

          {/* Columns Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9.5 gap-2 text-slate-600 rounded-xl px-3 border-slate-200">
                <Columns className="w-4 h-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Toggle Visibility</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleColumns.has(col.key)}
                  onCheckedChange={() => toggleColumnVisibility(col.key)}
                  className="text-xs"
                >
                  {typeof col.header === 'string' ? col.header : col.key}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Segment Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/40">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200",
                viewLayout === 'table' && "bg-white dark:bg-slate-900 shadow-sm text-blue-600 font-medium"
              )}
              onClick={() => setViewLayout('table')}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200",
                viewLayout === 'list' && "bg-white dark:bg-slate-900 shadow-sm text-blue-600 font-medium"
              )}
              onClick={() => setViewLayout('list')}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200",
                viewLayout === 'grid' && "bg-white dark:bg-slate-900 shadow-sm text-blue-600 font-medium"
              )}
              onClick={() => setViewLayout('grid')}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions & Export Button */}
          {extraActions}

          {exportEnabled && (
            <Button
              variant="outline"
              size="sm"
              className="h-9.5 gap-2 text-slate-700 bg-white border-slate-200 rounded-xl px-3 hover:bg-slate-50"
              onClick={onExport}
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* 2. Main Layout Render */}
      <div className="w-full">
        {totalRows === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 rounded-xl">
            <span className="text-sm font-medium">No rows found matching filter.</span>
          </div>
        ) : viewLayout === 'table' ? (
          /* TABLE VIEW LAYOUT */
          <div className="border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden">
            <DndContext
              collisionDetection={closestCenter}
              sensors={draggable ? sensors : undefined}
              onDragEnd={draggable ? handleDragEnd : undefined}
            >
              <BaseTable className="w-full text-xs">
                <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  <DraggableTableHeader
                    showDragHandle={draggable}
                    allSelected={isAllSelected}
                    onSelectAll={selectable ? handleSelectAll : undefined}
                  >
                    {filteredColumns.map((col) => (
                      <TableHead
                        key={col.key}
                        className={cn(
                          "py-3 font-medium text-slate-500 tracking-wider select-none",
                          col.align === 'center' && "text-center",
                          col.align === 'right' && "text-right",
                          col.className
                        )}
                      >
                        {col.sortable ? (
                          <Button
                            variant="ghost"
                            onClick={() => handleSort(col.key)}
                            className="h-auto p-0 hover:bg-transparent font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>{col.header}</span>
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            {sortKey === col.key && (
                              sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        ) : (
                          col.header
                        )}
                      </TableHead>
                    ))}
                  </DraggableTableHeader>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100/60 dark:divide-slate-800">
                  <SortableContext
                    items={draggable ? itemIds : []}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedData.map((row, rIdx) => {
                      const rowId = row[idKey] as any;
                      const isSelected = selectedIds.has(rowId);

                      return (
                        <DraggableTableRow
                          key={String(rowId)}
                          id={String(rowId)}
                          showDragHandle={draggable}
                          isSelected={isSelected}
                          onSelect={selectable ? (checked) => handleSelectRow(rowId, checked) : undefined}
                          className="hover:bg-slate-50/50 group"
                        >
                          {filteredColumns.map((col) => (
                            <TableCell
                              key={`${String(rowId)}-${col.key}`}
                              className={cn(
                                "py-3 px-2 font-medium text-slate-700 dark:text-slate-300",
                                col.align === 'center' && "text-center",
                                col.align === 'right' && "text-right",
                                col.className
                              )}
                            >
                              {col.render ? col.render(row, rIdx) : String(row[col.key as keyof T] ?? '')}
                            </TableCell>
                          ))}
                        </DraggableTableRow>
                      );
                    })}
                  </SortableContext>
                </TableBody>
              </BaseTable>
            </DndContext>
          </div>
        ) : viewLayout === 'grid' ? (
          /* GRID VIEW LAYOUT */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedData.map((row, rIdx) => {
              const rowId = row[idKey] as any;
              return (
                <div
                  key={String(rowId)}
                  className="bg-white border border-slate-150 rounded-2xl p-5 hover:shadow-md transition-shadow relative space-y-4"
                >
                  <div className="flex items-center gap-3">
                    {selectable && (
                      <Checkbox
                        checked={selectedIds.has(rowId)}
                        onCheckedChange={(checked) => handleSelectRow(rowId, !!checked)}
                      />
                    )}
                    <span className="text-xs font-medium text-slate-500">ID: {String(rowId)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 pt-3">
                    {filteredColumns.map((col) => (
                      <div key={col.key} className="flex flex-col gap-1">
                        <span className="text-slate-400 font-medium">{typeof col.header === 'string' ? col.header : col.key}</span>
                        <div className="font-medium text-slate-800">
                          {col.render ? col.render(row, rIdx) : String(row[col.key as keyof T] ?? '')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW LAYOUT */
          <div className="space-y-3">
            {paginatedData.map((row, rIdx) => {
              const rowId = row[idKey] as any;
              return (
                <div
                  key={String(rowId)}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-150 rounded-xl hover:bg-slate-50/40 gap-4"
                >
                  <div className="flex items-center gap-3">
                    {selectable && (
                      <Checkbox
                        checked={selectedIds.has(rowId)}
                        onCheckedChange={(checked) => handleSelectRow(rowId, !!checked)}
                      />
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {filteredColumns.slice(0, 4).map((col) => (
                        <div key={col.key} className="flex flex-col text-xs">
                          <span className="text-slate-400 font-medium">{typeof col.header === 'string' ? col.header : col.key}</span>
                          <div className="font-medium text-slate-800 mt-0.5">
                            {col.render ? col.render(row, rIdx) : String(row[col.key as keyof T] ?? '')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {filteredColumns.slice(4).length > 0 && (
                    <div className="flex flex-wrap gap-4 text-xs shrink-0 self-end md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                      {filteredColumns.slice(4).map((col) => (
                        <div key={col.key} className="flex flex-col items-end text-xs">
                          <span className="text-slate-400 font-medium">{typeof col.header === 'string' ? col.header : col.key}</span>
                          <div className="font-medium text-slate-800 mt-0.5">
                            {col.render ? col.render(row, rIdx) : String(row[col.key as keyof T] ?? '')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Bottom Pagination Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 dark:border-slate-800 pt-4 gap-4 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(value) => {
              setRowsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px] bg-white text-slate-700 border border-slate-200 rounded-lg">
              <SelectValue placeholder={String(rowsPerPage)} />
            </SelectTrigger>
            <SelectContent>
              {rowsPerPageOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span>
            {totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}-
            {Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows}
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
