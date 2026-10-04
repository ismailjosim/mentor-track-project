import { PAGE_SIZE } from './types';

export function StudentsTableSkeleton() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <tr key={`student-row-skeleton-${index}`}>
          <td className="px-4 py-3 w-10">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          </td>
          <td className="px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                <div className="h-3 w-44 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="space-y-2 w-28">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-1.5 w-28 rounded-full bg-muted animate-pulse" />
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-16 rounded bg-muted animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-16 rounded bg-muted animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </td>
          <td className="px-6 py-3">
            <div className="ml-auto h-8 w-20 rounded bg-muted animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}
