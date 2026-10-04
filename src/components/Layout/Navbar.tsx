'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  RefreshCw,
  Menu,
  X,
  LogOut,
  Command,
  FileBarChart,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PAGE_ROUTES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggler } from './ThemeToggler';
import { BatchSelector } from './BatchSelector';
import { UserAvatar } from '@/components/Students/StudentAvatar';
import { authClient } from '@/lib/auth-client';

const navLinks = [
  { label: 'Dashboard', href: PAGE_ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Students', href: PAGE_ROUTES.STUDENTS, icon: Users },
  { label: 'Bulk Update', href: PAGE_ROUTES.BULK_UPDATE, icon: RefreshCw },
  { label: 'Reports', href: PAGE_ROUTES.REPORTS, icon: FileBarChart },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const [currentAssignment, setCurrentAssignment] = useState<string | null>(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/auth/login';
        },
      },
    });
  };

  useEffect(() => {
    const fetchCurrentAssignment = async () => {
      try {
        setIsLoadingAssignment(true);
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.data?.currentAssignment) {
          setCurrentAssignment(data.data.currentAssignment);
        }
      } catch (error) {
        console.error('Failed to fetch current assignment:', error);
        setCurrentAssignment('A-01');
      } finally {
        setIsLoadingAssignment(false);
      }
    };
    fetchCurrentAssignment();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href={PAGE_ROUTES.DASHBOARD}
          className="group flex items-center gap-3 font-bold tracking-tight"
          aria-label="MentorTrack dashboard"
        >
          <BrandLogo
            imageClassName="size-10 object-contain transition-transform group-hover:scale-[1.04]"
            textClassName="hidden text-lg sm:inline"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 rounded-xl border border-border/70 bg-card/70 p-1 md:flex">
          {navLinks.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Current Assignment Badge */}
        <div className="hidden items-center gap-2 rounded-full border border-success-border bg-success-soft px-3 py-1.5 lg:flex">
          <div className="size-1.5 rounded-full bg-success shadow-[0_0_0_4px_color-mix(in_oklch,var(--success)_15%,transparent)]" />
          {isLoadingAssignment ? (
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          ) : (
            <span className="text-xs font-semibold text-success-foreground">
              Live cohort <span className="font-bold">{currentAssignment}</span>
            </span>
          )}
        </div>

        {/* User Section & Batch Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          <BatchSelector />
          <ThemeToggler />

          {session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-2.5 py-1.5">
                <UserAvatar name={session.user.name} size="sm" className="size-7" />
                <div className="text-sm">
                  <p className="font-medium leading-none">{session.user.name}</p>
                  <p className="max-w-32 truncate text-[11px] text-muted-foreground mt-0.5">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger-foreground"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          {/* Mobile Toggle */}
          <button
            className="grid size-10 place-items-center rounded-xl border bg-card text-muted-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t bg-background/95 px-4 pb-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}

            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Command className="size-4 text-primary" />
                <span>Active Cohort</span>
              </div>
              <BatchSelector compact />
            </div>

            {/* Mobile User Section */}
            {session?.user && (
              <>
                <div className="border-t my-3 pt-3">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <UserAvatar name={session.user.name} size="sm" className="size-8" />
                    <div className="text-sm min-w-0">
                      <p className="font-medium truncate">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
