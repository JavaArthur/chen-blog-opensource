import { ensureSchema, type Database } from '@/lib/repositories/schema'

export type ToolType = 'url' | 'repo' | 'mac-app' | 'other'

export interface ToolRow {
  id: number
  name: string
  url: string | null
  type: ToolType
  description: string | null
  tags: string | null
  icon: string | null
  is_pinned: number
  sort_order: number
  created_at: number
  updated_at: number
}

export interface Tool extends Omit<ToolRow, 'tags'> {
  tags: string[]
}

let toolsSchemaReady = false

// 确保 tools 表存在（无状态环境下的自愈迁移）
export async function ensureToolsSchema(db: Database): Promise<void> {
  if (toolsSchemaReady) return
  await ensureSchema(db)
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS tools (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          url TEXT,
          type TEXT NOT NULL DEFAULT 'url',
          description TEXT,
          tags TEXT,
          icon TEXT,
          is_pinned INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )`,
      )
      .run()
    toolsSchemaReady = true
  } catch (error) {
    console.error('Tools schema migration failed:', error)
  }
}

function parseTags(value: string | null): string[] {
  return value ? JSON.parse(value) : []
}

function mapTool(row: ToolRow): Tool {
  return { ...row, tags: parseTags(row.tags) }
}

export async function getTools(db: Database): Promise<Tool[]> {
  await ensureToolsSchema(db)
  const { results } = await db
    .prepare(
      `SELECT * FROM tools
       ORDER BY is_pinned DESC, sort_order ASC, created_at DESC`,
    )
    .all<ToolRow>()
  return results.map(mapTool)
}

export async function createTool(
  db: Database,
  data: {
    name: string
    url?: string | null
    type?: ToolType
    description?: string | null
    tags?: string[]
    icon?: string | null
    is_pinned?: number
  },
): Promise<number> {
  await ensureToolsSchema(db)
  const result = await db
    .prepare(
      `INSERT INTO tools (name, url, type, description, tags, icon, is_pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.name,
      data.url ?? null,
      data.type ?? 'url',
      data.description ?? null,
      data.tags && data.tags.length ? JSON.stringify(data.tags) : null,
      data.icon ?? null,
      data.is_pinned ?? 0,
    )
    .run()
  return result.meta.last_row_id
}

export async function updateTool(
  db: Database,
  id: number,
  data: Partial<{
    name: string
    url: string | null
    type: ToolType
    description: string | null
    tags: string[]
    icon: string | null
    is_pinned: number
    sort_order: number
  }>,
): Promise<void> {
  await ensureToolsSchema(db)
  const updates: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
  if (data.url !== undefined) { updates.push('url = ?'); values.push(data.url) }
  if (data.type !== undefined) { updates.push('type = ?'); values.push(data.type) }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description) }
  if (data.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(data.tags)) }
  if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon) }
  if (data.is_pinned !== undefined) { updates.push('is_pinned = ?'); values.push(data.is_pinned) }
  if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order) }

  if (updates.length === 0) return

  updates.push("updated_at = strftime('%s', 'now')")
  values.push(id)

  await db.prepare(`UPDATE tools SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
}

export async function deleteTool(db: Database, id: number): Promise<void> {
  await ensureToolsSchema(db)
  await db.prepare('DELETE FROM tools WHERE id = ?').bind(id).run()
}
