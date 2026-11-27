import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Tag, User } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getBlogBySlug } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getServerLang((await searchParams).lang);
  const data = await getBlogBySlug(slug);
  if (!data) return { title: 'Article Not Found | Ilangathir Trust' };

  const { post } = data;
  const title =
    pickLocalized(post as unknown as Record<string, unknown>, 'seo_title', lang) ||
    `${pickLocalized(post as unknown as Record<string, unknown>, 'title', lang)} | Ilangathir Trust`;
  const description =
    pickLocalized(post as unknown as Record<string, unknown>, 'seo_description', lang) ||
    pickLocalized(post as unknown as Record<string, unknown>, 'excerpt', lang);

  return buildPageMetadata({
    title,
    description,
    path: `/blog/${slug}`,
    lang,
    ogImage: post.featured_image_url || undefined
  });
}

export default async function BlogDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);

  const data = await getBlogBySlug(slug);
  if (!data) notFound();

  const { post, related } = data;
  const title = pickLocalized(post as unknown as Record<string, unknown>, 'title', lang);
  const excerpt = pickLocalized(post as unknown as Record<string, unknown>, 'excerpt', lang);
  const content = pickLocalized(post as unknown as Record<string, unknown>, 'content', lang);
  const alt = pickLocalized(post as unknown as Record<string, unknown>, 'featured_image_alt', lang) || title;
  const catName = lang === 'ta' ? post.category_name_ta : post.category_name_en;

  const blogJsonLd = buildBlogPostingJsonLd(post, lang);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.blog, path: '/blog' },
    { name: title, path: `/blog/${slug}` }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <article className="bg-white py-12 lg:py-16">
        <div className="container-max">
          <div className="mx-auto max-w-3xl">
            <Breadcrumbs items={[{ label: ui.blog, href: '/blog' }, { label: title }]} />

            <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700">
              <ArrowLeft className="h-4 w-4" />
              <span>{ui.backToBlog}</span>
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
              {catName && (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">{catName}</span>
              )}
              {post.published_at && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-brand-600" />
                  {new Date(post.published_at).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amberwarm-600" />
                {post.reading_time_minutes} {ui.minRead}
              </span>
            </div>

            <h1 className="mt-4 font-heading text-3xl font-extrabold text-slate-900 sm:text-5xl">
              {title}
            </h1>
            {excerpt && <p className="mt-4 text-lg leading-relaxed text-slate-600">{excerpt}</p>}

            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="h-4 w-4 text-brand-600" />
              <span>{post.author_name}</span>
              {post.author_role && <span className="text-slate-400">• {post.author_role}</span>}
            </div>

            {post.featured_image_url && (
              <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
                <img src={post.featured_image_url} alt={alt} className="max-h-[480px] w-full object-cover" />
              </div>
            )}

            <div className="mt-8 space-y-5 whitespace-pre-line text-base leading-relaxed text-slate-700">
              {content}
            </div>

            {post.media_gallery && post.media_gallery.length > 0 && (
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {post.media_gallery.map((m, idx) => (
                  <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    {m.type === 'video' ? (
                      <video src={m.url} controls className="w-full" />
                    ) : (
                      <img src={m.url} alt={m.caption_en || title} loading="lazy" className="h-60 w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-6">
                <Tag className="h-4 w-4 text-slate-400" />
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {related.length > 0 && (
            <div className="mt-16 border-t border-slate-200 pt-12">
              <h2 className="font-heading text-2xl font-bold text-slate-900">{ui.relatedArticles}</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((rel) => {
                  const rTitle = pickLocalized(rel as unknown as Record<string, unknown>, 'title', lang);
                  const rExcerpt = pickLocalized(rel as unknown as Record<string, unknown>, 'excerpt', lang);
                  return (
                    <Link
                      key={rel.id}
                      href={`/blog/${rel.slug}`}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                    >
                      {rel.featured_image_url && (
                        <img src={rel.featured_image_url} alt={rTitle} loading="lazy" className="h-44 w-full object-cover" />
                      )}
                      <div className="p-5">
                        <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-brand-600">{rTitle}</h3>
                        <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{rExcerpt}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
