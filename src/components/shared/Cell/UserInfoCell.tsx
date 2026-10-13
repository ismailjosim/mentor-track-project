'use client';

import { StudentAvatar } from '@/components/Students/StudentAvatar';

interface UserInfoCellProps {
  name: string;
  email: string;
  cohort?: string;
}

export function UserInfoCell({ name, email, cohort }: UserInfoCellProps) {
  return (
    <div className="flex items-center gap-3">
      <StudentAvatar name={name} size="sm" />
      <div>
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-foreground">{name}</p>
          {cohort && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              B-{cohort}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}

export default UserInfoCell;
