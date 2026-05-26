import { afterEach, describe, expect, it, vi } from 'vitest'
import { getClientThemePreference, isTheme, subscribeToThemeChange, THEME_CHANGE_EVENT, THEME_COOKIE_NAME } from '@/lib/appearance'

describe('appearance helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the provided fallback when running without window', () => {
    expect(getClientThemePreference('clarity')).toBe('clarity')
  })

  it('uses the server-provided fallback when the theme cookie is missing', () => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('document', { cookie: '' })

    expect(getClientThemePreference('terminal')).toBe('terminal')
  })

  it('prefers a valid saved client theme over the fallback', () => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('document', { cookie: `${THEME_COOKIE_NAME}=editorial` })

    expect(getClientThemePreference('terminal')).toBe('editorial')
  })

  it('accepts the warm editorial theme id', () => {
    expect(isTheme('warm-editorial')).toBe(true)
  })

  it('subscribes to same-tab theme changes', () => {
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

    listeners.get(THEME_CHANGE_EVENT)?.(new Event(THEME_CHANGE_EVENT))

    expect(onStoreChange).toHaveBeenCalledTimes(1)

    unsubscribe()
    expect(listeners.size).toBe(0)
  })
})
