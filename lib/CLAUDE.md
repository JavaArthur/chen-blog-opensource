[根目录](../CLAUDE.md) > **lib**

# lib/ — 业务与数据访问层

## 模块职责

把 Route Handler 和 UI 层粘合起来的「中间层」：
- **仓储层**（`lib/repositories/*`）：封装所有 D1 读写，是数据访问唯一入口。
- **编辑器辅助**（`lib/editor-*`）：Tiptap 粘贴钩子、图片上传、toast 事件桥。
- **远程图转存**（`lib/remote-image-rehost.ts`）：扫描外链图并调 `/api/uploads/from-url` 转存到 R2。
- **站点配置**（`lib/site-config`）：主题、导航、SEO 元信息。

## 入口与启动

无独立启动；被 `app/` 下的 Route Handler 与 Server Component 按需 import。

## 关键文件

| 文件 | 作用 |
|---|---|
| `lib/repositories/schema.ts` | `ensureSchema()` 运行时列迁移（幂等） |
| `lib/repositories/posts.ts` | 文章 CRUD、autosave、列表查询 |
| `lib/repositories/search.ts` | 搜索；FTS5 优先，LIKE 兜底（见坑 1） |
| `lib/editor-extensions.tsx` | Tiptap 扩展配置 + 粘贴钩子 |
| `lib/editor-file-upload.ts` | 编辑器文件上传辅助 |
| `lib/remote-image-rehost.ts` | 外链图扫描 + 转存（新增） |
| `lib/editor-rehost-toast.ts` | Toast 事件桥（新增） |

## 数据模型

所有 SQL 收敛在 `lib/repositories/`。新增字段或表：
1. 写 `db/migrations/YYYY-MM-DD-*.sql`。
2. 同步更新 `db/schema.sql`。
3. 更新 `lib/repositories/schema.ts` 的 `ensureSchema`（为老库幂等补列）。
4. 补 TS 类型（通常就在对应 repo 文件里）。

## 测试与质量

- 仓储与纯函数类（远程图扫描、markdown 处理）适合 Vitest 单测。
- 副作用（D1 / R2）用轻量 mock，别起真实 wrangler 实例跑单测。

## 常见问题（FAQ）

- **Q：为什么搜索有时走 LIKE？** → D1 FTS5 不稳，已临时禁用（见根 CLAUDE 坑 1）。
- **Q：在哪里改 schema 迁移的触发点？** → `lib/repositories/schema.ts` 的 `ensureSchema()`。

## 相关文件

- `lib/repositories/{posts,search,schema,...}.ts`
- `lib/editor-*.ts(x)`
- `lib/remote-image-rehost.ts`
- `lib/site-config*`

## 变更日志

- 2026-04-27：初始化模块文档。
