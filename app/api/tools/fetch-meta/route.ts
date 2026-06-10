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

    let icon =
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, html) ||
      pick(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i, html)
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
