[根目录](../CLAUDE.md) > **components**

# components/ — React UI 组件

## 模块职责

前台主题组件、后台管理表单、以及富文本编辑器相关的可复用 UI。都是 React 19 + Tailwind v4。

## 入口与启动

无独立入口；被 `app/` 下的页面按需 import。默认 Server Component，带交互的使用 `'use client'`。

## 关键类别

- **编辑器** (`components/editor/*`)：Tiptap 3.x 编辑器壳、工具栏、图片上传 UI、粘贴转存 toast 出口。
- **后台** (`components/admin/*` 或 `components/forms/*`)：文章编辑、分类/标签管理、AI 配置、API Token 管理表单。
- **前台主题**：4 套主题的卡片/列表/详情组件；布局入口在 `app/layout.tsx` 和 `app/page.tsx`。
- **通用 UI**：按钮、Modal、Toast、下拉等基础组件。

## 关键依赖

- Tiptap：`@tiptap/react`、`@tiptap/starter-kit`、`@tiptap/extension-{image,table,...}`、`tiptap-markdown`。
- Markdown 互转：`turndown`（HTML→MD）、`remark` + `remark-gfm` + `remark-html`（MD→HTML）。
- 图标：`lucide-react`。
- 裁图：`react-easy-crop`。

## 测试与质量

- 复杂交互组件（编辑器粘贴钩子）建议配合 `lib/` 的纯函数单测覆盖核心逻辑；组件层本身不强测。

## 常见问题（FAQ）

- **Q：编辑器里粘贴外链图会怎样？** → 粘贴钩子调 `lib/remote-image-rehost.ts` → `/api/uploads/from-url`，替换 src，顶部 toast 提示。
- **Q：想加个新 Tiptap 扩展？** → 去 `lib/editor-extensions.tsx` 统一注册，不要散落在组件里。

## 相关文件

- `components/editor/**`
- `components/admin/**`
- `components/ui/**`

## 变更日志

- 2026-04-27：初始化模块文档。
