'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, X } from 'lucide-react'
import juice from 'juice'
import {
  buildWechatExportCss,
  normalizeWechatExportHtml,
  type WechatExportStyleTokens,
} from '@/lib/wechat-export-style'
import { Tooltip } from '@/components/Tooltip'
import { useToast } from '@/components/Toast'

interface WechatPreviewPanelProps {
  open: boolean
  onClose: () => void
  title: string
  html: string
}

const URL_ATTRIBUTES = [
  ['img', 'src'],
  ['a', 'href'],
  ['audio', 'src'],
  ['video', 'src'],
  ['source', 'src'],
  ['iframe', 'src'],
] as const

const BASE_TOKENS: WechatExportStyleTokens = {
  background: '#ffffff',
  panelBackground: '#faf9f5',
  softBackground: '#e8e6dc',
  lineColor: '#f0eee6',
  inkColor: '#141413',
  mutedColor: '#5e5d59',
  accentColor: '#c96442',
  linkColor: '#576b95',
  codeBackground: '#f6f8fa',
  codeBorderColor: '#e8e6dc',
  quoteBackground: '#faf9f5',
  articleHeadingColor: '#17120d',
  articleBodyColor: '#2b241c',
  articleQuoteColor: '#51473a',
  articleQuoteBorderColor: '#cdb796',
  articleQuoteNestedBorderColor: '#b8a68a',
  articleQuoteNestedBackground: 'rgba(0, 0, 0, 0.02)',
  bodyFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  monoFontFamily: '"SFMono-Regular", Consolas, monospace',
  titleFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

type ThemePreset = {
  name: string
  tokens: Partial<WechatExportStyleTokens>
  overrideCss: string
}

const THEME_PRESETS: ThemePreset[] = [
  {
    name: '默认',
    tokens: {},
    overrideCss: '',
  },
  {
    name: '优雅',
    tokens: {
      articleBodyColor: '#333333',
      articleHeadingColor: '#1a1a1a',
      accentColor: '#8b5cf6',
      articleQuoteBorderColor: '#8b5cf6',
      bodyFontFamily: 'Georgia, "Noto Serif SC", "Songti SC", serif',
      titleFontFamily: 'Georgia, "Noto Serif SC", "Songti SC", serif',
    },
    overrideCss: `.wechat-export-content { font-size: 16px; line-height: 1.9; letter-spacing: 0.04em; }
.wechat-export-title { font-size: 16px; line-height: 1.9; }`,
  },
  {
    name: '简约',
    tokens: {
      articleBodyColor: '#3f3f46',
      articleHeadingColor: '#18181b',
      accentColor: '#2563eb',
      articleQuoteBorderColor: '#d4d4d8',
      linkColor: '#2563eb',
    },
    overrideCss: `.wechat-export-content { font-size: 15px; line-height: 1.75; }
.wechat-export-title { font-size: 15px; line-height: 1.75; }
.wechat-export-content h1, .wechat-export-content h2, .wechat-export-content h3 { margin: 1.5em 0 0.6em; }`,
  },
]

function absolutizeUrls(htmlString: string, baseUrl: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  for (const [selector, attribute] of URL_ATTRIBUTES) {
    for (const el of doc.querySelectorAll<HTMLElement>(selector)) {
      const value = el.getAttribute(attribute)
      if (!value || !value.trim() || value.trim().startsWith('#')) continue
      if (/^(?:[a-z]+:|\/\/)/i.test(value.trim())) continue
      try { el.setAttribute(attribute, new URL(value, baseUrl).toString()) } catch { /* skip */ }
    }
  }
  return doc.body.innerHTML
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function WechatPreviewPanel({ open, onClose, title, html }: WechatPreviewPanelProps) {
  const toast = useToast()
  const [themeIndex, setThemeIndex] = useState(0)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  const theme = THEME_PRESETS[themeIndex]

  const tokens = useMemo<WechatExportStyleTokens>(
    () => ({ ...BASE_TOKENS, ...theme.tokens }),
    [theme],
  )

  const exportCss = useMemo(() => buildWechatExportCss(tokens), [tokens])

  const normalizedHtml = useMemo(() => {
    if (typeof window === 'undefined') return html
    return absolutizeUrls(normalizeWechatExportHtml(html), window.location.origin)
  }, [html])

  const safeTitle = title.trim() || '无标题'

  const previewFragment = useMemo(() => `
<section class="wechat-export-root">
  <article class="wechat-export-article">
    <p class="wechat-export-title">${escapeHtml(safeTitle)}</p>
    <div class="wechat-export-content">${normalizedHtml}</div>
  </article>
</section>`, [safeTitle, normalizedHtml])

  const handleCopy = useCallback(async () => {
    if (copying) return
    setCopying(true)
    try {
      const fullCss = exportCss + '\n' + theme.overrideCss
      const inlined = juice.inlineContent(previewFragment, fullCss, {
        applyWidthAttributes: true,
        applyHeightAttributes: true,
        applyAttributesTableElements: true,
        preserveImportant: true,
        resolveCSSVariables: false,
        removeStyleTags: false,
      })
      const plainText = new DOMParser().parseFromString(inlined, 'text/html').body.textContent?.trim() || safeTitle

      if (window.isSecureContext && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([inlined], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
          }),
        ])
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = plainText
        textarea.setAttribute('readonly', 'true')
        textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
        const handler = (e: ClipboardEvent) => {
          e.preventDefault()
          e.clipboardData?.setData('text/html', inlined)
          e.clipboardData?.setData('text/plain', plainText)
        }
        document.body.appendChild(textarea)
        document.addEventListener('copy', handler)
        textarea.select()
        try { document.execCommand('copy') } finally {
          document.removeEventListener('copy', handler)
          textarea.remove()
        }
      }
      toast.success('已复制公众号格式')
    } catch {
      toast.error('复制失败')
    } finally {
      setCopying(false)
    }
  }, [copying, exportCss, theme.overrideCss, previewFragment, safeTitle, toast])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative flex flex-col rounded-2xl bg-[var(--editor-panel)] shadow-2xl overflow-hidden"
        style={{ width: 420, maxWidth: '95vw', height: '90vh', maxHeight: 800 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--editor-line)] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--editor-ink)]">公众号预览</span>
            <div className="flex items-center gap-0.5 rounded-lg bg-[var(--editor-soft)] p-0.5">
              {THEME_PRESETS.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => setThemeIndex(i)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    i === themeIndex
                      ? 'bg-[var(--editor-panel)] text-[var(--editor-ink)] shadow-sm'
                      : 'text-[var(--editor-muted)] hover:text-[var(--editor-ink)]'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip label="以当前主题复制公众号格式">
              <button
                onClick={handleCopy}
                disabled={copying}
                className="flex items-center gap-1.5 rounded-md bg-[var(--editor-accent)] px-2.5 py-1.5 text-xs font-medium text-white hover:brightness-105 transition-all disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5" />
                {copying ? '复制中...' : '复制'}
              </button>
            </Tooltip>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-[var(--editor-muted)] hover:text-[var(--editor-ink)] hover:bg-[var(--editor-soft)] transition-colors"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Phone-simulated preview */}
        <div className="flex-1 overflow-y-auto bg-[#f0f0f0] p-4">
          <div className="mx-auto rounded-xl bg-white shadow-sm overflow-hidden" style={{ maxWidth: 375 }}>
            <style>{exportCss + '\n' + theme.overrideCss}</style>
            <div className="px-4 py-5" dangerouslySetInnerHTML={{ __html: previewFragment }} />
          </div>
        </div>
      </div>
    </div>
  )
}
