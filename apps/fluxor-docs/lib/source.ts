import { i18n } from '@/lib/i18n';
import { createMDXSource } from 'fumadocs-mdx';
import { loader } from 'fumadocs-core/source';
import type { InferMetaType, InferPageType } from 'fumadocs-core/source';
import { docs, meta, blogPosts, pagesPosts } from '@/.source';

export const source = loader({
  i18n,
  baseUrl: '/docs',
  source: createMDXSource(docs, meta)
});

export const blog = loader({
  i18n,
  baseUrl: '/blog',
  source: createMDXSource(blogPosts, []),
});

export const pageLists = loader({
  i18n,
  baseUrl: '/pages',
  source: createMDXSource(pagesPosts, [])
});

export type DocsPage = InferPageType<typeof source>;
export type DocsMeta = InferMetaType<typeof source>;
export type BlogPage = InferPageType<typeof blog>;
export type BlogMeta = InferMetaType<typeof blog>;
export type PagesType = InferPageType<typeof pageLists>;
export type PagesMeta = InferMetaType<typeof pageLists>;
