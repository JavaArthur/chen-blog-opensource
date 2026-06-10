export function formatDate(ts: number): string {
  // 固定 Asia/Shanghai 时区，确保 Cloudflare Worker(UTC) 的 SSR 与客户端(本地时区)
  // 渲染出相同日期文字，避免临界日期的 hydration mismatch (React #418)。
  return new Date(ts * 1000).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  })
}

export function formatRelativeDate(ts: number): string {
  const now = Date.now() / 1000
  const diff = now - ts
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
  return formatDate(ts)
}

// 时区安全的日期分量：统一按 Asia/Shanghai 提取，避免 SSR(UTC)/CSR(本地) 的
// getMonth/getDate 在临界时间不一致导致 hydration mismatch (React #418)。
function shanghaiParts(ts: number): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(ts * 1000))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { year: get('year'), month: get('month'), day: get('day') }
}

// "MM.DD"
export function formatDateShort(ts: number): string {
  const { month, day } = shanghaiParts(ts)
  return `${month}.${day}`
}

// "YYYY-MM-DD"
export function formatDateCompact(ts: number): string {
  const { year, month, day } = shanghaiParts(ts)
  return `${year}-${month}-${day}`
}

// 年份（数字）
export function formatYear(ts: number): number {
  return Number(shanghaiParts(ts).year)
}
