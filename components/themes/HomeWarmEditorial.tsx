'use client'

import Link from 'next/link'
import { useState } from 'react'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Pagination } from '@/components/Pagination'
import type { HomeProps } from '@/components/HomeClient'
import type { PostWithTags } from '@/lib/db'

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  })
}

function formatIssueDate() {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    timeZone: 'Asia/Shanghai',
  })
}

function getCategoryHref(post: PostWithTags, categorySlugMap: Record<string, string>) {
  if (!post.category) return null
  const slug = categorySlugMap[post.category]
  return slug ? `/category/${slug}` : null
}

function PostMarker({ post }: { post: PostWithTags }) {
  if (post.is_pinned !== 1 && !post.password) return null

  return (
    <span className="warm-editorial-markers">
      {post.is_pinned === 1 && <span>置顶</span>}
      {post.password && <span>私密</span>}
    </span>
  )
}

function CoverFrame({
  post,
  size = 'large',
}: {
  post: PostWithTags
  size?: 'large' | 'small' | 'thumb'
}) {
  const [failed, setFailed] = useState(false)

  if (!post.cover_image) return null

  if (!failed) {
    return (
      <div className={`warm-editorial-cover warm-editorial-cover-${size}`}>
        <img
          src={post.cover_image}
          alt={post.title}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className={`warm-editorial-cover warm-editorial-cover-${size} warm-editorial-cover-fallback`}>
      <span>{post.category || 'AI'}</span>
    </div>
  )
}

export function HomeWarmEditorial({
  initialTheme,
  posts,
  categories,
  navLinks,
  currentPage,
  totalPages,
  categorySlugMap,
}: HomeProps) {
  const featured = posts[0] ?? null
  const sideStories = posts.slice(1, 3)
  const rest = posts.slice(3)
  const featuredHasCover = Boolean(featured?.cover_image)

  return (
    <div className="theme-home-warm-editorial min-h-full flex flex-col">
      <SiteHeader
        initialTheme={initialTheme}
        navLinks={navLinks}
        categories={categories}
      />

      <main className="warm-editorial-shell flex-1">
        <section className="warm-editorial-masthead" aria-label="晨启AI博客">
          <div className="warm-editorial-issue">
            <span>晨启AI博客</span>
            <span>{formatIssueDate()}</span>
          </div>
          <Link href="/" className="warm-editorial-title-link">
            <h1>把 AI 磨成判断力</h1>
          </Link>
          <p>
            AI 应用、平台工程、产品观察与交易复盘。记录真实问题，留下能复用的判断。
          </p>
        </section>

        {categories.length > 0 && (
          <nav className="warm-editorial-category-rail" aria-label="文章分类">
            <Link href="/">全部文章</Link>
            {categories.slice(0, 8).map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`}>
                {category.name}
              </Link>
            ))}
          </nav>
        )}

        {posts.length === 0 ? (
          <div className="warm-editorial-empty">
            <p>还没有文章</p>
            <span>开始写作，记录思考</span>
          </div>
        ) : (
          <>
            {featured && (
              <section className={`warm-editorial-lead ${featuredHasCover ? 'warm-editorial-lead-with-cover' : 'warm-editorial-lead-text-only'}`}>
                <Link
                  href={`/${featured.slug}`}
                  className={`warm-editorial-lead-main ${featuredHasCover ? 'warm-editorial-lead-main-with-cover' : 'warm-editorial-lead-main-text-only'}`}
                >
                  {featuredHasCover && <CoverFrame post={featured} />}
                  <div className="warm-editorial-lead-copy">
                    <div className="warm-editorial-eyebrow">
                      <span>HEADLINE</span>
                      {featured.category && <span>{featured.category}</span>}
                    </div>
                    <h2>{featured.title}</h2>
                    {featured.description && <p>{featured.description}</p>}
                    <div className="warm-editorial-meta">
                      <time>{formatDate(featured.published_at)}</time>
                      <PostMarker post={featured} />
                    </div>
                  </div>
                </Link>

                {sideStories.length > 0 && (
                  <div className="warm-editorial-side-stack">
                    {sideStories.map((post) => (
                      <Link
                        key={post.slug}
                        href={`/${post.slug}`}
                        className={`warm-editorial-side-item ${post.cover_image ? 'warm-editorial-side-item-with-cover' : 'warm-editorial-side-item-text-only'}`}
                      >
                        {post.cover_image && <CoverFrame post={post} size="small" />}
                        <div>
                          <div className="warm-editorial-eyebrow">
                            {post.category && <span>{post.category}</span>}
                          </div>
                          <h3>{post.title}</h3>
                          <div className="warm-editorial-meta">
                            <time>{formatDate(post.published_at)}</time>
                            <PostMarker post={post} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {rest.length > 0 && (
              <section className="warm-editorial-index">
                <div className="warm-editorial-section-head">
                  <h2>Latest Notes</h2>
                  <span>{rest.length} 篇</span>
                </div>

                <div className="warm-editorial-story-list">
                  {rest.map((post, index) => {
                    const categoryHref = getCategoryHref(post, categorySlugMap)

                    return (
                      <article
                        key={post.slug}
                        className={`warm-editorial-story ${post.cover_image ? 'warm-editorial-story-with-cover' : ''}`}
                      >
                        <div className="warm-editorial-story-count">
                          {String(index + 4).padStart(2, '0')}
                        </div>
                        <div className="warm-editorial-story-content">
                          {post.category && (
                            categoryHref ? (
                              <Link href={categoryHref} className="warm-editorial-story-kicker">
                                {post.category}
                              </Link>
                            ) : (
                              <span className="warm-editorial-story-kicker">{post.category}</span>
                            )
                          )}
                          <Link href={`/${post.slug}`} className="warm-editorial-story-body">
                            <h3>{post.title}</h3>
                            {post.description && <p>{post.description}</p>}
                            <div className="warm-editorial-meta">
                              <time>{formatDate(post.published_at)}</time>
                              <PostMarker post={post} />
                            </div>
                          </Link>
                        </div>
                        {post.cover_image && (
                          <Link href={`/${post.slug}`} className="warm-editorial-story-media" aria-label={post.title}>
                            <CoverFrame post={post} size="thumb" />
                          </Link>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

            <div className="warm-editorial-pagination">
              <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/" />
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
