'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PAGE_ROUTES } from '@/lib/constants';
import { NAV_LINKS } from './sidebar.types';

interface SidebarNavProps {
  isCollapsed: boolean;
  mobileOpen: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export function SidebarNav({
  isCollapsed,
  mobileOpen,
  isAdmin,
  isSuperAdmin,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      <div className="space-y-1">
        {(!isCollapsed || mobileOpen) && (
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Navigation
          </p>
        )}
        {NAV_LINKS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCollapsed && !mobileOpen && 'justify-center px-0'
              )}
              title={isCollapsed && !mobileOpen ? label : undefined}
            >
              <Icon
                className={cn(
                  'size-4 shrink-0 transition-transform group-hover:scale-105',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {(!isCollapsed || mobileOpen) && <span className="truncate">{label}</span>}
            </Link>
          );
        })}

        {/* Admin Only Section */}
        {isAdmin && (
          <div className="pt-3 border-t border-border/50">
            {(!isCollapsed || mobileOpen) && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="size-3" />
                <span>System Administration</span>
              </p>
            )}
            <Link
              href={PAGE_ROUTES.ADMIN}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group',
                pathname.startsWith(PAGE_ROUTES.ADMIN)
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30 shadow-xs'
                  : 'text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300',
                isCollapsed && !mobileOpen && 'justify-center px-0'
              )}
              title={isCollapsed && !mobileOpen ? 'System Admin' : undefined}
            >
              <ShieldCheck
                className={cn(
                  'size-4 shrink-0 transition-transform group-hover:scale-105',
                  pathname.startsWith(PAGE_ROUTES.ADMIN)
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-amber-500'
                )}
              />
              {(!isCollapsed || mobileOpen) && (
                <span className="truncate flex-1 font-semibold">System Admin</span>
              )}
              {(!isCollapsed || mobileOpen) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase">
                  {isSuperAdmin ? 'Super' : 'Admin'}
                </span>
              )}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
