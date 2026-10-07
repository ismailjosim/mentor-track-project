'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import type { StudentWithRelations } from '@/types';
import { getStatusBadgeClass, getLastAssignmentNumber } from '@/lib/ui-helpers';
import { PAGE_ROUTES } from '@/lib/constants';
import { StudentAvatar } from '@/components/Students/StudentAvatar';
import { Card, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FailingStudentsTableProps {
  students: StudentWithRelations[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export function FailingStudentsTable({
  students,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
  loading = false,
}: FailingStudentsTableProps) {
  const columns = useMemo<ColumnDef<StudentWithRelations>[]>(
    () => [
      {
        id: 'student',
        header: 'Student',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-3">
              <StudentAvatar name={s.name} size="sm" />
              <div>
                <p className="font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'progress',
        header: 'Last Done',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs font-medium">
            A-
            {String(getLastAssignmentNumber(row.original.lastCompletedAssignment)).padStart(2, '0')}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.currentStatus;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadgeClass(status!)}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: 'action',
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Link
              href={PAGE_ROUTES.STUDENT_DETAIL.replace(':id', row.original._id!)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Profile <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="overflow-hidden border border-border/80 shadow-xs">
      <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h2 className="font-semibold text-base">Students at Risk</h2>
        </div>
        <Badge variant="destructive" className="font-semibold">
          {students.length} students
        </Badge>
      </CardHeader>

      <Table className="min-w-120">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-xs uppercase tracking-wider font-semibold"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={`skeleton-${idx}`}>
                <TableCell className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-32 animate-pulse" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="h-4 bg-muted rounded w-12 animate-pulse" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="h-6 bg-muted rounded w-16 animate-pulse" />
                </TableCell>
                <TableCell className="px-6 py-3 text-right">
                  <div className="h-4 bg-muted rounded w-20 ml-auto animate-pulse" />
                </TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="px-6 py-10 text-center text-muted-foreground italic text-sm"
              >
                No students currently at risk.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {onPageChange && (
        <div className="px-6 py-3.5 border-t flex items-center justify-between bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            {totalCount > 0 && ` • ${totalCount} total students`}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
