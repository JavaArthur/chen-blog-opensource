# Channing Studio 设计说明

## 目标

把当前“晨启AI博客”升级为 Channing 的个人工作室：访客在首页能在 30 秒内理解身份、能力与代表产物；文章、剪报与工具保留为持续更新的证据库，而不是站点的唯一入口。

## 已确认的产品决策

- 采用“个人工作室”而不是另建纯展示站；保留 Next.js、Cloudflare、D1/R2 和现有内容生产链路。
- 首页采用“技术编辑部”视觉：暖灰纸张底色、墨蓝正文、铜橙强调；中文标题使用现有或可自托管的衬线字体，界面和数据采用等宽/无衬线字体。禁止科技紫渐变和泛化 AI 插画。
- 个人主站使用 `/`；文章列表移至 `/writing`。`/clippings`、`/tools` 与文章详情保持 URL 不变。
- “作品”展示 Channing 自有的博客系统、内容发布工具链与可公开的 AI 平台工程方法；不展示任何客户、雇主或内部系统的敏感数据。
- GitHub 主仓库迁移为独立仓库 `JavaArthur/channing-studio`（若名称不可用则 `JavaArthur/channing-ai-studio`），保留 `main` 的 Git 提交历史和 MIT 许可，不搬运上游贡献分支。

## 信息架构

```text
/                 个人工作室首页
/work             代表作品与工程案例
/labs             可公开的工具链与实验
/writing          原有公开文章列表
/[slug]           原有文章阅读页
/clippings        原有剪报
/tools            原有个人工具收藏
/about            个人简介、工作方式、联系入口
```

公开导航固定为：作品、文章、实验室、关于我、GitHub、RSS、搜索。后台入口继续可用，但从公开导航移除；剪报和工具收藏只在文章/实验室相关上下文提供入口，不再占据首屏导航。

## 首页结构

1. **首屏身份区**：姓名/品牌“Channing”、角色“AI 平台工程落地者 · 内容创作者”，一句可验证的工作主张“把重复三遍的事自动化，把复杂问题变成可交付系统”，以及“查看作品”“阅读文章”两个 CTA。
2. **能力证据区**：AI 平台工程、内容自动化、产品化交付三张短卡；只讲方法与交付边界，不杜撰指标。
3. **精选作品区**：
   - 晨启AI博客：Next.js + Cloudflare + D1/R2 的自托管内容系统。
   - 内容发布工具链：Chrome Clipper、Obsidian Publisher、发布 Skill 三个入口汇聚同一后台。
   - AI 平台工程方法：以架构决策、自动化和复盘为主题的公开方法论卡。
4. **实验室区**：链接现有生态工具与仓库，标注“可直接使用”或“实践记录”。
5. **最新文章区**：展示最近 3 篇公开原创文章，链接 `/writing` 查看全部。
6. **页脚身份区**：GitHub、RSS 与可替换的公开联系入口；不展示后台、密码或部署细节。

## 内容与数据边界

第一期不引入 D1 schema 变更。新增一个静态、类型化的 `lib/studio-content.ts`，只承载首页、作品、实验室和关于我所需的个人文案与链接。文章仍由现有 `posts` 仓储查询，工具收藏仍读 `tools` 表。

这样可以先交付一套稳定、可审阅的个人主站，避免为了少量固定文案给后台增加新的内容模型。后续若作品数量增长，再评估将作品迁入后台的独立表与管理界面。

## 技术设计

- `app/page.tsx` 改为 Studio 首页的 Server Component：并行读取站点导航、最近 3 篇 `kind='post'` 文章和默认主题。
- 新建 `app/writing/page.tsx`，复用当前文章列表读取逻辑，保持分页、分类、主题和 ISR 行为。
- 新建 `app/work/page.tsx`、`app/labs/page.tsx`、`app/about/page.tsx`，使用静态内容模块与 `SiteHeader` / `SiteFooter`。
- 新建聚焦的 Studio 展示组件，避免把新首页塞进现有主题组件；现有多主题文章阅读能力保持不变。
- `SiteHeader` 接受页面上下文，公开页使用稳定的 Studio 导航；不依赖数据库内可能过时的默认链接作为兜底。
- `app/layout.tsx`、`app/page.tsx` 和各静态路由统一更新 metadata / JSON-LD，使 canonical、站点描述、`Person`/`WebSite` 语义指向当前域名。

## 安全与身份收口

1. 将已追踪文档中的后台凭据替换为安全占位说明；禁止再次提交真实密码、token、D1/R2 标识或 Cloudflare API token。
2. 生成并写入新的 `ADMIN_PASSWORD`、`ADMIN_TOKEN_SALT` 到 Cloudflare Worker secret；本地 `.env.local` 同步但不纳入 Git。
3. 更新仓库 metadata、README、默认导航与生产域名兜底，清理上游身份残留。
4. 修复文章页重复 H1，并以线上 header 验证首页 ISR 的实际缓存行为。

## 仓库独立方案

完成代码与部署验证后创建新的非 fork 空仓库，仅推送经过验证的 `main`。原 `JavaArthur/chen-blog-opensource` 保留为归档与上游贡献入口；新的远端成为日常开发默认 `origin`。迁移前保留旧远端为 `legacy`，不 force-push，不删除任何现有分支。

MIT 版权和许可文件、README 中的上游致谢继续保留。GitHub 仓库独立只改变托管关系，不抹去实际来源与贡献记录。

## 错误处理与可访问性

- 当 D1 不可用时，首页仍渲染身份、作品和实验室，文章区显示可理解的降级提示，而不是空白首屏。
- 所有导航和 CTA 使用真实 `Link`；首屏按钮、卡片和移动端菜单保持至少 44px 触达面积。
- 作品卡不把关键信息仅放在颜色或图标中；图片提供有意义的 alt 文本。
- 页面每次只存在一个 H1。

## 验证标准

- 根路径、`/writing`、`/work`、`/labs`、`/about` 在桌面和移动端可用，导航无死链。
- 新首页没有重复 H1，文章详情页 H1 数量为 1，metadata / canonical 指向 `note.aichanning.cn`。
- 不再有任何受 Git 跟踪文件包含已轮换的实际后台凭据；`git grep` 仅匹配变量名与占位文案。
- `npm run verify:quick` 通过；Worker 预览和线上部署后验证页面、响应头与关键路径。
