'use client';

import { useState } from 'react';
import { Zap, UserPlus, CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Tab } from './types';
import { BulkAssignmentTab } from './BulkAssignmentTab';
import { BulkMentorshipTab } from './BulkMentorshipTab';
import { BulkStudentsTab } from './BulkStudentsTab';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'assignment', label: 'Assignment Update', icon: Zap },
  { key: 'mentorship', label: 'Mentorship Update', icon: Heart },
  { key: 'student', label: 'Student Upsert', icon: UserPlus },
];

export function BulkUpdateTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('assignment');
  const [committedMessage, setCommittedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (key: Tab) => {
    setActiveTab(key);
    setCommittedMessage(null);
    setError(null);
  };

  const handleAssignmentSuccess = (matchedCount: number, label: string) => {
    setCommittedMessage(`Successfully updated ${matchedCount} students for ${label}.`);
    setError(null);
  };

  const handleMentorshipSuccess = (matchedCount: number, statusText: string) => {
    setCommittedMessage(
      `Successfully updated ${matchedCount} students to mentorship status: ${statusText}.`
    );
    setError(null);
  };

  const handleStudentsSuccess = (count: number) => {
    setCommittedMessage(`Successfully processed ${count} student records.`);
    setError(null);
  };

  return (
    <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b overflow-x-auto scrollbar-none">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0',
              activeTab === key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {committedMessage && (
          <div className="flex items-center gap-3 p-4 bg-green-50/80 border border-green-200 dark:bg-green-950/20 dark:border-green-900/50 rounded-lg text-green-800 dark:text-green-300 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
            <span className="font-medium">{committedMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50/80 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 rounded-lg text-red-800 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {activeTab === 'assignment' && (
          <BulkAssignmentTab onSuccess={handleAssignmentSuccess} onError={setError} />
        )}

        {activeTab === 'mentorship' && (
          <BulkMentorshipTab onSuccess={handleMentorshipSuccess} onError={setError} />
        )}

        {activeTab === 'student' && (
          <BulkStudentsTab onSuccess={handleStudentsSuccess} onError={setError} />
        )}
      </div>
    </div>
  );
}
