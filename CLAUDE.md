# 晨启博客（channing-blog-opensource）— 项目手册

> 面向未来的自己 / 接手开发者 / Claude。一页纸搞懂这个博客怎么跑、怎么部署、怎么恢复、怎么贡献。

## 一、项目速览

| 维度 | 值 |
|---|---|
| 性质 | `joeseesun/qiaomu-blog-opensource` 的本地 fork，已 rebrand 成 channing |
| 上游 | https://github.com/joeseesun/qiaomu-blog-opensource |
| fork | https://github.com/JavaArthur/chen-blog-opensource |
| 技术栈 | Next.js 16 + OpenNext + Cloudflare Workers (Paid) + D1 + R2 |
| 线上域名 | https://note.aichanning.cn（自定义）/ https://channing-blog-opensource.xiekangchen0930.workers.dev（workers.dev 临时域） |
| Worker 名 | `channing-blog-opensource` |
| CF Account | `01b7f083e0a678ebfc6378fc1f68a75a` |
| D1 库名 / ID | `channing-blog-db` / `f19765b5-a4a9-4b82-b1a9-df92d802859c` |
| R2 Bucket | `channing-blog-images` |
| 后台入口 / 密码 | `/admin` / `wudichen` |

## 二、日常开发工作流

### 本地开发（热重载，连远程 D1/R2）

```bash
npm install            # 首次或依赖变动时
npm run dev            # Next.js dev server，速度最快
# 或
npm run preview        # 在 Worker runtime 下预览，行为最接近线上
```

**注意**：本地 dev server 通过 `wrangler.local.toml` 里的真实 D1/R2 绑定，**读写的就是线上数据**。别在本地随手跑 DELETE。

### 改代码 → 部署全流程

```bash
# 1. 改代码
# 2. 局部校验
npm run verify:quick   # lint + test + build 的快速版

# 3. 部署（推荐用 opennext 直接 deploy，比 npm run deploy 更快，不会重跑 schema）
set -a; source .env.local; set +a
npx opennextjs-cloudflare deploy -c wrangler.local.toml

# 4. 看线上日志（调试神器）
npx wrangler tail -c wrangler.local.toml
```

### 日常管理命令

```bash
# 查线上数据库
set -a; source .env.local; set +a
npx wrangler d1 execute DB --remote --command "SELECT count(*) FROM posts" -c wrangler.local.toml

# 导出数据库备份
npx wrangler d1 export DB --remote --output=backup-$(date +%F).sql -c wrangler.local.toml

# 列 R2 图片
npx wrangler r2 object list channing-blog-images

# 查看已上传的 secrets（只列 name，值看不到）
npx wrangler secret list -c wrangler.local.toml

# 滚动更换某个 secret
printf "新密码" | npx wrangler secret put ADMIN_PASSWORD -c wrangler.local.toml
```

## 三、首次部署 SOP

> 从零部署到线上 · 顺序严格、每一步都验证

### 1. 准备环境

```bash
npm install
cp .env.example .env.local
```

然后编辑 `.env.local`：

```env
ADMIN_PASSWORD=你的强密码
ADMIN_TOKEN_SALT=$(openssl rand -hex 32)          # 手动跑命令替换
AI_CONFIG_ENCRYPTION_SECRET=$(openssl rand -hex 32) # 手动跑命令替换
NEXT_PUBLIC_SITE_URL=https://your-domain.com       # 先填占位，拿到真实域名后回填
```

### 2. Cloudflare 认证

```bash
npx wrangler login                                 # 浏览器 OAuth（推荐）
# 或在 .env.local 里放 CLOUDFLARE_API_TOKEN（仅本地，切勿进 git）
```

### 3. 初始化远程资源（D1 / R2）

```bash
npm run cf:init -- --site-url=https://your-domain.com
```

这一步会：
- 复制 `wrangler.toml` → `wrangler.local.toml`（**git 不追踪**）
- 创建 D1 database
- 创建 R2 bucket
- 应用 `db/schema.sql` + `db/seed-template.sql`

**⚠️ 已知坑 1**：`cf-init.sh` 在某些 wrangler 版本下，`--update-config` 不会把 D1 ID 写回配置，导致后续命令报 "Couldn't find DB with name 'DB'"。**必须手动核对** `wrangler.local.toml` 里有没有：

```toml
[[d1_databases]]
binding = "DB"
database_name = "channing-blog-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 一定要有
remote = true

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "channing-blog-images"
```

