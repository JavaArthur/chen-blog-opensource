[根目录](../CLAUDE.md) > **db**

# db/ — D1 Schema 与迁移

## 模块职责

Cloudflare D1 的所有结构化定义与种子、迁移脚本都在这里。不放业务查询（查询去 `lib/repositories/`）。

## 关键文件

| 文件 | 作用 |
|---|---|
| `db/schema.sql` | 全表结构；FTS5 部分因坑 1 已注释掉 |
| `db/seed-template.sql` | 首次初始化的默认种子数据 |
| `db/migrations/2026-04-27-drop-fts.sql` | 卸掉损坏的 FTS 虚拟表与触发器 |
| `db/migrations/enable-fts.sql` | 未来 D1 FTS5 稳定后重启搜索 |

## 典型操作

```bash
# 首次建库（走 scripts/cf-init.sh 自动调用）
npx wrangler d1 execute DB --remote --file=db/schema.sql -c wrangler.local.toml
npx wrangler d1 execute DB --remote --file=db/seed-template.sql -c wrangler.local.toml

# 跑一个迁移
npx wrangler d1 execute DB --remote --file=db/migrations/2026-04-27-drop-fts.sql -c wrangler.local.toml

# 备份
npx wrangler d1 export DB --remote --output=backup-$(date +%F).sql -c wrangler.local.toml
```

## 迁移约定

1. 新建 `db/migrations/YYYY-MM-DD-<短描述>.sql`，**幂等**优先（`CREATE TABLE IF NOT EXISTS`、`ALTER TABLE ... ADD COLUMN` + 前置检查）。
2. 同步更新 `db/schema.sql`，保持「从零建库能到最新状态」。
3. 如需运行时兜底，补 `lib/repositories/schema.ts#ensureSchema`。
4. **不要**直接改 `schema.sql` 而不写迁移——否则已有线上库没法平滑升级。

## 常见问题（FAQ）

- **Q：`npm run deploy` 报 "table posts already exists"？** → `cf-deploy.sh` 会重跑 schema，改用 `npx opennextjs-cloudflare deploy -c wrangler.local.toml`。
- **Q：FTS5 会重启吗？** → 等 CF D1 支持稳定，跑 `enable-fts.sql` 并反注释 `schema.sql` 中的 FTS 块。

## 相关文件

- `db/schema.sql`
- `db/seed-template.sql`
- `db/migrations/*.sql`

## 变更日志

- 2026-04-27：初始化模块文档；记录 drop-fts 迁移。
