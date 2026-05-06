'use client'

import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Pagination } from '@/components/Pagination'
import { formatDate } from '@/components/themes/shared'
import type { HomeProps } from '@/components/HomeClient'

export function HomeClarity({
  initialTheme,
  posts,
  categories,
  navLinks,
  currentPage,
  totalPages,
  categorySlugMap,
}: HomeProps) {
  return (
    <div
      className="min-h-full flex flex-col"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <SiteHeader
        initialTheme={initialTheme}
        navLinks={navLinks}
        categories={categories}
      />

      {/* Hero section */}
      <section className="bg-white pt-16 pb-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            className="text-4xl sm:text-5xl font-semibold text-[#1d1d1f] leading-tight"
            style={{ letterSpacing: '-0.374px' }}
          >
            思考与记录
          </h1>
          <p className="mt-4 text-lg text-[#6e6e73] leading-relaxed">
            技术实践、产品思考、AI 探索
          </p>
        </div>
      </section>

      {/* Post list */}
      <main className="flex-1 bg-[#f5f5f7] px-6 py-16">
        <div className="mx-auto max-w-2xl">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#6e6e73] text-lg">还没有文章</p>
              <p className="text-sm text-[#86868b] mt-2">开始写作，记录思考</p>
            </div>
          ) : (
            <>
              <div className="space-y-12">
                {posts.map((post) => (
                  <article key={post.slug}>
                    <Link href={`/${post.slug}`} className="group block">
                      <div className="flex items-baseline gap-3 mb-1.5">
                        <time className="text-sm text-[#86868b] shrink-0 tabular-nums">
                          {formatDate(post.published_at)}
                        </time>
                        {post.category && (() => {
                          const slug = categorySlugMap[post.category]
                          const pill = (
                            <span
                              className="text-xs font-medium px-2.5 py-0.5 rounded-full text-white shrink-0"
                              style={{ backgroundColor: '#0066cc' }}
                            >
                              {post.category}
                            </span>
                          )
                          return slug ? (
                            <Link href={`/category/${slug}`}>{pill}</Link>
                          ) : pill
                        })()}
                      </div>
                      <h2
                        className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] leading-snug group-hover:text-[#0066cc] transition-colors duration-200"
                        style={{ letterSpacing: '-0.28px' }}
                      >
                        {post.title}
                        {post.is_pinned === 1 && (
                          <span className="inline-block ml-2 text-xs font-medium text-[#0066cc] align-middle">
                            置顶
                          </span>
                        )}
                      </h2>
                      {post.description && (
                        <p className="mt-2 text-[17px] text-[#6e6e73] leading-[1.47] line-clamp-2">
                          {post.description}
                        </p>
                      )}
                      <span
                        className="inline-block mt-3 text-sm font-medium transition-colors duration-200"
                        style={{ color: '#0066cc' }}
                      >
                        阅读全文 &rsaquo;
                      </span>
                    </Link>
                  </article>
                ))}
              </div>
              <div className="mt-16">
                <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/" />
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
