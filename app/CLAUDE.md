[根目录](../CLAUDE.md) > **app**

# app/ — Next.js 路由层

## 模块职责

承载 Next.js 16 App Router 的全部路由：
- `app/page.tsx` 与 `app/[slug]/page.tsx` 构成前台（首页 + 文章详情），含 4 套主题切换（由 `lib/site-config` 决定）。
- `app/admin/**` 承载后台管理页面，登录口令走 `ADMIN_PASSWORD` secret。
- `app/api/**/route.ts` 暴露 REST API，ecosystem 里的剪藏、Obsidian、Claude Skill 三个客户端都依赖这一层。

## 入口与启动

- 前台：`/` → `app/page.tsx`；文章：`/[slug]` → `app/[slug]/page.tsx`。
- 后台：`/admin` → `app/admin/layout.tsx` + 子页面。
- 全站 layout：`app/layout.tsx`（注入主题、全局 CSS、Toast 容器等）。

## 外部接口（REST）

| 路径 | 作用 | 备注 |
|---|---|---|
| `POST /api/uploads` | admin 侧文件上传 | 校验 `ADMIN_TOKEN`，写 R2 |
| `POST /api/uploads/from-url` | 外链图片自动转存 R2 | 编辑器粘贴钩子调用；已向上游开 PR |
| `GET /api/images/[...key]` | R2 图片代理读取 | 用于自定义域名场景 |
| `app/api/admin/ai-*` | AI 供应商管理（后台） | 使用 `AI_CONFIG_ENCRYPTION_SECRET` 加密存 Key |
| `app/api/editor/ai-*` | 编辑器内 AI 交互 | 润色、摘要、翻译等 |
| `app/api/posts` 相关 | 文章 CRUD、autosave | autosave 历史曾踩 FTS5 坑，见根 CLAUDE 坑 1 |

## 关键依赖与配置

- `next@16.2.3`、`@opennextjs/cloudflare@^1.19.1`、`react@19.2.4`。
- 富文本依赖 Tiptap 3.x（见 `components/editor`）。
- 运行时绑定由 `wrangler.local.toml` 注入：`DB`（D1）、`IMAGES`（R2）、各 secret。

## 数据模型

不直接写 SQL，统一调用 `lib/repositories/*`。涉及的主要表：`posts`、`tags`、`categories`、`post_tags`、`ai_providers`、`api_tokens`。字段定义见 [`db/schema.sql`](../db/schema.sql)。

## 测试与质量

- 页面类目前无自动化测试；API 层建议走 Vitest 针对 `lib/repositories` 做单测（比拦截 Route Handler 更稳）。
- Lint：`npm run lint`（eslint-config-next）。

## 常见问题（FAQ）

- **Q：autosave 500？** → 多半是 D1 FTS5 坏了，按根 CLAUDE「坑 1」处理。
- **Q：粘贴的外链图裂图？** → 编辑器会自动走 `/api/uploads/from-url` 转存，若仍失败，手动另存上传。
- **Q：想加新 API？** → 在 `app/api/<name>/route.ts` 建文件，业务逻辑走 `lib/`，别在 Route 里写 SQL。

## 相关文件

- `app/layout.tsx`、`app/page.tsx`、`app/[slug]/page.tsx`
- `app/admin/**`（登录、文章、媒体、AI 配置、API Token）
- `app/api/**/route.ts`

## 变更日志

- 2026-04-27：初始化模块文档。
