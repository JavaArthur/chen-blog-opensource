// 全站统一的日期格式化。固定 Asia/Shanghai 时区，确保 Cloudflare Worker(UTC) 的 SSR
// 与客户端(本地时区) 渲染出相同文字，避免临界日期的 hydration mismatch (React #418)。
//
// 任何需要把时间戳渲染成日期/时间的地方都应使用这里的函数，不要直接写裸 toLocaleDateString。

const TZ = 'Asia/Shanghai'

function partsOf(date: Date): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { year: get('year'), month: get('month'), day: get('day') }
}

// "2026年6月9日"（秒级时间戳）
export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: TZ,
  })
}

// "2026年6月9日"（毫秒级 Date / 时间戳，供 admin 等已是 ms 的场景）
export function formatDateMs(input: number | Date): string {
  return new Date(input).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: TZ,
  })
}

// "2026年6月9日 14:30"（秒级时间戳，带时分）
export function formatDateTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  })
}

// "2026年6月9日 14:30"（毫秒级）
export function formatDateTimeMs(input: number | Date): string {
  return new Date(input).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  })
}

// "6月9日"（秒级，月日，供 SearchBar 等紧凑展示）
export function formatMonthDay(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    timeZone: TZ,
  })
}

// "06.09"（秒级）
export function formatDateShort(ts: number): string {
  const { month, day } = partsOf(new Date(ts * 1000))
  return `${month}.${day}`
}

// "2026-06-09"（秒级）
export function formatDateCompact(ts: number): string {
  const { year, month, day } = partsOf(new Date(ts * 1000))
  return `${year}-${month}-${day}`
}

// 年份数字（秒级时间戳）
export function formatYear(ts: number): number {
  return Number(partsOf(new Date(ts * 1000)).year)
}

// 当前年份（按 Asia/Shanghai，供页脚 © 年份等）
export function currentYear(): number {
  return Number(partsOf(new Date()).year)
}

// 当前「期号」信息（按 Asia/Shanghai），供 editorial 主题刊号展示
export function currentIssueInfo(): { vol: number; month: number; year: number } {
  const { year, month } = partsOf(new Date())
  const y = Number(year)
  return { vol: y - 2023, month: Number(month), year: y }
}
