'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  RefreshCw,
  FileBarChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { PAGE_ROUTES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { BrandLogo } from '@/components/BrandLogo';
import { UserAvatar } from '@/components/Students/StudentAvatar';
import { authClient } from '@/lib/auth-client';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/Modal';

const navLinks = [
  { label: 'Dashboard', href: PAGE_ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Students', href: PAGE_ROUTES.STUDENTS, icon: Users },
  { label: 'Bulk Update', href: PAGE_ROUTES.BULK_UPDATE, icon: RefreshCw },
  { label: 'Reports', href: PAGE_ROUTES.REPORTS, icon: FileBarChart },
];

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  className,
  isCollapsed: externalCollapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Sign out confirmation popup state
  const [isSignoutModalOpen, setIsSignoutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleConfirmSignout = async () => {
    try {
      setIsSigningOut(true);
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = '/auth/login';
          },
        },
      });
    } catch (err) {
      console.error('Signout failed:', err);
    } finally {
      setIsSigningOut(false);
      setIsSignoutModalOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/80 bg-card text-card-foreground transition-all duration-300 ease-in-out shadow-sm',
          // Desktop widths
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile slide-out drawer
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Top Header: Logo + Collapse Button */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
          <Link
            href={PAGE_ROUTES.DASHBOARD}
            className="flex items-center gap-2.5 overflow-hidden font-bold tracking-tight group"
          >
            <BrandLogo
              imageClassName="size-8 object-contain transition-transform group-hover:scale-105 shrink-0"
              textClassName={
                isCollapsed && !mobileOpen ? 'hidden' : 'text-base inline font-bold truncate'
              }
            />
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            {(!isCollapsed || mobileOpen) && (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Navigation
              </p>
            )}
            {navLinks.map(({ label, href, icon: Icon }) => {
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
          </div>
        </div>

        {/* Bottom Profile Section & Sign Out */}
        {session?.user && (
          <div className="border-t border-border/60 p-3 bg-muted/10 shrink-0">
            {!isCollapsed || mobileOpen ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card p-2 shadow-2xs">
                <UserAvatar name={session.user.name} size="sm" className="size-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-tight text-foreground truncate">
                    {session.user.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSignoutModalOpen(true)}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UserAvatar name={session.user.name} size="sm" className="size-8" />
                <button
                  type="button"
                  onClick={() => setIsSignoutModalOpen(true)}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={isSignoutModalOpen}
        onClose={() => !isSigningOut && setIsSignoutModalOpen(false)}
      >
        <ModalHeader
          title="Sign Out Confirmation"
          onClose={() => !isSigningOut && setIsSignoutModalOpen(false)}
        />
        <ModalBody>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-foreground">
                  Are you sure you want to sign out?
                </h4>
                <p className="text-xs text-muted-foreground">
                  You are currently logged in as{' '}
                  <span className="font-semibold text-foreground">
                    {session?.user?.name || 'Mentor'}
                  </span>{' '}
                  ({session?.user?.email}).
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              You will need to sign in again with your email and password to access the mentor
              dashboard, student assignments, and follow-ups.
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={() => setIsSignoutModalOpen(false)}
            disabled={isSigningOut}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSignout}
            disabled={isSigningOut}
            className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="size-4" />
                Sign Out
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}
