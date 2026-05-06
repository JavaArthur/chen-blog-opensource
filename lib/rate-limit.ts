const MAX_ATTEMPTS = 5
const WINDOW_SECONDS = 5 * 60 // 5 分钟
const CLEANUP_SECONDS = 60 * 60 // 1 小时

export async function checkLoginRateLimit(
  db: D1Database,
  ip: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowStart = Math.floor(Date.now() / 1000) - WINDOW_SECONDS

  const result = await db
    .prepare(
      'SELECT COUNT(*) as cnt FROM login_attempts WHERE ip = ? AND attempted_at > ?'
    )
    .bind(ip, windowStart)
    .first<{ cnt: number }>()

  const count = result?.cnt ?? 0

  if (count >= MAX_ATTEMPTS) {
    // 找到最早一条记录的时间，计算还需等待多久
    const oldest = await db
      .prepare(
        'SELECT MIN(attempted_at) as earliest FROM login_attempts WHERE ip = ? AND attempted_at > ?'
      )
      .bind(ip, windowStart)
      .first<{ earliest: number }>()

    const retryAfter = oldest?.earliest
      ? oldest.earliest + WINDOW_SECONDS - Math.floor(Date.now() / 1000)
      : WINDOW_SECONDS

    return { allowed: false, retryAfter: Math.max(retryAfter, 1) }
  }

  return { allowed: true }
}

export async function recordFailedLogin(
  db: D1Database,
  ip: string
): Promise<void> {
  await db
    .prepare('INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)')
    .bind(ip, Math.floor(Date.now() / 1000))
    .run()
}

export async function cleanupOldAttempts(db: D1Database): Promise<void> {
  const cutoff = Math.floor(Date.now() / 1000) - CLEANUP_SECONDS
  await db
    .prepare('DELETE FROM login_attempts WHERE attempted_at < ?')
    .bind(cutoff)
    .run()
}
