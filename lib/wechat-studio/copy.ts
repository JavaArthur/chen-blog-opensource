'use client'

import { md, preprocessMarkdown, applyTheme } from './markdown'
import { makeWeChatCompatible } from './wechat-compat'

function absolutizeMarkdownUrls(markdown: string) {
  if (typeof window === 'undefined') return markdown
  return markdown.replace(/\]\(\//g, `](${window.location.origin}/`)
}

async function writeClipboardHtml(html: string, plainText: string) {
  if (window.isSecureContext && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      }),
    ])
    return
  }

  await new Promise<void>((resolve, reject) => {
    const textarea = document.createElement('textarea')
    textarea.value = plainText
    textarea.setAttribute('readonly', 'true')
    textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'

    const handler = (event: ClipboardEvent) => {
      event.preventDefault()
      event.clipboardData?.setData('text/html', html)
      event.clipboardData?.setData('text/plain', plainText)
    }

    document.body.appendChild(textarea)
    document.addEventListener('copy', handler)
    textarea.select()

    try {
      if (!document.execCommand('copy')) throw new Error('copy failed')
      resolve()
    } catch (error) {
      reject(error instanceof Error ? error : new Error('copy failed'))
    } finally {
      document.removeEventListener('copy', handler)
      textarea.remove()
    }
  })
}

export function renderWechatStudioMarkdown(markdown: string, themeId: string) {
  const rawHtml = md.render(preprocessMarkdown(absolutizeMarkdownUrls(markdown)))
  return applyTheme(rawHtml, themeId)
}

export async function copyMarkdownAsWechatArticleFormat(markdown: string, themeId = 'apple') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('当前环境不支持复制')
  }

  const renderedHtml = renderWechatStudioMarkdown(markdown, themeId)
  const compatibleHtml = await makeWeChatCompatible(renderedHtml, themeId)
  const plainText = new DOMParser()
    .parseFromString(compatibleHtml, 'text/html')
    .body.textContent?.trim() || markdown.trim()

  await writeClipboardHtml(compatibleHtml, plainText)
}
