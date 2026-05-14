# Markdown 转微信 HTML 接口详细文档

## 接口概述

将 Markdown 文本转换为微信公众号编辑器兼容的富文本 HTML 格式，支持多种主题和字体大小配置。

**接口地址：** `POST /api/v1/convert`

**认证方式：** Bearer Token

---

## 快速开始

### 1. 获取 API Token

登录管理后台 → API Token 管理 → 创建新 Token

### 2. 发起请求

```bash
curl -X POST "https://note.aichanning.cn/api/v1/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qm_xxxxxxxxxxxxx" \
  -d '{
    "markdown": "# 你好，世界\n\n这是一段**加粗**文本。",
    "theme": "apple",
    "fontSize": "medium"
  }'
```

### 3. 复制 HTML 到微信编辑器

如果走程序调用，读取返回 JSON 里的 `html` 字段，并以 HTML 富文本写入剪贴板。  
如果要人工复制到微信公众号编辑器，请传 `outputFormat: "standalone"` 和 `responseFormat: "html"`，接口会直接返回可打开的排版页面，点击页面里的复制按钮后粘贴到微信正文区。

---

## 请求参数详解

### markdown（必需）

**类型：** `string`

**说明：** 要转换的 Markdown 文本内容

**支持的 Markdown 语法：**
- 标题：`# H1`、`## H2`、`### H3` 等
- 加粗：`**粗体**`
- 斜体：`*斜体*`
- 删除线：`~~删除~~`
- 引用：`> 引用内容`
- 列表：`- 无序列表`、`1. 有序列表`
- 代码块：` ```language\ncode\n``` `
- 行内代码：`` `code` ``
- 链接：`[文本](url)`
- 图片：`![alt](url)`
- 分隔线：`---`
- 表格：标准 Markdown 表格语法

**示例：**
```json
{
  "markdown": "# 标题\n\n这是**加粗**文本。\n\n```javascript\nconsole.log('Hello');\n```"
}
```

---

### theme（可选）

**类型：** `string`

**默认值：** `"apple"`

**说明：** 应用的主题样式

**可用主题列表：**

#### 经典主题（Classic）
- `apple` - Mac 风格（纯净现代，适合日常记录）
- `wechat` - 微信公众号原生（官方绿底纹）
- `claude` - Claude 风格（温润长文）
- `green-orange` - 绿橙主题（活力清新）
- `purple-blue` - 紫蓝主题（优雅神秘）

#### 现代主题（Modern）
- `modern-tech` - 现代科技（科技感强，适合技术文章）
- `modern-minimal` - 极简现代（简约大方）
- `modern-elegant` - 优雅现代（精致优雅）

#### 额外主题（Extra）
- `extra-dark` - 暗黑主题（深色背景，护眼）
- `extra-warm` - 温暖主题（暖色调，温馨）
- `extra-cool` - 清凉主题（冷色调，清爽）

**主题特性对比：**

| 主题 | 色调 | 适用场景 | 特点 |
|------|------|----------|------|
| `default` | 蓝色 | 通用 | 专业、稳重、易读 |
| `green-orange` | 绿橙 | 活力内容 | 清新、活泼、醒目 |
| `purple-blue` | 紫蓝 | 创意内容 | 优雅、神秘、高级 |
| `modern-tech` | 科技蓝 | 技术文章 | 现代、科技感强 |
| `modern-minimal` | 黑白灰 | 极简风格 | 简约、大方、专注内容 |
| `modern-elegant` | 金色 | 高端内容 | 精致、优雅、奢华 |
| `extra-dark` | 深色 | 夜间阅读 | 护眼、沉浸感强 |
| `extra-warm` | 暖色 | 温馨内容 | 温暖、亲切、舒适 |
| `extra-cool` | 冷色 | 清爽内容 | 清凉、清爽、冷静 |

**示例：**
```json
{
  "markdown": "# 技术文章",
  "theme": "apple"
}
```

---

### fontSize（可选）

**类型：** `string`

**默认值：** `"medium"`

**可用值：**
- `small` - 小字体（14px）
- `medium` - 中等字体（16px）
- `large` - 大字体（18px）

**说明：** 控制整体文本的基础字体大小

**示例：**
```json
{
  "markdown": "# 标题",
  "fontSize": "large"
}
```

---

### outputFormat（可选）

**类型：** `string`

**默认值：** `"fragment"`

**可用值：**
- `fragment` - HTML 片段（用于粘贴到微信编辑器）
- `standalone` - 完整的 HTML 文档（可独立访问；配合 `responseFormat: "html"` 时直接返回页面）

**说明：** 控制输出的 HTML 格式

**fragment 模式：**
- 返回 HTML 片段（`<section>...</section>`）
- 适合直接粘贴到微信公众号编辑器
- 保留所有样式和格式

**standalone 模式：**
- 返回完整的 HTML 文档（包含 `<!DOCTYPE html>`、`<head>`、`<body>` 等）
- 可以保存为 `.html` 文件并在浏览器中独立打开
- 包含基础样式和响应式布局
- 适合预览、分享或存档

