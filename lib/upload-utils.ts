/**
 * 上传相关公共工具函数与类型定义。
 * 被 app/api/uploads/route.ts 和 app/api/uploads/from-url/route.ts 共用。
 */

export type ImageBucket = {
  put: (
    key: string,
    value: File | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: {
      httpMetadata?: {
        contentType?: string
        cacheControl?: string
      }
      customMetadata?: Record<string, string>
    }
  ) => Promise<void>
  get: (key: string) => Promise<{ customMetadata?: Record<string, string> } | null>
}

export type RuntimeEnv = {
  IMAGES?: ImageBucket
  ENABLE_CF_IMAGE_PIPELINE?: string
  DB?: D1Database
}

export function readFlag(value: unknown): boolean {
  return typeof value === 'string' && ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export function sanitizeFilename(filename: string) {
  const trimmed = filename.trim().toLowerCase()
  const safe = trimmed.replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-')
  return safe || 'file'
}

export function buildAssetUrls(encodedKey: string, cloudflareEnabled: boolean) {
  const baseUrl = `/api/images/${encodedKey}`
  return {
    raw: baseUrl,
    content: cloudflareEnabled ? `${baseUrl}?w=1600&q=85&format=webp` : baseUrl,
    thumb: cloudflareEnabled ? `${baseUrl}?w=960&q=82&format=webp` : baseUrl,
    cover: cloudflareEnabled ? `${baseUrl}?w=1600&h=900&fit=cover&q=84&format=webp` : baseUrl,
  }
}
