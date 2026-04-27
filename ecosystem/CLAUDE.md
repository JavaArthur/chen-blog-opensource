[根目录](../CLAUDE.md) > **ecosystem**

# ecosystem/ — 配套内容生产工具

## 模块职责

博客主站自带的「内容入口」生态，三个工具共用同一套后台 API（`Authorization: Bearer <API Token>`），Token 在后台 `/admin/settings` 生成。

## 子模块

| 路径 | 入口 | 定位 | 文档 |
|---|---|---|---|
| `chrome-clipper/` | `manifest.json` + `background.js` + `popup.html` | Chrome 扩展，浏览器剪藏 | [chrome-clipper/CLAUDE.md](./chrome-clipper/CLAUDE.md) |
| `obsidian-publisher/` | `main.ts` (esbuild 打包为 `main.js`) | Obsidian 插件，一键发布 | [obsidian-publisher/CLAUDE.md](./obsidian-publisher/CLAUDE.md) |
| `channing-blog-publish-skill/` | `SKILL.md` | Claude Skill，命令行发布 | [channing-blog-publish-skill/CLAUDE.md](./channing-blog-publish-skill/CLAUDE.md) |

## 统一接入

- 后端地址：`https://your-domain.com`（公开仓库已去掉私有默认）。
- 认证：HTTP Header `Authorization: Bearer qm_xxx`。
- 核心接口：`POST /api/posts`（建草稿）、`POST /api/uploads`（图片上传）、`POST /api/uploads/from-url`（外链图转存）。

## 相关文件

- `ecosystem/README.md`
- 各子目录下的 `README.md` 与 `CLAUDE.md`

## 变更日志

- 2026-04-27：初始化模块文档。
