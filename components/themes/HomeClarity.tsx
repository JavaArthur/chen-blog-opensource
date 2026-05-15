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
}: HomeProps) {
  return (
    <div className="theme-home-clarity min-h-full flex flex-col">
      <SiteHeader
        initialTheme={initialTheme}
        navLinks={navLinks}
        categories={categories}
      />

      {/* Hero section — Apple product-tile-light style */}
      <section className="clarity-hero bg-[var(--background)] pt-16 pb-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            className="text-4xl sm:text-5xl font-semibold text-[var(--editor-ink)] leading-tight"
            style={{ letterSpacing: '-0.374px' }}
          >
            思考与记录
          </h1>
          <p className="mt-4 text-lg text-[var(--editor-muted)] leading-relaxed">
            技术实践、产品思考、AI 探索
          </p>
        </div>
      </section>

      {/* Post list — Apple parchment tile */}
      <main className="clarity-post-section flex-1 bg-[var(--editor-soft)] px-6 py-16">
        <div className="mx-auto max-w-2xl">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[var(--editor-muted)] text-lg">还没有文章</p>
              <p className="text-sm text-[var(--stone-gray)] mt-2">开始写作，记录思考</p>
            </div>
          ) : (
            <>
              <div className="space-y-12">
                {posts.map((post) => (
                  <article key={post.slug}>
                    <Link href={`/${post.slug}`} className="group block">
                      <div className="flex items-baseline gap-3 mb-1.5">
                        <time className="text-sm text-[var(--stone-gray)] shrink-0 tabular-nums">
                          {formatDate(post.published_at)}
                        </time>
                        {post.category && (
                          <span
                            className="text-xs font-medium px-2.5 py-0.5 rounded-full text-white shrink-0"
                            style={{ backgroundColor: 'var(--editor-accent)' }}
                          >
                            {post.category}
                          </span>
                        )}
                      </div>
                      <h2
                        className="text-xl sm:text-2xl font-semibold text-[var(--editor-ink)] leading-snug group-hover:text-[var(--editor-accent)] transition-colors duration-200"
                        style={{ letterSpacing: '-0.28px' }}
                      >
                        {post.title}
                        {post.is_pinned === 1 && (
                          <span className="inline-block ml-2 text-xs font-medium text-[var(--editor-accent)] align-middle">
                            置顶
                          </span>
                        )}
                      </h2>
                      {post.description && (
                        <p className="mt-2 text-[17px] text-[var(--editor-muted)] leading-[1.47] line-clamp-2">
                          {post.description}
                        </p>
                      )}
                      <span
                        className="inline-block mt-3 text-sm font-medium transition-colors duration-200"
                        style={{ color: 'var(--editor-accent)' }}
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
