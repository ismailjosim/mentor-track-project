'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { BatchSelector } from './BatchSelector';
import { ThemeToggler } from './ThemeToggler';
import { cn } from '@/lib/cn';

interface TopNavbarProps {
  onOpenMobile?: () => void;
  className?: string;
}

export function TopNavbar({ onOpenMobile, className }: TopNavbarProps) {
  const [currentAssignment, setCurrentAssignment] = useState<string | null>(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true);

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
        setCurrentAssignment('A-06');
      } finally {
        setIsLoadingAssignment(false);
      }
    };
    fetchCurrentAssignment();
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 w-full items-center border-b border-border/70 bg-card/75 backdrop-blur-md transition-colors',
        className
      )}
    >
      <div className="flex w-full items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-4">
        {/* Left Side: Mobile Hamburger & Logo (Desktop Context Tag) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenMobile}
            className="grid size-9 place-items-center rounded-xl border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden shrink-0"
            aria-label="Open sidebar menu"
          >
            <Menu className="size-5" />
          </button>

          {/* Logo on mobile screens */}
          <div className="lg:hidden shrink-0">
            <BrandLogo
              imageClassName="size-7 object-contain"
              textClassName="hidden min-[420px]:inline text-sm font-bold truncate max-w-28 sm:max-w-36"
            />
          </div>

          {/* Desktop workspace indicator */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              MentorTrack Workspace
            </span>
          </div>
        </div>

        {/* Right Side: Live Cohort, Batch Selector, and Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Live Cohort Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-success-border bg-success-soft/80 px-2 sm:px-3 py-1 sm:py-1.5 shadow-2xs">
            <span className="size-2 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_20%,transparent)] animate-pulse shrink-0" />
            {isLoadingAssignment ? (
              <div className="h-3.5 w-10 sm:w-14 bg-muted rounded animate-pulse" />
            ) : (
              <span className="text-xs font-semibold text-success-foreground whitespace-nowrap">
                <span className="hidden sm:inline">Live cohort </span>
                <span className="sm:hidden text-[11px]">Cohort </span>
                <strong className="font-bold">{currentAssignment || 'A-06'}</strong>
              </span>
            )}
          </div>

          {/* Batch Selector */}
          <BatchSelector />

          {/* Dark / Light Mode Toggler */}
          <ThemeToggler />
        </div>
      </div>
    </header>
  );
}
