import type { Theme } from '@/lib/appearance'
import type { ComponentType } from 'react'
import type { HomeProps } from '@/components/HomeClient'

export interface ThemeConfig {
  id: Theme
  label: string
  description: string
  fonts?: { id: string; href: string }[]
  component: () => Promise<{ default: ComponentType<HomeProps> }>
}

const registry: ThemeConfig[] = [
  {
    id: 'default',
    label: '默认',
    description: '温暖、克制的阅读首页',
    component: () => import('@/components/themes/HomeDefault').then(m => ({ default: m.HomeDefault })),
  },
  {
    id: 'refined',
    label: '精致极简',
    description: '更轻、更专注的杂志式列表',
    fonts: [{ id: 'qm-jetbrains-mono', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap' }],
    component: () => import('@/components/themes/HomeVariantA').then(m => ({ default: m.HomeVariantA })),
  },
  {
    id: 'editorial',
    label: '杂志编辑',
    description: '更强视觉层次的刊物风格',
    fonts: [
      { id: 'qm-jetbrains-mono', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap' },
      { id: 'qm-noto-serif-sc', href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&display=swap' },
    ],
    component: () => import('@/components/themes/HomeVariantB').then(m => ({ default: m.HomeVariantB })),
  },
  {
    id: 'terminal',
    label: 'AI 终端',
    description: '偏技术感的深色终端界面',
    fonts: [{ id: 'qm-jetbrains-mono', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap' }],
    component: () => import('@/components/themes/HomeVariantC').then(m => ({ default: m.HomeVariantC })),
  },
  {
    id: 'clarity',
    label: '清透',
    description: '苹果风蓝白极简，产品感十足',
    component: () => import('@/components/themes/HomeClarity').then(m => ({ default: m.HomeClarity })),
  },
]

export function getThemeConfig(id: Theme): ThemeConfig {
  return registry.find(t => t.id === id) || registry[0]
}

export function getAllThemes(): ThemeConfig[] {
  return registry
}
