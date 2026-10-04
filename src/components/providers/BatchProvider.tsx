'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface BatchContextType {
  selectedBatch: string;
  setSelectedBatch: (batch: string) => void;
  availableBatches: string[];
  batchLabel: (batch?: string) => string;
}

const STORAGE_KEY = 'mentor_track_active_batch';
const DEFAULT_BATCH = '14';
export const AVAILABLE_BATCHES = ['13', '14', 'all'];

const BatchContext = createContext<BatchContextType | undefined>(undefined);

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('batch-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('batch-change', callback);
  };
}

function getSnapshot(): string {
  if (typeof window === 'undefined') return DEFAULT_BATCH;
  const urlCohort = new URLSearchParams(window.location.search).get('cohort');
  if (urlCohort) return urlCohort;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_BATCH;
}

function getServerSnapshot(): string {
  return DEFAULT_BATCH;
}

export function BatchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Pure synchronization with localStorage and URL using React 19's useSyncExternalStore
  const selectedBatch = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setSelectedBatch = useCallback(
    (batch: string) => {
      try {
        localStorage.setItem(STORAGE_KEY, batch);
        document.cookie = `${STORAGE_KEY}=${batch}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // Ignore storage errors
      }

      // If currently on dashboard or students page, sync the URL param
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/students')) {
        const current = new URLSearchParams(window.location.search);
        if (batch === 'all') {
          current.delete('cohort');
        } else {
          current.set('cohort', batch);
        }
        const search = current.toString();
        const query = search ? `?${search}` : '';
        router.replace(`${pathname}${query}`, { scroll: false });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('batch-change', { detail: { batch } }));
      }
    },
    [pathname, router]
  );

  const batchLabel = useCallback(
    (batch: string = selectedBatch) => {
      if (batch === 'all') return 'All Batches';
      if (batch === '14') return 'Batch 14 (New)';
      if (batch === '13') return 'Batch 13';
      return `Batch ${batch}`;
    },
    [selectedBatch]
  );

  const value = useMemo(
    () => ({
      selectedBatch,
      setSelectedBatch,
      availableBatches: AVAILABLE_BATCHES,
      batchLabel,
    }),
    [selectedBatch, setSelectedBatch, batchLabel]
  );

  return <BatchContext.Provider value={value}>{children}</BatchContext.Provider>;
}

export function useBatch() {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error('useBatch must be used within a BatchProvider');
  }
  return context;
}
