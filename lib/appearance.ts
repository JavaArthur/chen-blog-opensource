export const THEME_COOKIE_NAME = 'qm_site_theme'
export const THEME_STORAGE_KEY = THEME_COOKIE_NAME
export const THEME_CHANGE_EVENT = 'qm-theme-change'
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const THEME_OPTIONS = [
  {
    id: 'default',
    label: '默认',
    description: '温暖、克制的阅读首页',
  },
  {
    id: 'refined',
    label: '精致极简',
    description: '更轻、更专注的杂志式列表',
  },
  {
    id: 'editorial',
    label: '杂志编辑',
    description: '更强视觉层次的刊物风格',
  },
  {
    id: 'warm-editorial',
    label: '暖调编辑',
    description: 'Claude 暖调与 Wired 刊物感融合的独立内容首页',
  },
  {
    id: 'terminal',
    label: 'AI 终端',
    description: '偏技术感的深色终端界面',
  },
  {
    id: 'clarity',
    label: '清透',
    description: '苹果风蓝白极简，产品感十足',
  },
] as const

export type Theme = (typeof THEME_OPTIONS)[number]['id']

export const FONT_PRESETS = [
  {
    id: 'default',
    name: '系统默认',
    desc: '本地 Geist + 系统字体',
    family: '',
    needsLoad: false,
  },
  {
    id: 'kaiti',
    name: '楷体（tw93风格）',
    desc: '仓耳今楷02，典雅文艺，自托管分片加载',
    family: 'TsangerJinKai02, STKaiti, KaiTi, serif',
    needsLoad: true,
  },
  {
    id: 'serif',
    name: '衬线体',
    desc: 'Georgia + Noto Serif SC',
    family: 'Georgia, "Noto Serif SC", "Source Han Serif SC", serif',
    needsLoad: false,
  },
  {
    id: 'heiti',
    name: '黑体',
    desc: '苹方 / 微软雅黑',
    family: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
    needsLoad: false,
  },
] as const

export type BodyFont = (typeof FONT_PRESETS)[number]['id']

export const FONT_CONFIG: Record<string, { family: string; link?: string }> = {
  kaiti: {
    family: 'TsangerJinKai02, STKaiti, KaiTi, serif',
    link: '/fonts/jinkai/jinkai.css',
  },
  serif: { family: 'Georgia, "Noto Serif SC", "Source Han Serif SC", serif' },
  heiti: { family: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
}

export function isTheme(value: string | null | undefined): value is Theme {
  return THEME_OPTIONS.some((option) => option.id === value)
}

export function normalizeTheme(value: string | null | undefined, fallback: Theme = 'default'): Theme {
  return isTheme(value) ? value : fallback
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const match = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

export function applyClientTheme(theme: Theme) {
  if (typeof document === 'undefined') return

  if (theme === 'default') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
  document.documentElement.removeAttribute('data-theme-pending')
}

export function setClientThemePreference(theme: Theme) {
  if (typeof document === 'undefined') return

  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {}

  applyClientTheme(theme)
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } }))
}

export function getClientThemePreference(fallback: Theme = 'default'): Theme {
  if (typeof window === 'undefined') return fallback

  const saved = readCookie(THEME_COOKIE_NAME)
  if (isTheme(saved)) return saved

  return fallback
}

export function subscribeToThemeChange(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = () => onStoreChange()
  window.addEventListener(THEME_CHANGE_EVENT, handler)

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handler)
  }
}
