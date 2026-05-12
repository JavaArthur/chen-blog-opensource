import { NextRequest, NextResponse } from 'next/server'
import { getAppCloudflareEnv } from '@/lib/cloudflare'
import { verifyApiToken } from '@/lib/admin-auth'
import { md, preprocessMarkdown } from '@/lib/wechat-studio/markdown'
import { THEMES } from '@/lib/wechat-studio/themes'

/**
 * Server-side theme application using regex (no DOMParser dependency).
 * Workers runtime does not provide DOMParser.
 */
function applyThemeServerSide(html: string, themeId: string): string {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const styles = theme.styles

  // Apply inline styles to each selector via regex replacement
  const tagStyleMap: Record<string, string> = {}
  for (const selector of Object.keys(styles)) {
    if (selector === 'container') continue
    if (selector === 'pre code') continue
    // "h1" → "h1", "p" → "p", "blockquote" → "blockquote", etc.
    // "code" → inline code only (skip <pre><code>)
    tagStyleMap[selector] = styles[selector]
  }

  // For each HTML tag with a matching style, inject the style attribute
  for (const [tag, styleStr] of Object.entries(tagStyleMap)) {
    if (tag === 'code') {
      // Inline code only: <code> NOT inside <pre>
      // Replace <code> that is NOT preceded by <pre>
      html = html.replace(/<code(?![^>]*class="hljs")([^>]*)>/g, (match, attrs) => {
        // Skip if already inside a pre block (check context)
        const existingStyle = attrs.match(/style="([^"]*)"/)
        const combined = existingStyle ? `${existingStyle[1]}; ${styleStr}` : styleStr
        const newAttrs = existingStyle ? attrs.replace(/style="[^"]*"/, `style="${combined}"`) : `${attrs} style="${combined}"`
        return `<code${newAttrs}>`
      })
      continue
    }

    // General tags: <h1>, <h2>, <p>, <blockquote>, etc.
    const openTagRegex = new RegExp(`<${tag}([^>]*)>`, 'g')
    html = html.replace(openTagRegex, (match, attrs) => {
      const existingStyle = attrs.match(/style="([^"]*)"/)
      const combined = existingStyle ? `${existingStyle[1]}; ${styleStr}` : styleStr
      const newAttrs = existingStyle ? attrs.replace(/style="[^"]*"/, `style="${combined}"`) : `${attrs} style="${combined}"`
      return `<${tag}${newAttrs}>`
    })
  }

  // Apply code block styles (pre + hljs)
  if (styles['pre code'] || styles['pre']) {
    const preStyle = styles['pre'] || ''
    const codeStyle = styles['pre code'] || ''
    html = html.replace(/<pre([^>]*)>/g, (match, attrs) => {
      const existing = attrs.match(/style="([^"]*)"/)
      const combined = existing ? `${existing[1]}; ${preStyle}` : preStyle
      const newAttrs = existing ? attrs.replace(/style="[^"]*"/, `style="${combined}"`) : `${attrs} style="${combined}"`
      return `<pre${newAttrs}>`
    })
  }

  // Wrap in container div with container style
  const containerStyle = styles.container || ''
  html = `<div style="${containerStyle}">${html}</div>`

  return html
}

/**
 * Server-side WeChat compatibility using regex (no DOMParser).
 * Covers the critical transformations: flex→table, CJK punctuation, style inheritance.
 */