没有就自己加，或者从命令输出里粘贴。

### 4. 设置 secrets（加密存 CF 云端）

```bash
set -a; source .env.local; set +a    # 导出 env 供 wrangler 使用
printf "$ADMIN_PASSWORD"             | npx wrangler secret put ADMIN_PASSWORD -c wrangler.local.toml
printf "$ADMIN_TOKEN_SALT"           | npx wrangler secret put ADMIN_TOKEN_SALT -c wrangler.local.toml
printf "$AI_CONFIG_ENCRYPTION_SECRET"| npx wrangler secret put AI_CONFIG_ENCRYPTION_SECRET -c wrangler.local.toml
```

**⚠️ 已知坑 2**：如果 shell 没 `source .env.local` 导出变量，wrangler 会报 `Failed to fetch auth token: 400 Bad Request`。记得 `set -a; source .env.local; set +a`。

### 5. 生成类型 + 构建 + 部署

```bash
npm run cf-typegen
set -a; source .env.local; set +a
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy -c wrangler.local.toml
```

**⚠️ 已知坑 3**：Workers **Free** 计划 script size 上限 3 MiB，本项目 handler.mjs 有约 11 MiB，**必须用 Workers Paid 计划（$5/月，10 MiB 上限）**。首次部署如果报 `exceeded size limit of 3 MiB`，去 https://dash.cloudflare.com/<ACCOUNT_ID>/workers/plans 升级。

### 6. 绑自定义域名（可选）

CF Dashboard → Workers & Pages → `channing-blog-opensource` → Settings → Domains & Routes → **+ Add → Custom domain** → 填你的域名。

记得回填 `NEXT_PUBLIC_SITE_URL` 到：
- `.env.local`
- `wrangler.local.toml`

再跑一次 deploy。

## 四、已知坑 + 故障恢复手册

### 坑 1：autosave 500，D1 报 SQLITE_CORRUPT_VTAB

**现象**：`PATCH /api/posts` 返回 500，错误信息 `D1_ERROR: database disk image is malformed: SQLITE_CORRUPT (extended: SQLITE_CORRUPT_VTAB)`。

