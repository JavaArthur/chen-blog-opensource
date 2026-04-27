[根目录](../CLAUDE.md) > **scripts**

# scripts/ — Cloudflare 与部署脚本

## 模块职责

把重复部署动作脚本化。所有脚本均默认读取 `wrangler.local.toml` + `.env.local`；跑前务必 `set -a; source .env.local; set +a`。

## 关键脚本

| 脚本 | 入口命令 | 作用 |
|---|---|---|
| `cf-init.sh` | `npm run cf:init` | 首次初始化 D1 / R2，复制 `wrangler.toml` → `wrangler.local.toml` |
| `cf-deploy.sh` | `npm run deploy` | 完整部署；会重跑 schema，**日常不推荐** |
| `cf-preview.sh` | `npm run preview` / `npm run preview:remote` | 在 Worker runtime 下本地预览 |
| `cf-typegen.sh` | `npm run cf-typegen` | 生成 `CloudflareEnv` / `worker-configuration.d.ts` 类型 |
| `verify.sh` | `npm run verify[:quick]` | lint + test + build 组合校验 |
| `worktree-add.sh` | `npm run worktree:add` | 辅助 git worktree 创建 |

## 推荐部署链路

```bash
# 日常部署（推荐）
set -a; source .env.local; set +a
npx opennextjs-cloudflare deploy -c wrangler.local.toml
```

少用 `npm run deploy`（会重跑 `db/schema.sql`，不幂等）。

## 常见问题（FAQ）

- **Q：`cf-init.sh` 没把 D1 ID 写回配置？** → 手动核对 `wrangler.local.toml` 的 `[[d1_databases]]` 块，按根 CLAUDE「坑 1」补。
- **Q：`verify.sh` 里哪些步骤？** → full = lint + typecheck + test + build；quick 跳过重步骤，日常改代码足够用。

## 相关文件

- `scripts/cf-*.sh`
- `scripts/verify.sh`
- `scripts/worktree-add.sh`

## 变更日志

- 2026-04-27：初始化模块文档。
