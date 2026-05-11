'use client'

import { useCallback, useMemo, useState } from 'react'
import { Copy, FileText, Smartphone, X } from 'lucide-react'
import juice from 'juice'
import {
  buildWechatExportCss,
  normalizeWechatExportHtml,
  type WechatExportStyleTokens,
} from '@/lib/wechat-export-style'
import { Tooltip } from '@/components/Tooltip'
import { useToast } from '@/components/Toast'

interface WechatPreviewPanelProps {
  title: string
  html: string
  markdown: string
  onClose?: () => void
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
    name: 'Mac',
    tokens: {
      articleBodyColor: '#1d1d1f',
      articleHeadingColor: '#111111',
      accentColor: '#0066cc',
      linkColor: '#0066cc',
      codeBackground: '#f5f5f7',
      quoteBackground: '#f5f5f7',
      articleQuoteBorderColor: '#0066cc',
      articleQuoteColor: '#555555',
    },
    overrideCss: `.wechat-export-content { font-size: 16px; line-height: 1.7; letter-spacing: 0; }
.wechat-export-title { font-size: 17px; font-weight: 600; line-height: 1.5; letter-spacing: 0; }
.wechat-export-content blockquote { padding: 16px 18px; background: #f5f5f7; border-radius: 6px; }
.wechat-export-content img { border-radius: 12px; }`,
  },
  {
    name: 'Claude',
    tokens: {
      background: '#f8f6f0',
      panelBackground: '#f8f6f0',
      articleBodyColor: '#2b2b2b',
      articleHeadingColor: '#b75c3d',
      accentColor: '#b75c3d',
      linkColor: '#b75c3d',
      codeBackground: '#f0ece4',
      quoteBackground: 'rgba(183, 92, 61, 0.04)',
      articleQuoteBorderColor: '#b75c3d',
      articleQuoteColor: '#555555',
    },
    overrideCss: `.wechat-export-root { background: #f8f6f0; }
.wechat-export-article { background: #f8f6f0; }
.wechat-export-content { font-size: 16px; line-height: 1.75; letter-spacing: 0; }
.wechat-export-title { color: #b75c3d; font-size: 17px; font-weight: 600; letter-spacing: 0; }
.wechat-export-content strong { color: #b75c3d; background: rgba(183, 92, 61, 0.08); padding: 0 4px; border-radius: 4px; }
.wechat-export-content blockquote { background: rgba(183, 92, 61, 0.04); border-radius: 6px; }`,
  },
  {
    name: '微信公众号原生',
    tokens: {
      articleBodyColor: '#333333',
      articleHeadingColor: '#111111',
      accentColor: '#07c160',
      linkColor: '#07c160',
      codeBackground: '#f0f7f2',
      quoteBackground: '#f0f7f2',
      articleQuoteBorderColor: '#07c160',
      articleQuoteColor: '#555555',
    },
    overrideCss: `.wechat-export-content { font-size: 16px; line-height: 1.75; letter-spacing: 0.01em; }
.wechat-export-title { font-size: 17px; font-weight: 500; line-height: 1.6; letter-spacing: 0; }
.wechat-export-content strong { color: #07c160; background: rgba(7, 193, 96, 0.08); padding: 0 4px; border-radius: 4px; }
.wechat-export-content blockquote { background: #f0f7f2; border-radius: 6px; }`,
  },
  {
    name: '少数派',
    tokens: {
      articleBodyColor: '#333333',
      articleHeadingColor: '#333333',
      accentColor: '#d71a1b',
      linkColor: '#d71a1b',
      codeBackground: '#fff5f5',
      quoteBackground: '#fef7f7',
      articleQuoteBorderColor: '#d71a1b',
      articleQuoteColor: '#555555',
    },
    overrideCss: `.wechat-export-content { font-size: 16px; line-height: 1.8; letter-spacing: 0; }
.wechat-export-title { color: #d71a1b; font-size: 18px; font-weight: 700; line-height: 1.5; letter-spacing: 0; }
.wechat-export-content h1 { color: #d71a1b; font-size: 1.45rem; }
.wechat-export-content h2 { padding-left: 12px; border-left: 4px solid #d71a1b; }
.wechat-export-content strong { color: #d71a1b; }
.wechat-export-content blockquote { background: #fef7f7; border-radius: 6px; }
.wechat-export-content img { border-radius: 8px; }`,
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

type PreviewMode = 'styled' | 'markdown'

export function WechatPreviewPanel({ title, html, markdown, onClose }: WechatPreviewPanelProps) {
  const toast = useToast()
  const [themeIndex, setThemeIndex] = useState(0)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('styled')
  const [copying, setCopying] = useState(false)

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

  return (
    <aside
      className="shrink-0 border-b border-[var(--editor-line)] bg-[var(--background)] lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-[430px] lg:border-b-0 lg:border-r"
    >
      <div className="flex h-full min-h-[620px] flex-col">
        <div className="border-b border-[var(--editor-line)] px-4 py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--editor-ink)]">公众号预览</div>
              <div className="mt-0.5 truncate text-xs text-[var(--editor-muted)]">{theme.name}</div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip label="样式预览">
                <button
                  type="button"
                  onClick={() => setPreviewMode('styled')}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                    previewMode === 'styled'
                      ? 'bg-[var(--editor-soft)] text-[var(--editor-accent)]'
                      : 'text-[var(--editor-muted)] hover:bg-[var(--editor-soft)] hover:text-[var(--editor-ink)]'
                  }`}
                  aria-label="样式预览"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip label="原始 Markdown">
                <button
                  type="button"
                  onClick={() => setPreviewMode('markdown')}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                    previewMode === 'markdown'
                      ? 'bg-[var(--editor-soft)] text-[var(--editor-accent)]'
                      : 'text-[var(--editor-muted)] hover:bg-[var(--editor-soft)] hover:text-[var(--editor-ink)]'
                  }`}
                  aria-label="原始 Markdown"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip label="以当前主题复制公众号格式">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={copying}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--editor-muted)] transition hover:bg-[var(--editor-soft)] hover:text-[var(--editor-accent)] disabled:opacity-50"
                  aria-label={copying ? '复制中' : '复制公众号格式'}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </Tooltip>
              {onClose && (
                <Tooltip label="隐藏预览">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--editor-muted)] transition hover:bg-[var(--editor-soft)] hover:text-[var(--editor-ink)]"
                    aria-label="隐藏预览"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[var(--editor-soft)] p-1">
              {THEME_PRESETS.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setThemeIndex(i)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
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

        <div className="flex-1 overflow-y-auto bg-[#eef0f4] px-3 py-5">
          {previewMode === 'styled' ? (
            <div className="mx-auto flex w-full max-w-[390px] flex-col rounded-[30px] bg-[#111] p-2 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
              <div className="flex min-h-[640px] flex-col overflow-hidden rounded-[24px] bg-white">
                <div className="flex h-11 shrink-0 items-center justify-center border-b border-[#f0f0f0] bg-white text-[13px] font-medium text-[#111]">
                  公众号文章
                </div>
                <div className="flex-1 overflow-y-auto">
                  <style>{exportCss + '\n' + theme.overrideCss}</style>
                  <div className="px-4 py-5" dangerouslySetInnerHTML={{ __html: previewFragment }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[390px] rounded-2xl border border-[var(--editor-line)] bg-[var(--editor-panel)] p-4 shadow-sm">
              <pre className="max-h-[680px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-[var(--editor-ink)]">
                {markdown.trim() || (safeTitle === '无标题' ? '' : `# ${safeTitle}`)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
