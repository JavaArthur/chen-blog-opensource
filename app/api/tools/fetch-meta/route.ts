import {
  ensureAuthenticatedRequest,
  getRouteEnvWithDb,
  jsonError,
  jsonOk,
  parseJsonBody,
} from '@/lib/server/route-helpers'
import type { ToolType } from '@/lib/repositories/tools'
import type { NextRequest } from 'next/server'

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim()
}

function pick(re: RegExp, html: string): string | null {
  const m = html.match(re)
  return m?.[1] ? decodeEntities(m[1]) : null
}

// 从 <link rel="...icon..."> 提取站点图标 href。
// 逐标签解析以兼容 rel/href 任意书写顺序，并优先选用更高清的 apple-touch-icon。
function pickIconHref(html: string): string | null {
  const candidates: { rel: string; href: string }[] = []
  for (const tag of html.match(/<link[^>]+>/gi) ?? []) {
    const rel = tag.match(/\brel=["']([^"']*)["']/i)?.[1]?.toLowerCase()
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1]
    if (rel && href && rel.includes('icon')) {
      candidates.push({ rel, href: decodeEntities(href) })
    }
  }
  const apple = candidates.find((c) => c.rel.includes('apple-touch-icon'))
  return (apple ?? candidates.find((c) => c.rel.includes('icon')))?.href ?? null
}

// 根据域名猜测工具类型
function guessType(hostname: string): ToolType {
  if (/github\.com|gitlab\.com|gitee\.com|bitbucket\.org/i.test(hostname)) return 'repo'
  if (/apps\.apple\.com|setapp\.com/i.test(hostname)) return 'mac-app'
  return 'url'
}

// 贴 URL 自动抓取标题/描述/图标，供工具墙录入预填
export async function POST(req: NextRequest) {
  const route = await getRouteEnvWithDb('数据库未配置')
  if (!route.ok) return route.response

  const authError = await ensureAuthenticatedRequest(req, route.db)
  if (authError) return authError

  try {
    const payload = await parseJsonBody<{ url?: string }>(req)
    const rawUrl = typeof payload.url === 'string' ? payload.url.trim() : ''
    if (!rawUrl) return jsonError('URL 不能为空', 400)

    let target: URL
    try {
      target = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    } catch {
      return jsonError('URL 格式不正确', 400)
    }

    let html = ''
    try {
      const resp = await fetch(target.href, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChanningBlogBot/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      if (resp.ok) {
        // 只读前 64KB，meta 都在 <head> 里
        html = (await resp.text()).slice(0, 64_000)
      }
    } catch {
      // 抓取失败也返回基础信息，让用户手填
    }

    const title =
      pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i, html) ||
      pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i, html) ||
      pick(/<title[^>]*>([^<]+)<\/title>/i, html) ||
      target.hostname.replace(/^www\./, '')

    const description =
      pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i, html) ||
      pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i, html) ||
      null

    // 站点图标只认 <link rel="icon">，不要用 og:image（那是分享大图/截图，不是图标）
    let icon = pickIconHref(html)
    if (icon && !/^https?:\/\//i.test(icon)) {
      try {
        icon = new URL(icon, target.href).href
      } catch {
        icon = null
      }
    }
    if (!icon) {
      icon = `https://www.google.com/s2/favicons?domain=${target.hostname}&sz=128`
    }

    return jsonOk({
      success: true,
      meta: {
        name: title,
        url: target.href,
        type: guessType(target.hostname),
        description,
        icon,
      },
    })
  } catch (error) {
    console.error('Tool meta fetch error:', error)
    return jsonError('抓取失败', 500)
  }
}
