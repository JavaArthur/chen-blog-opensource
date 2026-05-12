# API 接口文档

晨启博客系统对外提供的 REST API 接口文档。

## 📋 目录

- [认证方式](#认证方式)
- [Markdown 转微信 HTML](#markdown-转微信-html)
- [文章管理](#文章管理)
- [文件上传](#文件上传)
- [搜索](#搜索)
- [设置](#设置)
- [管理后台](#管理后台)

---

## 认证方式

### Bearer Token 认证

大部分 API 接口支持 Bearer Token 认证，适用于外部系统调用。

**获取 Token：**
1. 登录管理后台：`https://your-domain.com/admin`
2. 进入「API Token 管理」页面
3. 创建新 Token，复制保存（仅显示一次）

**使用方式：**
```bash
curl -X POST "https://your-domain.com/api/v1/convert" \
  -H "Authorization: Bearer qm_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello"}'
```

### Cookie 认证

管理后台操作使用 Cookie 认证（`qmblog_admin`），登录后自动设置。

---

## Markdown 转微信 HTML

### POST /api/v1/convert

将 Markdown 文本转换为微信公众号编辑器兼容的 HTML 格式。

**认证：** Bearer Token（必需）

**请求体：**
```json
{
  "markdown": "# 标题\n\n正文内容",
  "theme": "default",
  "fontSize": "medium",
  "convertVersion": "v1"
}
```

**参数说明：**

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `markdown` | string | ✅ | - | Markdown 文本内容 |
| `theme` | string | ❌ | `default` | 主题 ID，见下方可用主题列表 |
| `fontSize` | string | ❌ | `medium` | 字体大小：`small`、`medium`、`large` |
| `convertVersion` | string | ❌ | `v1` | 转换版本标识 |

**可用主题：**

| Theme ID | 名称 | 分组 |
|----------|------|------|
| `default` | 默认主题 | 经典 |
| `green-orange` | 绿橙主题 | 经典 |
| `purple-blue` | 紫蓝主题 | 经典 |
| `modern-tech` | 现代科技 | 现代 |
| `modern-minimal` | 极简现代 | 现代 |
| `modern-elegant` | 优雅现代 | 现代 |
| `extra-dark` | 暗黑主题 | 额外 |
| `extra-warm` | 温暖主题 | 额外 |
| `extra-cool` | 清凉主题 | 额外 |

**响应示例：**
```json
{
  "success": true,
  "html": "<section style=\"font-size: 16px;\"><h1>标题</h1><p>正文内容</p></section>",
  "theme": "default",
  "fontSize": "medium",
  "convertVersion": "v1"
}
```

**错误响应：**
```json
{
  "success": false,
  "error": "Token 无效或已过期"
}
```

**HTTP 状态码：**
- `200` - 转换成功
- `400` - 参数错误
- `401` - 认证失败
- `500` - 服务器错误

**完整示例：**
```bash
curl -X POST "https://note.aichanning.cn/api/v1/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qm_xxxxxxxxxxxxx" \
  -d '{
    "markdown": "# 标题\n\n正文内容\n\n```javascript\nconsole.log(\"Hello\");\n```",
    "theme": "modern-tech",
    "fontSize": "medium",
    "convertVersion": "v1"
  }'
```

---

## 文章管理

### GET /api/posts

获取文章列表（公开接口，无需认证）。

**查询参数：**
- `page` - 页码（默认 1）
- `limit` - 每页数量（默认 10，最大 100）
- `category` - 分类筛选
- `tag` - 标签筛选

**响应示例：**
```json
{
  "posts": [
    {
      "slug": "hello-world",
      "title": "Hello World",
      "excerpt": "文章摘要",
      "createdAt": "2025-01-01T00:00:00Z",
      "category": "技术",
      "tags": ["JavaScript", "Node.js"]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

---

## 文件上传

### POST /api/uploads

上传文件到 R2 存储（需要管理员认证）。

**认证：** Bearer Token 或 Cookie

**请求体：** `multipart/form-data`

**字段：**
- `file` - 文件对象

**响应示例：**
```json
{
  "success": true,
  "url": "https://your-domain.com/api/images/2025/01/filename.jpg",
  "key": "2025/01/filename.jpg"
}
```

### POST /api/uploads/from-url

从 URL 下载图片并上传到 R2（需要管理员认证）。

**认证：** Bearer Token 或 Cookie

**请求体：**
```json
{
  "url": "https://example.com/image.jpg"
}
```

**响应示例：**
```json
{
  "success": true,
  "url": "https://your-domain.com/api/images/2025/01/image.jpg"
}
```

---

## 搜索

### GET /api/search

全文搜索文章（公开接口，无需认证）。

**查询参数：**
- `q` - 搜索关键词（必需）
- `limit` - 结果数量（默认 10）

**响应示例：**
```json
{
  "results": [
    {
      "slug": "hello-world",
      "title": "Hello World",
      "excerpt": "匹配的文本片段...",
      "score": 0.95
    }
  ],
  "total": 5
}
```

---

## 设置

### GET /api/settings/appearance

获取外观设置（公开接口）。

**响应示例：**
```json
{
  "theme": "light",
  "primaryColor": "#3b82f6"
}
```

### GET /api/settings/font

获取字体设置（公开接口）。

**响应示例：**
```json
{
  "fontFamily": "system-ui",
  "fontSize": "16px"
}
```

---

## 管理后台

以下接口仅供管理后台使用，需要 Cookie 认证。

### POST /api/admin/login

管理员登录。

**请求体：**
```json
{
  "password": "your_admin_password"
}
```

**响应：** 设置 `qmblog_admin` Cookie

### POST /api/admin/logout

管理员登出。

### GET /api/admin/tokens

列出所有 API Token（仅显示前缀）。

**响应示例：**
```json
{
  "tokens": [
    {
      "id": 1,
      "name": "外部调用",
      "token_preview": "qm_abc123...",
      "created_at": 1704067200,
      "last_used_at": 1704153600,
      "is_active": 1
    }
  ]
}
```

### POST /api/admin/tokens

创建新的 API Token。

**请求体：**
```json
{
  "name": "外部调用"
}
```

**响应示例：**
```json
{
  "success": true,
  "token": "qm_xxxxxxxxxxxxx",
  "name": "外部调用"
}
```

⚠️ **重要：** Token 仅在创建时返回一次，请妥善保存！

### DELETE /api/admin/tokens

删除 API Token。

**请求体：**
```json
{
  "id": 1
}
```

### GET /api/admin/settings

获取系统设置。

### POST /api/admin/settings

更新系统设置。

### GET /api/admin/posts/[slug]

获取文章详情（含草稿）。

### PUT /api/admin/posts/[slug]

更新文章。

### DELETE /api/admin/posts/[slug]

删除文章。

### GET /api/admin/categories

获取分类列表。

### POST /api/admin/categories

创建分类。

### PUT /api/admin/categories

更新分类。

### DELETE /api/admin/categories

删除分类。

---

## 错误处理

所有接口遵循统一的错误响应格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

**常见 HTTP 状态码：**
- `200` - 请求成功
- `400` - 请求参数错误
- `401` - 认证失败
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 速率限制

目前暂无速率限制，建议合理使用。未来可能会根据实际情况添加限制。

---

## 更新日志

### 2025-01-XX
- ✅ 新增 `/api/v1/convert` Markdown 转微信 HTML 接口
- ✅ 完善 API 文档

---

## 技术支持

如有问题，请提交 Issue 或联系管理员。
