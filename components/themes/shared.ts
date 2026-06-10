// 首页主题共用的日期格式化，统一复用 lib/format-date（固定 Asia/Shanghai 时区）。
export {
  formatDate,
  formatDateShort,
  formatDateCompact,
  formatYear,
} from '@/lib/format-date'

import { formatDate } from '@/lib/format-date'

export function formatRelativeDate(ts: number): string {
  const now = Date.now() / 1000
  const diff = now - ts
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
  return formatDate(ts)
}
