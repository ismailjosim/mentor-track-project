'use client';

import { useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '@/lib/sound-effects';
import { cn } from '@/lib/cn';

function subscribeSound(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('mentor-track-sound-changed', callback);
  return () => window.removeEventListener('mentor-track-sound-changed', callback);
}

function getSoundSnapshot() {
  return soundManager.isEnabled();
}

function getServerSnapshot() {
  return true;
}

const emptySubscribe = () => () => {};

export function SoundToggler() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const enabled = useSyncExternalStore(subscribeSound, getSoundSnapshot, getServerSnapshot);

  const handleToggle = () => {
    soundManager.toggle();
  };

  if (!mounted) {
    return <div className="size-9 rounded-xl border border-border bg-card p-1 opacity-50" />;
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={enabled ? 'Mute sound effects' : 'Enable sound effects'}
      title={
        enabled ? 'Sound effects enabled (Click to mute)' : 'Sound effects muted (Click to enable)'
      }
      className={cn(
        'grid size-9 place-items-center rounded-xl border border-border bg-card transition-all duration-200',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 cursor-pointer',
        enabled
          ? 'text-primary hover:text-primary/90'
          : 'text-muted-foreground/60 hover:text-muted-foreground'
      )}
    >
      {enabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
    </button>
  );
}