function makeWeChatCompatibleServerSide(html: string, themeId: string): string {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const containerStyle = theme.styles.container || ''

  // 1. Remove internal editor attributes
  html = html.replace(/ data-md-type="[^"]*"/g, '')
  html = html.replace(/ data-md-index="[^"]*"/g, '')

  // 2. Convert flex image wrappers to table layout
  // Match paragraphs/divs with display:flex that contain images
  html = html.replace(/<(p|div)([^>]*)class="image-grid"([^>]*)>([\s\S]*?)<\/(p|div)>/g, (match) => {
    // Extract images from the grid
    const imgs = match.match(/<img[^>]*>/g) || []
    if (imgs.length === 0) return match

    const tds = imgs.map(img => `<td style="padding: 0 4px; vertical-align: top; border: none !important; background: transparent !important;">${img}</td>`).join('')
    return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: none !important;"><tbody><tr style="border: none !important; background: transparent !important;">${tds}</tr></tbody></table>`
  })

  // 3. Strip display:flex on non-image elements (WeChat ignores flex)
  html = html.replace(/style="([^"]*display:\s*flex[^"]*)"/g, (_, style) => {
    return `style="${style.replace(/display:\s*flex;?/g, 'display: block;')}"`
  })

  // 4. Force style inheritance - inject container font/color/line-height into text blocks
  const fontMatch = containerStyle.match(/font-family:\s*([^;]+);/)
  const sizeMatch = containerStyle.match(/font-size:\s*([^;]+);/)
  const colorMatch = containerStyle.match(/color:\s*([^;]+);/)
  const lineHeightMatch = containerStyle.match(/line-height:\s*([^;]+);/)

  const inheritProps: string[] = []
  if (fontMatch) inheritProps.push(`font-family: ${fontMatch[1]};`)
  if (lineHeightMatch) inheritProps.push(`line-height: ${lineHeightMatch[1]};`)
  if (colorMatch) inheritProps.push(`color: ${colorMatch[1]};`)
  const inheritStr = inheritProps.join(' ')

  // Add to <p>, <li>, <blockquote> that don't already have these properties
  if (inheritStr) {
    html = html.replace(/<(p|li|blockquote)([^>]*)>/g, (match, tag, attrs) => {
      const existing = attrs.match(/style="([^"]*)"/)
      if (existing) {
        let style = existing[1]
        if (fontMatch && !style.includes('font-family:')) style += ` font-family: ${fontMatch[1]};`
        if (lineHeightMatch && !style.includes('line-height:')) style += ` line-height: ${lineHeightMatch[1]};`
        if (sizeMatch && !style.includes('font-size:')) style += ` font-size: ${sizeMatch[1]};`
        if (colorMatch && !style.includes('color:')) style += ` color: ${colorMatch[1]};`
        return `<${tag} style="${style}">`
      }
      return `<${tag} style="${inheritStr}">`
    })
  }

  // 5. CJK punctuation: keep punctuation attached to preceding inline emphasis
  // </strong>： → </strong>&#x2060;：
  html = html.replace(/(<\/(?:strong|b|em|span|a|code)>)\s*([：；，。！？、])/g, '$1⁠$2')

  // 6. Convert outer <div> wrapper to <section> for WeChat preference
  html = html.replace(/<div style="([^"]*)">/, `<section style="$1">`)
  html = html.replace(/<\/div>\s*$/, '</section>')

  // 7. Restore list markers (Tailwind preflight removes them)
  html = html.replace(/<ul([^>]*)>/g, (match, attrs) => {
    const existing = attrs.match(/style="([^"]*)"/)
    const style = existing ? `${existing[1]}; list-style-type: disc !important; list-style-position: outside;` : `style="list-style-type: disc !important; list-style-position: outside;"`
    return existing ? `<ul ${attrs.replace(/style="[^"]*"/, `style="${style}"`)}>` : `<ul ${attrs} style="${style}">`
  })

  html = html.replace(/<ol([^>]*)>/g, (match, attrs) => {
    const existing = attrs.match(/style="([^"]*)"/)
    const style = existing ? `${existing[1]}; list-style-type: decimal !important; list-style-position: outside;` : `style="list-style-type: decimal !important; list-style-position: outside;"`
    return existing ? `<ol ${attrs.replace(/style="[^"]*"/, `style="${style}"`)}>` : `<ol ${attrs} style="${style}">`
  })

  return html
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const env = await getAppCloudflareEnv()
  if (!env?.DB) {
    return NextResponse.json({ success: false, error: '数据库未配置' }, { status: 500 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '缺少 Authorization header，格式：Bearer <token>' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  if (!(await verifyApiToken(env.DB, token))) {
    return NextResponse.json({ success: false, error: 'Token 无效或已过期' }, { status: 401 })
  }

  // 2. Parse & validate
  let body: { markdown?: string; theme?: string; fontSize?: string; convertVersion?: string; outputFormat?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: '请求体必须是有效的 JSON' }, { status: 400 })
  }

  const { markdown, theme = 'default', fontSize = 'medium', convertVersion = 'v1', outputFormat = 'fragment' } = body

  if (!markdown || typeof markdown !== 'string') {
    return NextResponse.json({ success: false, error: '缺少 markdown 参数或格式错误' }, { status: 400 })
  }

  const validTheme = THEMES.find(t => t.id === theme)
  if (!validTheme) {
    return NextResponse.json({ success: false, error: `无效的 theme，可用值：${THEMES.map(t => t.id).join(', ')}` }, { status: 400 })
  }

  if (!['small', 'medium', 'large'].includes(fontSize)) {
    return NextResponse.json({ success: false, error: `无效的 fontSize，可用值：small, medium, large` }, { status: 400 })
  }

  if (!['fragment', 'standalone'].includes(outputFormat)) {
    return NextResponse.json({ success: false, error: `无效的 outputFormat，可用值：fragment, standalone` }, { status: 400 })
  }

  // 3. Convert (pure string/regex operations, no DOMParser)
  try {
    const processed = preprocessMarkdown(markdown)
    let html = md.render(processed)
    html = applyThemeServerSide(html, theme)
    html = makeWeChatCompatibleServerSide(html, theme)

    const fontSizeMap = { small: '14px', medium: '16px', large: '18px' }
    const baseFontSize = fontSizeMap[fontSize as keyof typeof fontSizeMap]

    if (outputFormat === 'standalone') {
      const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="晨启AI博客 Markdown 转换器">
  <title>Markdown 转换结果</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; background: #fff; padding: 20px; max-width: 800px; margin: 0 auto; }
    @media (max-width: 768px) { body { padding: 10px; } }
  </style>
</head>
<body style="font-size: ${baseFontSize};">
${html}
</body>
</html>`
      return NextResponse.json({ success: true, html: fullHtml, theme, fontSize, convertVersion, outputFormat: 'standalone' })
    }

    return NextResponse.json({ success: true, html, theme, fontSize, convertVersion, outputFormat: 'fragment' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Markdown 转换失败:', message)
    return NextResponse.json({ success: false, error: `转换失败：${message}` }, { status: 500 })
  }
}