**示例：**
```json
{
  "markdown": "# 标题",
  "outputFormat": "standalone"
}
```

---

### responseFormat（可选）

**类型：** `string`

**默认值：** `"json"`

**可用值：**
- `json` - 返回 JSON，HTML 放在 `html` 字段里，适合程序调用
- `html` - 直接返回 `text/html; charset=utf-8`，适合浏览器打开后复制到微信编辑器

**示例：**
```json
{
  "markdown": "# 标题",
  "theme": "apple",
  "outputFormat": "standalone",
  "responseFormat": "html"
}
```

也可以通过请求头触发 HTML 响应：

```bash
curl -X POST "https://note.aichanning.cn/api/v1/convert" \
  -H "Authorization: Bearer qm_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -H "Accept: text/html" \
  -d '{"markdown":"# 标题\n\n这是**加粗**文本。","theme":"apple","outputFormat":"standalone"}' \
  -o wechat-preview.html
```

---

### convertVersion（可选）

**类型：** `string`

**默认值：** `"v1"`

**说明：** 转换引擎版本标识，用于未来版本兼容

**当前可用值：**
- `v1` - 当前版本

---

## 响应格式

### 成功响应

**HTTP 状态码：** `200`

**响应体：**
```json
{
  "success": true,
  "html": "<section style=\"font-size: 16px;\">...</section>",
  "theme": "apple",
  "fontSize": "medium",
  "convertVersion": "v1"
}
```

**字段说明：**
- `success` - 是否成功（`true`）
- `html` - 转换后的 HTML 内容
  - `fragment` 模式：HTML 片段，可直接粘贴到微信编辑器
  - `standalone` 模式：完整的 HTML 文档，可保存为 .html 文件独立访问
- `theme` - 使用的主题
- `fontSize` - 使用的字体大小
- `convertVersion` - 转换版本
- `outputFormat` - 输出格式

当 `responseFormat` 为 `html`，或请求头 `Accept` 包含 `text/html` 时，成功响应体不是 JSON，而是 `text/html`：
- `outputFormat: "fragment"`：返回可作为富文本片段写入剪贴板的 `<section>...</section>`
- `outputFormat: "standalone"`：返回完整 HTML 页面，页面内置“复制到微信编辑器”按钮

---

### 错误响应

#### 认证失败（401）

```json
{
  "success": false,
  "error": "缺少 Authorization header，格式：Bearer <token>"
}
```

或

```json
{
  "success": false,
  "error": "Token 无效或已过期"
}
```

#### 参数错误（400）

```json
{
  "success": false,
  "error": "缺少 markdown 参数或格式错误"
}
```

或

```json
{
  "success": false,
  "error": "无效的 theme，可用值：default, green-orange, purple-blue, ..."
}
```

或

```json
{
  "success": false,
  "error": "无效的 fontSize，可用值：small, medium, large"
}
```

#### 服务器错误（500）

```json
{
  "success": false,
  "error": "数据库未配置"
}
```

或

```json
{
  "success": false,
  "error": "转换失败，请检查 Markdown 格式"
}
```

---

## 完整示例

### 示例 1：基础转换

**请求：**
```bash
curl -X POST "https://note.aichanning.cn/api/v1/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qm_abc123def456ghi789jkl012mno345" \
  -d '{
    "markdown": "# Hello World\n\nThis is a **bold** text."
  }'
```

**响应：**
```json
{
  "success": true,
  "html": "<section style=\"font-size: 16px;\"><h1>Hello World</h1><p>This is a <strong>bold</strong> text.</p></section>",
  "theme": "default",
  "fontSize": "medium",
  "convertVersion": "v1"
}
```

---

### 示例 2：生成完整 HTML 文档（可独立访问）

**请求：**
```bash
curl -X POST "https://note.aichanning.cn/api/v1/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qm_abc123def456ghi789jkl012mno345" \
  -d '{
    "markdown": "# Hello World\n\nThis is a **bold** text.",
    "outputFormat": "standalone"
  }'
```

**响应：**
```json
{
  "success": true,
  "html": "<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <meta name=\"generator\" content=\"晨启AI博客 Markdown 转换器\">\n  <title>Markdown 转换结果</title>\n  <style>...</style>\n</head>\n<body>\n  <section style=\"font-size: 16px;\">...</section>\n</body>\n</html>",
  "theme": "default",
  "fontSize": "medium",
  "convertVersion": "v1",
  "outputFormat": "standalone"
}
```

**使用方式：**
```bash
# 保存为 HTML 文件
curl -X POST "https://note.aichanning.cn/api/v1/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qm_abc123def456ghi789jkl012mno345" \
  -d '{"markdown": "# 标题", "outputFormat": "standalone"}' \
  | jq -r '.html' > output.html

# 在浏览器中打开
open output.html
```

---

### 示例 3：使用自定义主题和字体

