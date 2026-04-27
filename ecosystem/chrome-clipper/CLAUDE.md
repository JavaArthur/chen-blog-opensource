[根目录](../../CLAUDE.md) > [ecosystem](../CLAUDE.md) > **chrome-clipper**

# chrome-clipper — 浏览器剪藏扩展

## 模块职责

一键把当前网页剪藏成 Markdown，上传图到博客 R2，建成草稿。Chrome Extension Manifest V3，纯 JS 无构建。

## 入口

- `manifest.json`：MV3 声明，权限 `activeTab`、`storage`、`scripting`，`host_permissions: ["<all_urls>"]`。
- `popup.html` + `popup.js`：扩展图标弹窗。
- `background.js`：service worker，处理剪藏流水线。
- `content-scripts/`（若存在）：配合 Readability 抓正文。
- `options.html` / `options.js`：首次使用填 API URL + Token。

## 外部接口依赖

指向博客主站：
- `POST /api/uploads`：上传文章里的图到 R2。
- `POST /api/posts`：建草稿。

## 关键依赖

- [Readability.js](https://github.com/mozilla/readability)：提正文。
- [Turndown](https://github.com/mixmark-io/turndown)：HTML→Markdown。
- 纯 JS，无 npm 构建步骤。

## 安装与使用

1. `chrome://extensions` → 开发者模式 → 加载已解压扩展（选本目录）。
2. 首次点击扩展图标会弹设置页，填 `API URL` + `API Token`。
3. 打开网页 → 扩展图标 → 「剪藏到草稿」→ 「去编辑」跳后台。

## 常见问题（FAQ）

- **Q：剪藏后图裂？** → 可能 R2 读接口域名没配自定义域；走 `GET /api/images/[...key]` 代理即可。
- **Q：Token 失效？** → 后台 `/admin/settings` 重新生成，在扩展 options 里更新。

## 相关文件

- `manifest.json`、`background.js`、`popup.html/js`、`options.html/js`
- `README.md`

## 变更日志

- 2026-04-27：初始化模块文档。
