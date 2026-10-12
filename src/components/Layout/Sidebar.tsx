'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PAGE_ROUTES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { BrandLogo } from '@/components/BrandLogo';
import { authClient } from '@/lib/auth-client';
import type { SidebarProps } from './sidebar.types';
import { SidebarNav } from './SidebarNav';
import { SidebarUserProfile } from './SidebarUserProfile';
import { SignoutModal } from './SignoutModal';

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

  const userRole = (
    (session?.user as { role?: string | null })?.role as string | undefined
  )?.toLowerCase();
  const isSuperAdmin =
    session?.user?.email?.toLowerCase() === 'ismailjosim99@gmail.com' || userRole === 'super_admin';
  const isAdmin = isSuperAdmin || userRole === 'admin' || userRole === 'system_admin';

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
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
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

        {/* Navigation Area */}
        <SidebarNav
          isCollapsed={isCollapsed}
          mobileOpen={mobileOpen}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
        />

        {/* User Profile Footer */}
        {session?.user && (
          <SidebarUserProfile
            user={session.user}
            isCollapsed={isCollapsed}
            mobileOpen={mobileOpen}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            onOpenSignoutModal={() => setIsSignoutModalOpen(true)}
          />
        )}
      </aside>

      {/* Sign Out Confirmation Modal */}
      <SignoutModal
        isOpen={isSignoutModalOpen}
        isSigningOut={isSigningOut}
        userName={session?.user?.name}
        userEmail={session?.user?.email}
        onClose={() => setIsSignoutModalOpen(false)}
        onConfirm={handleConfirmSignout}
      />
    </>
  );
}