**根因**：Cloudflare D1 的 FTS5 支持不稳，shadow tables 容易跟主表失步，后续每次 `UPDATE posts` 触发 `posts_au` 就炸。[参考 emdash-cms#252](https://github.com/emdash-cms/emdash/issues/252)。

**修复**（本仓库已经处理，schema.sql 把 FTS 注释了；如果接手历史数据库仍有损坏的 FTS，跑一次）：

```bash
set -a; source .env.local; set +a
npx wrangler d1 execute DB --remote --file=db/migrations/2026-04-27-drop-fts.sql -c wrangler.local.toml
```

搜索降级走 `lib/repositories/search.ts` 里的 LIKE 兜底，用户无感。

**未来想重启 FTS5**：等 Cloudflare D1 对 FTS5 的支持稳定，跑 `db/migrations/enable-fts.sql`。

### 坑 2：外链图片粘贴后 403 / 无法渲染

**现象**：粘贴 `![](https://cdn.gooo.ai/xxx.jpg)` 之类外链图，显示裂图。

**根因**：第三方 CDN 有 Referer 防盗链。

**当前方案**：编辑器粘贴时会自动调 `/api/uploads/from-url` 把图拉到自家 R2 再替换 src，用户看到 "已转存 N 张外链图片" 的 toast 提示。如果失败会单独提示哪张。

**如果转存也失败**（对方彻底封 bot），手动另存图再上传。

### 坑 3：Worker script size > 3 MiB

见「首次部署 SOP」步骤 5 最底下。**Paid 计划是硬需求**。

### 坑 4：wrangler 报 "Failed to fetch auth token: 400 Bad Request"

本地 shell 没 `source .env.local`，wrangler 同时读到不完整的 env。

```bash
set -a; source .env.local; set +a    # 每次新开终端都要跑
```

或者改用 `npx wrangler login`（浏览器 OAuth，一劳永逸，不用放 token）。

### 坑 5：`npm run deploy` 报 "table posts already exists"

`scripts/cf-deploy.sh` 每次部署都会重跑 `db/schema.sql`，但 schema 不是幂等的。

**绕过方法**：跳过 npm script，直接调 opennext：

```bash
set -a; source .env.local; set +a
npx opennextjs-cloudflare deploy -c wrangler.local.toml
```

表结构要变更时再单独跑 migration：

```bash
npx wrangler d1 execute DB --remote --file=db/migrations/你的迁移.sql -c wrangler.local.toml
```

## 五、项目结构要点

```
app/
├── api/
│   ├── uploads/route.ts             # 文件上传（admin）
│   ├── uploads/from-url/route.ts    # 外链图自动转存到 R2（新增，贡献回上游）
│   ├── images/[...key]/route.ts     # R2 图片读取
│   ├── admin/ai-*                   # AI 管理后台 API
│   └── editor/ai-*                  # 编辑器 AI 交互
├── admin/                           # 后台页面
├── [slug]/page.tsx                  # 文章详情页
└── page.tsx                         # 首页（4 套主题，lib/site-config 控制）

lib/
├── repositories/                    # DB 仓储层
│   ├── schema.ts                    # ensureSchema（列迁移）
│   ├── posts.ts                     # 文章 CRUD
│   └── search.ts                    # 搜索（FTS5 优先，LIKE 兜底）
├── editor-extensions.tsx            # Tiptap 扩展配置 + 粘贴钩子
├── editor-file-upload.ts            # 编辑器上传辅助
├── remote-image-rehost.ts           # 外链图扫描 + 转存（新增）
└── editor-rehost-toast.ts           # toast 事件桥（新增）

db/
├── schema.sql                       # 表结构（FTS5 部分已注释）
├── seed-template.sql                # 默认种子数据
└── migrations/                      # 迁移脚本
    ├── 2026-04-27-drop-fts.sql
    └── enable-fts.sql

scripts/
├── cf-init.sh                       # 首次初始化资源
├── cf-deploy.sh                     # 完整部署（含 schema 重跑，易踩坑）
├── cf-preview.sh                    # 本地 Worker runtime 预览
└── cf-typegen.sh                    # CloudflareEnv 类型生成

wrangler.toml                        # 模板（进 git）
wrangler.local.toml                  # 真实绑定（gitignore）
.env.local                           # 本地环境变量（gitignore）
.env.local.secrets.bak               # secrets 备份（gitignore）
```

## 六、安全约束

- `.env.local`、`wrangler.local.toml`、`.env.local.secrets.bak` **永远不进 git**（.gitignore 已配）。
- 若怀疑 `CLOUDFLARE_API_TOKEN` 泄露，立刻去 https://dash.cloudflare.com/profile/api-tokens **Roll**。
- 生产数据库和本地 dev 共用一份 D1，慎跑破坏性 SQL；改表前先 `d1 export --remote` 备份。
- 新增 secret 只走 `wrangler secret put`，不要写进 `wrangler.toml`（那份会进 git）。

## 七、贡献回上游

- fork：`JavaArthur/chen-blog-opensource`
- 上游：`joeseesun/qiaomu-blog-opensource`（has_issues=false，只能开 PR）
- 策略：通用修复 / 新功能 cherry-pick 到专用分支（如 `upstream-contribute`），不带 rebrand 污染；独立 commit 便于上游 cherry-pick。

示例流程：

```bash
# 从某个干净基线切分支
git checkout -b upstream-feature-xxx 某个上游兼容的 commit

# cherry-pick 目标 commits
git cherry-pick <feat-commit> <fix-commit>

# 推 fork
git push -u origin upstream-feature-xxx

# 开 PR 到上游
gh pr create --repo joeseesun/qiaomu-blog-opensource \
  --base main --head JavaArthur:upstream-feature-xxx \
  --title "..." --body-file /tmp/pr.md
```

当前已开 PR：https://github.com/joeseesun/qiaomu-blog-opensource/pull/1（feat + 2 个 fix）。

## 八、给 Claude / AI 助手的提示

- 任何涉及 CF/D1/R2 的操作前，先 `set -a; source .env.local; set +a`。
- 改 schema → 先写 `db/migrations/*.sql`，**再** 改 `db/schema.sql`，不要直接编辑 schema 后指望 cf-deploy 能处理。
- 部署用 `npx opennextjs-cloudflare deploy -c wrangler.local.toml`，**不要用** `npm run deploy`（会重跑 schema）。
- 本地跑 `npx tsc --noEmit` 时，`tests/` 下存在上游遗留的类型报错，不要当作新引入问题。
- 发现新的 Cloudflare 平台坑，**加到本文件「已知坑」章节**，别光 fix 不 doc。
