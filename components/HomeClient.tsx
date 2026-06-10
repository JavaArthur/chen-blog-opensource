'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { getClientThemePreference, subscribeToThemeChange, type Theme } from '@/lib/appearance'
import { getThemeConfig } from '@/lib/theme-registry'
import type { PostWithTags } from '@/lib/db'
import type { SiteCategoryLink, SiteNavLink } from '@/lib/site'
import { HomeDefault } from '@/components/themes/HomeDefault'

export type { Theme }

export interface HomeProps {
  initialTheme: Theme
  posts: PostWithTags[]
  categories: SiteCategoryLink[]
  navLinks: SiteNavLink[]
  currentPage: number
  totalPages: number
  categorySlugMap: Record<string, string>
}

const ThemeComponents: Record<string, React.ComponentType<HomeProps>> = {
  default: HomeDefault,
  refined: dynamic<HomeProps>(() =>
    import('@/components/themes/HomeVariantA').then(m => m.HomeVariantA)
  ),
  editorial: dynamic<HomeProps>(() =>
    import('@/components/themes/HomeVariantB').then(m => m.HomeVariantB)
  ),
  'warm-editorial': dynamic<HomeProps>(() =>
    import('@/components/themes/HomeWarmEditorial').then(m => m.HomeWarmEditorial)
  ),
  terminal: dynamic<HomeProps>(() =>
    import('@/components/themes/HomeVariantC').then(m => m.HomeVariantC)
  ),
  clarity: dynamic<HomeProps>(() =>
    import('@/components/themes/HomeClarity').then(m => m.HomeClarity)
  ),
}

function injectFont(id: string, href: string) {
  if (typeof document === 'undefined') return
  if (!document.getElementById(id)) {
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }
}

export function HomeClient(props: HomeProps) {
  // 首屏（含 hydration）严格使用服务端传入的 initialTheme，确保与 SSR/ISR 缓存的 HTML 一致；
  // 挂载后再读取客户端 cookie 切换到真实主题，避免 ISR 缓存页与个性化主题冲突导致的 hydration mismatch (React #418)。
  const [theme, setTheme] = useState<Theme>(props.initialTheme)

  useEffect(() => {
    const sync = () => setTheme(getClientThemePreference(props.initialTheme))
    sync()
    return subscribeToThemeChange(sync)
  }, [props.initialTheme])

  const config = useMemo(() => getThemeConfig(theme), [theme])

  useEffect(() => {
    config.fonts?.forEach(f => injectFont(f.id, f.href))
  }, [config])

  const ThemeComponent = ThemeComponents[theme] || HomeDefault

  return (
    <div className="contents" data-home-theme-root data-home-theme={theme}>
      <ThemeComponent {...props} />
    </div>
  )
}
