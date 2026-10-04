'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/cn';

const emptySubscribe = () => () => {};

export function ThemeToggler() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const { resolvedTheme, setTheme } = useTheme();
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex h-9 w-14 items-center rounded-xl border border-border bg-card p-1 transition-all duration-300',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15',
        isDark && 'bg-secondary'
      )}
    >
      <span
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-300',
          isDark && 'translate-x-5'
        )}
      >
        {!mounted ? (
          <span className="size-4" />
        ) : isDark ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </span>
    </button>
  );
}
