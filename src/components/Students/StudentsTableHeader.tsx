import type { Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { StudentWithRelations } from '@/types';

interface StudentsTableHeaderProps {
  table: Table<StudentWithRelations>;
  allPageSelected: boolean;
  somePageSelected: boolean;
  onSelectAll: () => void;
}

export function StudentsTableHeader({
  table,
  allPageSelected,
  somePageSelected,
  onSelectAll,
}: StudentsTableHeaderProps) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="border-b bg-muted/10">
          {headerGroup.headers.map((header) => {
            const id = header.id;
            const isSelect = id === 'select';
            const isStudent = id === 'student' || id === 'name';
            const isAction = id === 'action';

            if (isSelect) {
              return (
                <th key={header.id} className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    aria-label="Select all students on this page"
                    id="select-all-students"
                  />
                </th>
              );
            }

            const canSort = header.column.getCanSort();
            const isSorted = header.column.getIsSorted();

            return (
              <th
                key={header.id}
                className={`py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none ${
                  isStudent ? 'text-left px-6' : isAction ? 'text-right px-6' : 'text-left px-4'
                }`}
              >
                {header.isPlaceholder ? null : canSort ? (
                  <button
                    type="button"
                    onClick={header.column.getToggleSortingHandler()}
                    className={`inline-flex items-center gap-1.5 hover:text-foreground transition-colors group cursor-pointer ${
                      isSorted ? 'text-primary font-bold' : ''
                    }`}
                    title={
                      isSorted === 'asc'
                        ? 'Sorted ascending (click to sort descending)'
                        : isSorted === 'desc'
                          ? 'Sorted descending (click to clear sort)'
                          : 'Click to sort'
                    }
                  >
                    <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    {isSorted === 'asc' ? (
                      <ArrowUp className="size-3.5 text-primary shrink-0" />
                    ) : isSorted === 'desc' ? (
                      <ArrowDown className="size-3.5 text-primary shrink-0" />
                    ) : (
                      <ArrowUpDown className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />
                    )}
                  </button>
                ) : (
                  <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
