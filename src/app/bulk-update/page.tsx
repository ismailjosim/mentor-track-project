import type { Metadata } from 'next';
import { BulkUpdateHelp } from '@/components/bulk-update/BulkUpdateHelp';
import { BulkUpdateTabs } from '@/components/bulk-update/BulkUpdateTabs';

export const metadata: Metadata = {
  title: 'Bulk Updates | Mentor Track',
  description: 'Update multiple student records or assignments via batch data entry.',
};

export default function BulkUpdatePage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="page-header rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-7">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Data operations
          </p>
          <h1 className="page-title">Bulk Updates</h1>
          <p className="page-description">
            Update multiple student records or assignments via batch data entry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <BulkUpdateHelp />
        </div>
        <div className="lg:col-span-2">
          <BulkUpdateTabs />
        </div>
      </div>
    </div>
  );
}
