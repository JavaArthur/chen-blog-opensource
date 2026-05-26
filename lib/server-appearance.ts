import { cookies } from 'next/headers'
import { isTheme, THEME_COOKIE_NAME, type Theme } from '@/lib/appearance'

export async function getRequestThemePreference(): Promise<Theme | null> {
  try {
    const cookieStore = await cookies()
    const value = cookieStore.get(THEME_COOKIE_NAME)?.value
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

export async function resolveRequestTheme(defaultTheme: Theme): Promise<Theme> {
  return (await getRequestThemePreference()) ?? defaultTheme
}
