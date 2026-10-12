'use client';

import { LogOut } from 'lucide-react';
import { UserAvatar } from '@/components/Students/StudentAvatar';

interface SidebarUserProfileProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  isCollapsed: boolean;
  mobileOpen: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onOpenSignoutModal: () => void;
}

export function SidebarUserProfile({
  user,
  isCollapsed,
  mobileOpen,
  isAdmin,
  isSuperAdmin,
  onOpenSignoutModal,
}: SidebarUserProfileProps) {
  return (
    <div className="border-t border-border/60 p-3 bg-muted/10 shrink-0">
      {!isCollapsed || mobileOpen ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card p-2 shadow-2xs">
          <UserAvatar name={user.name || 'User'} size="sm" className="size-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold leading-tight text-foreground truncate">
                {user.name}
              </p>
              {isAdmin && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase shrink-0">
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onOpenSignoutModal}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <UserAvatar name={user.name || 'User'} size="sm" className="size-8" />
          <button
            type="button"
            onClick={onOpenSignoutModal}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
