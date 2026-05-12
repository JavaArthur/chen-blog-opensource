import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  verifyApiToken: vi.fn(),
  getAppCloudflareEnv: vi.fn(),
  preprocessMarkdown: vi.fn((content: string) => content),
  mdRender: vi.fn((content: string) => `<p>${content}</p>`),
  applyTheme: vi.fn((html: string) => html),
  makeWeChatCompatible: vi.fn(async (html: string) => html),
  THEMES: [
    { id: 'default', name: 'Default', description: 'Default theme', styles: {} },
    { id: 'modern-tech', name: 'Modern Tech', description: 'Tech theme', styles: {} },
  ],
}))

vi.mock('@/lib/admin-auth', () => ({
  verifyApiToken: mocks.verifyApiToken,
}))

vi.mock('@/lib/cloudflare', () => ({
  getAppCloudflareEnv: mocks.getAppCloudflareEnv,
}))

vi.mock('@/lib/wechat-studio/markdown', () => ({
  preprocessMarkdown: mocks.preprocessMarkdown,
  md: {
    render: mocks.mdRender,
  },
  applyTheme: mocks.applyTheme,
}))

vi.mock('@/lib/wechat-studio/wechat-compat', () => ({
  makeWeChatCompatible: mocks.makeWeChatCompatible,
}))

vi.mock('@/lib/wechat-studio/themes', () => ({
  THEMES: mocks.THEMES,
}))

import { POST } from '@/app/api/v1/convert/route'

describe('/api/v1/convert route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAppCloudflareEnv.mockResolvedValue({
      DB: { kind: 'db' },
    })
  })

  describe('认证测试', () => {
    it('应该拒绝没有 Authorization header 的请求', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: '# Test' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authorization')
    })

    it('应该拒绝格式错误的 Authorization header', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'InvalidFormat',
        },
        body: JSON.stringify({ markdown: '# Test' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Bearer')
    })

    it('应该拒绝无效的 Token', async () => {
      mocks.verifyApiToken.mockResolvedValue(false)

      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_token',
        },
        body: JSON.stringify({ markdown: '# Test' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Token')
      expect(mocks.verifyApiToken).toHaveBeenCalledWith(
        { kind: 'db' },
        'invalid_token'
      )
    })

    it('应该接受有效的 Token', async () => {
      mocks.verifyApiToken.mockResolvedValue(true)

      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({ markdown: '# Test' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.verifyApiToken).toHaveBeenCalledWith(
        { kind: 'db' },
        'qm_valid_token'
      )
    })
  })

  describe('参数验证测试', () => {
    beforeEach(() => {
      mocks.verifyApiToken.mockResolvedValue(true)
    })

    it('应该拒绝非 JSON 请求体', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: 'invalid json',
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('JSON')
    })

    it('应该拒绝缺少 markdown 参数的请求', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({ theme: 'default' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('markdown')
    })

    it('应该拒绝 markdown 参数类型错误', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({ markdown: 123 }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('markdown')
    })

    it('应该拒绝无效的 theme', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({
          markdown: '# Test',
          theme: 'invalid-theme',
        }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('theme')
      expect(data.error).toContain('default')
    })

    it('应该拒绝无效的 fontSize', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({
          markdown: '# Test',
          fontSize: 'invalid-size',
        }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('fontSize')
      expect(data.error).toContain('small')
    })

    it('应该拒绝无效的 outputFormat', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({
          markdown: '# Test',
          outputFormat: 'invalid-format',
        }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('outputFormat')
      expect(data.error).toContain('fragment')
    })
  })

  describe('转换功能测试', () => {
    beforeEach(() => {
      mocks.verifyApiToken.mockResolvedValue(true)
      mocks.preprocessMarkdown.mockImplementation((content: string) => content)
      mocks.mdRender.mockImplementation((content: string) => `<p>${content}</p>`)
      mocks.applyTheme.mockImplementation((html: string) => html)
      mocks.makeWeChatCompatible.mockImplementation(async (html: string) => html)
    })

    it('应该成功转换基础 Markdown', async () => {
      const markdown = '# Hello World'

      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({ markdown }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.html).toBeDefined()
      expect(data.theme).toBe('default')
      expect(data.fontSize).toBe('medium')
      expect(data.convertVersion).toBe('v1')

      expect(mocks.preprocessMarkdown).toHaveBeenCalledWith(markdown)
      expect(mocks.mdRender).toHaveBeenCalled()
      expect(mocks.applyTheme).toHaveBeenCalled()
      expect(mocks.makeWeChatCompatible).toHaveBeenCalled()
    })

    it('应该使用默认参数', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({ markdown: '# Test' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(data.theme).toBe('default')
      expect(data.fontSize).toBe('medium')
      expect(data.convertVersion).toBe('v1')
    })

    it('应该应用自定义主题', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({
          markdown: '# Test',
          theme: 'modern-tech',
        }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.theme).toBe('modern-tech')
      expect(mocks.applyTheme).toHaveBeenCalledWith(
        expect.any(String),
        'modern-tech'
      )
    })

    it('应该应用不同的字体大小', async () => {
      const testCases = [
        { fontSize: 'small', expected: '14px' },
        { fontSize: 'medium', expected: '16px' },
        { fontSize: 'large', expected: '18px' },
      ]

      for (const { fontSize, expected } of testCases) {
        const req = new Request('http://localhost/api/v1/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer qm_valid_token',
          },
          body: JSON.stringify({
            markdown: '# Test',
            fontSize,
          }),
        })

        const response = await POST(req)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.fontSize).toBe(fontSize)
        expect(data.html).toContain(`font-size: ${expected}`)
      }
    })

    it('应该处理复杂的 Markdown 内容', async () => {
      const complexMarkdown = `# 标题

## 子标题

这是**加粗**和*斜体*文本。

- 列表项 1
- 列表项 2

\`\`\`javascript
console.log('Hello');
\`\`\`

> 引用文本
`

      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({ markdown: complexMarkdown }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.preprocessMarkdown).toHaveBeenCalledWith(complexMarkdown)
    })

    it('应该生成 fragment 格式（默认）', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({ markdown: '# Test' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.outputFormat).toBe('fragment')
      expect(data.html).toContain('<section')
      expect(data.html).not.toContain('<!DOCTYPE html>')
    })

    it('应该生成 standalone 格式的完整 HTML', async () => {
      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({
          markdown: '# Test',
          outputFormat: 'standalone',
        }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.outputFormat).toBe('standalone')
      expect(data.html).toContain('<!DOCTYPE html>')
      expect(data.html).toContain('<html lang="zh-CN">')
      expect(data.html).toContain('<head>')
      expect(data.html).toContain('<body>')
      expect(data.html).toContain('<meta charset="UTF-8">')
      expect(data.html).toContain('<meta name="viewport"')
    })
  })

  describe('错误处理测试', () => {
    beforeEach(() => {
      mocks.verifyApiToken.mockResolvedValue(true)
    })

    it('应该处理数据库未配置的情况', async () => {
      mocks.getAppCloudflareEnv.mockResolvedValue({ DB: null })

      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({ markdown: '# Test' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('数据库')
    })

    it('应该处理转换过程中的错误', async () => {
      mocks.mdRender.mockImplementation(() => {
        throw new Error('Render error')
      })

      const req = new Request('http://localhost/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qm_valid_token',
        },
        body: JSON.stringify({ markdown: '# Test' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('转换失败')
    })
  })
})
