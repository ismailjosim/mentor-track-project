'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { Footer } from './Footer';
import { cn } from '@/lib/cn';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('sidebar-collapsed') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isAuthRoute =
    pathname.startsWith('/auth') || pathname === '/login' || pathname === '/register';

  // Auth pages are full-screen without sidebar/topbar
  if (isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Collapsible Sidebar on Desktop / Drawer on Mobile */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area (shifted based on sidebar width on desktop) */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* Top Navbar with Live Cohort, Batch Selector & Theme Toggler */}
        <TopNavbar onOpenMobile={() => setMobileOpen(true)} />

        {/* Page Content */}
        <main className="app-main flex-1">{children}</main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
