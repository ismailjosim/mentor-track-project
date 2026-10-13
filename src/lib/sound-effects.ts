'use client';

/**
 * UI Audio Sound Effects for CRUD operations.
 * Synthesized using the Web Audio API — works in all modern browsers without
 * any external asset downloads, 0ms latency, and completely offline-capable.
 *
 * NOTE: GET operations do NOT trigger any sounds as per specification.
 */

class SoundEffectManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mentor-track-sound-enabled');
        this.soundEnabled = stored === null ? true : stored === 'true';
      } catch {
        this.soundEnabled = true;
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) return null;

      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch {
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mentor-track-sound-enabled', String(enabled));
        window.dispatchEvent(new CustomEvent('mentor-track-sound-changed', { detail: enabled }));
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  public toggle(): boolean {
    const next = !this.soundEnabled;
    this.setEnabled(next);
    if (next) {
      this.playUpdate();
    }
    return next;
  }

  /**
   * CREATE sound: Crisp, uplifting ascending triad chime (C5 -> E5 -> G5)
   */
  public playCreate(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const stepDuration = 0.08;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * stepDuration);

        const startTime = now + idx * stepDuration;
        const endTime = startTime + 0.16;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {
      // Audio playback failsafe
    }
  }

  /**
   * UPDATE sound: Snappy, bright modern UI double-pop (F5 -> A5)
   */
  public playUpdate(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [698.46, 880.0]; // F5, A5
      const stepDuration = 0.07;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * stepDuration);

        const startTime = now + idx * stepDuration;
        const endTime = startTime + 0.15;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {
      // Audio playback failsafe
    }
  }

  /**
   * DELETE sound: Subtly descending soft muted drop (G4 -> D4)
   */
  public playDelete(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.0, now); // G4
      osc.frequency.exponentialRampToValueAtTime(220.0, now + 0.18); // A3

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio playback failsafe
    }
  }

  /**
   * BULK sound: Celebratory multi-tone shimmer (C5 -> E5 -> G5 -> C6)
   */
  public playBulk(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const stepDuration = 0.07;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * stepDuration);

        const startTime = now + idx * stepDuration;
        const endTime = startTime + 0.2;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {
      // Audio playback failsafe
    }
  }

  /**
   * ERROR sound: Gentle low double-blip
   */
  public playError(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [260, 200];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        const startTime = now + idx * 0.09;
        const endTime = startTime + 0.11;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {
      // Audio playback failsafe
    }
  }
}

export const soundManager = new SoundEffectManager();

export type CrudOperationType = 'create' | 'update' | 'delete' | 'bulk' | 'error';

/**
 * Triggers appropriate audio feedback for a CRUD operation.
 * NOTE: GET operations must never call this.
 */
export const playCrudSound = (type: CrudOperationType): void => {
  try {
    switch (type) {
      case 'create':
        soundManager.playCreate();
        break;
      case 'update':
        soundManager.playUpdate();
        break;
      case 'delete':
        soundManager.playDelete();
        break;
      case 'bulk':
        soundManager.playBulk();
        break;
      case 'error':
        soundManager.playError();
        break;
    }
  } catch (err) {
    console.debug('Audio play suppressed:', err);
  }
};
