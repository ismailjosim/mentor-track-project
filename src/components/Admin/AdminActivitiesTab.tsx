import { PhoneCall } from 'lucide-react';
import type { ActivityItem } from './admin.types';

interface AdminActivitiesTabProps {
  recentActivities: ActivityItem[];
}

export function AdminActivitiesTab({ recentActivities }: AdminActivitiesTabProps) {
  return (
    <div className="surface rounded-2xl border overflow-hidden">
      <div className="p-5 border-b">
        <h3 className="font-bold text-sm text-foreground">Recent System Activities</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          সকল মেন্টর কর্তৃক সম্পন্ন হওয়া সাম্প্রতিক কল আউটরিচ এবং ফলো-আপ অ্যাক্টিভিটি
        </p>
      </div>

      <div className="divide-y divide-border/60">
        {recentActivities.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No recent activities recorded.
          </div>
        ) : (
          recentActivities.map((act) => (
            <div
              key={act.id}
              className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <PhoneCall className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {act.studentName
                      ? `${act.studentName} (Batch ${act.studentCohort || '-'})`
                      : act.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Called by <strong className="text-foreground">{act.mentorName}</strong> &bull;{' '}
                    Status:{' '}
                    <span
                      className={
                        act.status === 'RECEIVED' ? 'text-success font-semibold' : 'text-warning'
                      }
                    >
                      {act.status}
                    </span>
                    {act.notes ? ` &bull; "${act.notes}"` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {new Date(act.date).toLocaleDateString()}
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {new Date(act.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
