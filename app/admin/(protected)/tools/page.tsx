import { getTools } from '@/lib/repositories/tools'
import { getAppCloudflareEnv } from '@/lib/cloudflare'
import { ToolsManager } from './ToolsManager'

export const metadata = { title: '工具管理' }

export default async function AdminToolsPage() {
  const env = await getAppCloudflareEnv()
  let tools: Awaited<ReturnType<typeof getTools>> = []

  if (env?.DB) {
    try {
      tools = await getTools(env.DB)
    } catch (error) {
      console.error('Tools fetch error:', error)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--editor-ink)]">工具管理</h1>
        <p className="text-sm text-[var(--editor-muted)] mt-0.5">
          收藏的工具、仓库、Mac 软件 · 共 {tools.length} 件
        </p>
      </div>
      <ToolsManager initialTools={tools} />
    </div>
  )
}
