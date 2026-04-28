[根目录](../../CLAUDE.md) > [ecosystem](../CLAUDE.md) > **channing-blog-publish-skill**

# channing-blog-publish-skill — Claude Skill 发布工具

## 模块职责

一个 Claude Skill：在 Claude Code 里用命令或自然语言，把本地 Markdown / 网页内容直接发布到博客。

## 入口

- `SKILL.md`：Skill 声明与行为描述（必须保留）。
- 可选的 helper 脚本（若有），一并随 skill 目录分发。

## 安装

```bash
# 软链接最省心
ln -s "$(pwd)/ecosystem/channing-blog-publish-skill" \
      "$HOME/.claude/skills/channing-blog-publish"
```

## 配置（二选一）

### 方式一：环境变量

```bash
export CHANNING_BLOG_API_TOKEN="qm_xxx"
# 可选
export CHANNING_BLOG_API_URL="https://your-domain.com"
```

### 方式二：配置文件

`~/.claude/skills/channing-blog-publish/config.json`：

```json
{
  "apiUrl": "https://your-domain.com",
  "token": "qm_xxx"
}
```

Token 在博客后台 `设置 -> API Token` 生成。

## 使用示例

```bash
/channing-blog-publish ~/Documents/my-article.md
/channing-blog-publish https://example.com/article
```

也可以口头说「把这篇文章发到博客」「发布成草稿」。

## 能力

- 本地 Markdown 文件发布
- 抓网页正文发布
- 本地图 + 外链图自动上传
- 指定分类、发布状态（草稿 / 已发布）

## 常见问题（FAQ）

- **Q：Claude Code 找不到 skill？** → 确认软链在 `~/.claude/skills/` 下且目录名匹配。
- **Q：Token 无权限？** → 后台 Token 要勾选 posts/uploads 权限。

## 相关文件

- `SKILL.md`
- `README.md`

## 变更日志

- 2026-04-28：SKILL.md v2 — 对齐后端完整字段、修正 Edit URL (`?edit=` 不是 `?slug=`)、补错误码表、加 `--yes` / `--json` / `--dry-run`、外链图走 `/api/uploads/from-url`、frontmatter 支持 unlisted / password / tags / cover / slug。
- 2026-04-27：初始化模块文档。
