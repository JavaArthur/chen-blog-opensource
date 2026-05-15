import { afterEach, describe, expect, it, vi } from 'vitest'
import { getClientThemePreference, subscribeToThemeChange, THEME_STORAGE_KEY } from '@/lib/appearance'

describe('appearance helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the provided fallback when running without window', () => {
    expect(getClientThemePreference('clarity')).toBe('clarity')
  })

  it('uses the server-provided fallback when localStorage has no saved theme', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => null),
      },
    })

    expect(getClientThemePreference('terminal')).toBe('terminal')
  })

  it('prefers a valid saved client theme over the fallback', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => 'editorial'),
      },
    })

    expect(getClientThemePreference('terminal')).toBe('editorial')
  })

  it('subscribes to same-tab theme changes and cross-tab storage changes', () => {
    const listeners = new Map<string, EventListener>()
    const onStoreChange = vi.fn()

    vi.stubGlobal('window', {
      addEventListener: vi.fn((name: string, listener: EventListener) => {
        listeners.set(name, listener)
      }),
      removeEventListener: vi.fn((name: string) => {
        listeners.delete(name)
      }),
    })

    const unsubscribe = subscribeToThemeChange(onStoreChange)

    listeners.get('qm-theme-change')?.(new Event('qm-theme-change'))
    listeners.get('storage')?.({ key: THEME_STORAGE_KEY } as StorageEvent)
    listeners.get('storage')?.({ key: 'other-key' } as StorageEvent)

    expect(onStoreChange).toHaveBeenCalledTimes(2)

    unsubscribe()
    expect(listeners.size).toBe(0)
  })
})