**请求：**
```bash
curl -X POST "https://note.aichanning.cn/api/v1/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qm_abc123def456ghi789jkl012mno345" \
  -d '{
    "markdown": "# 技术分享\n\n## 代码示例\n\n```javascript\nconst greeting = \"Hello\";\nconsole.log(greeting);\n```\n\n这是一段技术文章。",
    "theme": "modern-tech",
    "fontSize": "large"
  }'
```

**响应：**
```json
{
  "success": true,
  "html": "<section style=\"font-size: 18px;\">...</section>",
  "theme": "modern-tech",
  "fontSize": "large",
  "convertVersion": "v1"
}
```

---

### 示例 4：复杂 Markdown

**请求：**
```bash
curl -X POST "https://note.aichanning.cn/api/v1/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qm_abc123def456ghi789jkl012mno345" \
  -d @- << 'EOF'
{
  "markdown": "# 完整示例\n\n## 文本样式\n\n这是**加粗**、*斜体*、~~删除线~~。\n\n## 列表\n\n- 无序列表 1\n- 无序列表 2\n  - 嵌套列表\n\n1. 有序列表 1\n2. 有序列表 2\n\n## 引用\n\n> 这是一段引用文本。\n> 可以多行。\n\n## 代码\n\n行内代码：`const x = 1;`\n\n代码块：\n\n```python\ndef hello():\n    print(\"Hello, World!\")\n```\n\n## 链接和图片\n\n[链接文本](https://example.com)\n\n![图片描述](https://example.com/image.jpg)\n\n## 表格\n\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| A   | B   | C   |\n| 1   | 2   | 3   |\n\n---\n\n分隔线",
  "theme": "default",
  "fontSize": "medium"
}
EOF
```

---

## 使用场景

### 1. 博客同步到微信公众号

将博客文章的 Markdown 源文件转换为微信格式，实现一键发布。

### 2. 内容管理系统集成

在 CMS 中集成此接口，为编辑提供微信预览和导出功能。

### 3. 自动化发布工具

结合微信公众号 API，实现文章的自动化发布流程。

### 4. Markdown 编辑器插件

为 Markdown 编辑器（如 Obsidian、Typora）开发插件，一键转换并复制。

---

## 最佳实践

### 1. Token 安全

- ✅ 将 Token 存储在环境变量或配置文件中
- ✅ 不要在前端代码中硬编码 Token
- ✅ 定期轮换 Token
- ❌ 不要将 Token 提交到版本控制系统

### 2. 错误处理

```javascript
async function convertMarkdown(markdown, theme = 'default') {
  try {
    const response = await fetch('https://note.aichanning.cn/api/v1/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_TOKEN}`
      },
      body: JSON.stringify({ markdown, theme })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data.html;
  } catch (error) {
    console.error('转换失败:', error.message);
    throw error;
  }
}
```

### 3. 批量转换

如需批量转换，建议添加延迟避免过载：

```javascript
async function batchConvert(markdownList) {
  const results = [];
  for (const markdown of markdownList) {
    const html = await convertMarkdown(markdown);
    results.push(html);
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 延迟
  }
  return results;
}
```

---

## 技术细节

### 转换流程

1. **预处理**：清理和规范化 Markdown 文本
2. **渲染**：使用 MarkdownIt 引擎渲染为 HTML
3. **代码高亮**：使用 highlight.js 进行语法高亮
4. **主题应用**：根据选择的主题应用 CSS 样式
5. **字体调整**：应用字体大小设置
6. **微信兼容**：确保输出的 HTML 兼容微信编辑器

### 代码高亮

- 支持 180+ 编程语言
- 自动语言检测
- macOS 风格的代码块装饰（红黄绿三色圆点）

### 图片处理

- 单张图片：居中显示，最大宽度 100%
- 多张图片：智能布局（2张并排、3张网格等）
- 支持图片描述（alt 文本）

---

## 常见问题

### Q: Token 在哪里获取？

A: 登录管理后台 → API Token 管理 → 创建新 Token。Token 仅在创建时显示一次，请妥善保存。

### Q: 转换后的 HTML 如何使用？

A: 直接复制 `html` 字段的内容，粘贴到微信公众号编辑器即可。样式会自动保留。

### Q: 支持哪些 Markdown 语法？

A: 支持标准 Markdown 语法，包括标题、列表、引用、代码块、表格、链接、图片等。

### Q: 可以自定义主题吗？

A: 目前提供 9 种预设主题。如需自定义主题，请联系管理员或提交 PR。

### Q: 有速率限制吗？

A: 目前暂无速率限制，建议合理使用。

### Q: 转换失败怎么办？

A: 检查 Markdown 格式是否正确，特别是代码块的闭合。如持续失败，请联系技术支持。

---

## 更新日志

### v1 (2025-01-XX)
- ✅ 初始版本发布
- ✅ 支持 9 种主题
- ✅ 支持 3 种字体大小
- ✅ 支持完整 Markdown 语法
- ✅ 代码高亮（180+ 语言）
- ✅ 智能图片布局

---

## 技术支持

如有问题或建议，请：
- 提交 GitHub Issue
- 联系管理员
- 查看项目文档

---

**Happy Coding! 🚀**
