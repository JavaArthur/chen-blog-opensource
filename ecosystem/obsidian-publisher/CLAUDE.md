[根目录](../../CLAUDE.md) > [ecosystem](../CLAUDE.md) > **obsidian-publisher**

# obsidian-publisher — Obsidian 一键发布插件

## 模块职责

在 Obsidian 里一键把当前笔记发布成博客草稿，自动处理本地图片 / 外链图 / Obsidian wikilink。

## 入口与启动

- `main.ts`：Obsidian 插件主入口，由 esbuild 打包成 `main.js`。
- `manifest.json`：Obsidian 插件声明。
- 构建：`cd ecosystem/obsidian-publisher && npm install && npm run build`。
- 安装：把产物 `main.js` + `manifest.json` 丢进 `{笔记库}/.obsidian/plugins/channing-blog-publisher/`，在 Obsidian 启用。

## 外部接口依赖

- `POST /api/posts`：建草稿。
- `POST /api/uploads`：上传本地图片 / 音频 / 视频。
- `POST /api/uploads/from-url`：外链图自动转存 R2。

## 支持的媒体

- 图片：png, jpg, jpeg, gif, webp, svg, bmp, ico
- 音频：mp3, wav, ogg, m4a, flac, aac
- 视频：mp4, webm, mov, avi, mkv

## 标题提取顺序

YAML frontmatter `title` → 首个一级标题 `#` → 文件名。

## 使用

- 命令面板：`Cmd/Ctrl + P` → 「发布到 Channing Blog」。
- 侧边栏上传图标。
- 配置：Obsidian 设置 → 第三方插件 → Channing Blog Publisher，填 API URL + Token。

## 关键依赖

- `obsidian`（API 类型）、`esbuild`（打包）、`typescript`。
- 无运行时依赖 npm 包，全部走 `fetch`。

## 常见问题（FAQ）

- **Q：wikilink `![[xxx.png]]` 没上传？** → 检查文件是否在笔记库里存在；插件只扫库内资源。
- **Q：发布后在博客看不到？** → 默认发为草稿，去后台 `/admin/posts` 改状态为已发布。

## 相关文件

- `main.ts`、`manifest.json`、`esbuild.config.mjs`
- `README.md`、`package.json`

## 变更日志

- 2026-04-27：初始化模块文档。
