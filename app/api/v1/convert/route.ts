import { NextRequest, NextResponse } from 'next/server'
import { getAppCloudflareEnv } from '@/lib/cloudflare'
import { verifyApiToken } from '@/lib/admin-auth'
import { md, preprocessMarkdown, applyTheme } from '@/lib/wechat-studio/markdown'
import { makeWeChatCompatible } from '@/lib/wechat-studio/wechat-compat'
import { THEMES } from '@/lib/wechat-studio/themes'

/**
 * POST /api/v1/convert
 *
 * Markdown 转微信 HTML 接口
 *
 * 认证方式：Bearer Token
 * Header: Authorization: Bearer qm_xxxxx
 *
 * 请求体：
 * {
 *   "markdown": "# 标题\n\n正文内容",
 *   "theme": "default",           // 可选，默认 "default"
 *   "fontSize": "medium",         // 可选，默认 "medium"
 *   "outputFormat": "fragment",   // 可选，默认 "fragment"，可选值：fragment（片段）、standalone（完整HTML）
 *   "convertVersion": "v1"        // 可选，默认 "v1"
 * }
 *
 * 响应：
 * {
 *   "success": true,
 *   "html": "<section>...</section>",  // fragment 模式：HTML 片段，用于粘贴到微信编辑器
 *                                       // standalone 模式：完整的 HTML 文档，可独立访问
 *   "theme": "default",
 *   "fontSize": "medium",
 *   "outputFormat": "fragment"
 * }
 */
export async function POST(req: NextRequest) {
  // 1. 认证检查
  const env = await getAppCloudflareEnv()
  if (!env?.DB) {
    return NextResponse.json(
      { success: false, error: '数据库未配置' },
      { status: 500 }
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: '缺少 Authorization header，格式：Bearer <token>' },
      { status: 401 }
    )
  }

  const token = authHeader.slice(7)
  const isValid = await verifyApiToken(env.DB, token)
  if (!isValid) {
    return NextResponse.json(
      { success: false, error: 'Token 无效或已过期' },
      { status: 401 }
    )
  }

  // 2. 参数验证
  let body: {
    markdown?: string
    theme?: string
    fontSize?: string
    convertVersion?: string
    outputFormat?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: '请求体必须是有效的 JSON' },
      { status: 400 }
    )
  }

  const { markdown, theme = 'default', fontSize = 'medium', convertVersion = 'v1', outputFormat = 'fragment' } = body

  if (!markdown || typeof markdown !== 'string') {
    return NextResponse.json(
      { success: false, error: '缺少 markdown 参数或格式错误' },
      { status: 400 }
    )
  }

  // 验证 theme 是否存在
  const validTheme = THEMES.find(t => t.id === theme)
  if (!validTheme) {
    const availableThemes = THEMES.map(t => t.id).join(', ')
    return NextResponse.json(
      { success: false, error: `无效的 theme，可用值：${availableThemes}` },
      { status: 400 }
    )
  }

  // 验证 fontSize
  const validFontSizes = ['small', 'medium', 'large']
  if (!validFontSizes.includes(fontSize)) {
    return NextResponse.json(
      { success: false, error: `无效的 fontSize，可用值：${validFontSizes.join(', ')}` },
      { status: 400 }
    )
  }

  // 验证 outputFormat
  const validOutputFormats = ['fragment', 'standalone']
  if (!validOutputFormats.includes(outputFormat)) {
    return NextResponse.json(
      { success: false, error: `无效的 outputFormat，可用值：${validOutputFormats.join(', ')}` },
      { status: 400 }
    )
  }

  // 3. 执行转换
  try {
    // 预处理 Markdown
    const processed = preprocessMarkdown(markdown)

    // 渲染为 HTML
    let html = md.render(processed)

    // 应用主题
    html = applyTheme(html, theme)

    // 应用微信兼容处理（关键！）
    html = await makeWeChatCompatible(html, theme)

    // 应用字体大小（通过包裹 section 标签）
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    const baseFontSize = fontSizeMap[fontSize as keyof typeof fontSizeMap]
    const contentHtml = `<section style="font-size: ${baseFontSize};">${html}</section>`

    // 根据 outputFormat 返回不同格式
    if (outputFormat === 'standalone') {
      // 返回完整的 HTML 文档
      const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="晨启AI博客 Markdown 转换器">
  <title>Markdown 转换结果</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
${contentHtml}
</body>
</html>`

      return NextResponse.json({
        success: true,
        html: fullHtml,
        theme,
        fontSize,
        convertVersion,
        outputFormat: 'standalone'
      })
    }

    // 默认返回 fragment（用于微信编辑器粘贴）
    return NextResponse.json({
      success: true,
      html: contentHtml,
      theme,
      fontSize,
      convertVersion,
      outputFormat: 'fragment'
    })
  } catch (error) {
    console.error('Markdown 转换失败:', error)
    return NextResponse.json(
      { success: false, error: '转换失败，请检查 Markdown 格式' },
      { status: 500 }
    )
  }
}
