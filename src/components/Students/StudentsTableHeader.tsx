import type { Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
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
            const isStudent = id === 'student';
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

            return (
              <th
                key={header.id}
                className={`py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                  isStudent
                    ? 'text-left px-6'
                    : isAction
                      ? 'text-right px-6'
                      : 'text-left px-4'
                }`}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
