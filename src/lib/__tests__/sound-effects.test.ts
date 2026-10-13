import { describe, it, expect, beforeEach } from 'vitest';
import { soundManager, playCrudSound } from '../sound-effects';

describe('Sound Effects Manager', () => {
  beforeEach(() => {
    soundManager.setEnabled(true);
  });

  it('should enable, disable and toggle sound state', () => {
    expect(soundManager.isEnabled()).toBe(true);

    soundManager.setEnabled(false);
    expect(soundManager.isEnabled()).toBe(false);

    const toggled = soundManager.toggle();
    expect(toggled).toBe(true);
    expect(soundManager.isEnabled()).toBe(true);
  });

  it('should not throw when playCrudSound is called for all CRUD types', () => {
    expect(() => playCrudSound('create')).not.toThrow();
    expect(() => playCrudSound('update')).not.toThrow();
    expect(() => playCrudSound('delete')).not.toThrow();
    expect(() => playCrudSound('bulk')).not.toThrow();
    expect(() => playCrudSound('error')).not.toThrow();
  });

  it('should respect disabled sound state without error', () => {
    soundManager.setEnabled(false);
    expect(() => playCrudSound('create')).not.toThrow();
    expect(() => playCrudSound('update')).not.toThrow();
    expect(() => playCrudSound('delete')).not.toThrow();
  });
});
