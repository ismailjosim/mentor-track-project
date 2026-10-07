'use client';

import Link from 'next/link';
import { Phone, ChevronRight, CheckCircle, Clock, AlertCircle, ChevronLeft } from 'lucide-react';
import type { StudentWithRelations } from '@/types';
import { PAGE_ROUTES } from '@/lib/constants';
import { StudentAvatar } from '@/components/Students/StudentAvatar';
import { getStatusBadgeClass } from '@/lib/ui-helpers';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CallQueueProps {
  students: StudentWithRelations[];
  onRefresh?: () => void;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export function CallQueue({
  students,
  onRefresh,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
  loading = false,
}: CallQueueProps) {
  const getPriorityIcon = (status: string) => {
    switch (status) {
      case 'Dropped':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'At Risk':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'Behind':
        return <Clock className="w-4 h-4 text-info" />;
      default:
        return null;
    }
  };

  const getDaysSinceContact = (lastContactedAt: string | Date | null): string => {
    if (!lastContactedAt) return 'Never';
    const date = new Date(lastContactedAt);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden border border-border/80 shadow-xs">
      <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2 text-warning">
            <Phone className="w-4 h-4" />
            <h2 className="font-semibold text-foreground text-base">Call Queue</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Students needing outreach calls.</p>
        </div>
        <Badge variant="outline" className="font-semibold">
          {totalCount > 0 ? totalCount : students.length}
        </Badge>
      </CardHeader>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-32 animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : students.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground italic">
            Queue is empty! 🎉
          </div>
        ) : (
          students.map((s) => (
            <div
              key={s._id}
              className="px-5 py-4 hover:bg-muted/40 transition-colors flex items-center justify-between group border-l-4 border-l-transparent hover:border-l-primary"
            >
              <Link
                href={PAGE_ROUTES.STUDENT_DETAIL.replace(':id', s._id!)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="shrink-0">
                  <StudentAvatar name={s.name} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate text-foreground">{s.name}</p>
                    {getPriorityIcon(s.currentStatus!)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {s.phone || 'No phone'}
                    </p>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${getStatusBadgeClass(s.currentStatus!)}`}
                    >
                      {s.currentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last contact: {getDaysSinceContact(s.lastContactedAt ?? null)}
                  </p>
                </div>
              </Link>
              <Link
                href={PAGE_ROUTES.STUDENT_DETAIL.replace(':id', s._id!)}
                className="ml-2 shrink-0"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-3.5 border-t space-y-2 bg-muted/20">
        {onPageChange && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b">
            <span className="text-xs text-muted-foreground">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={onRefresh} className="w-full gap-2">
          <CheckCircle className="w-4 h-4" />
          Refresh Queue
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          {totalCount > 0
            ? `${totalCount} student${totalCount !== 1 ? 's' : ''} in queue`
            : `${students.length} student${students.length !== 1 ? 's' : ''} on this page`}
        </p>
      </div>
    </Card>
  );
}
