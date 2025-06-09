import { defineDocs, defineConfig, defineCollections } from 'fumadocs-mdx/config';
import { frontmatterSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

export const { docs, meta } = defineDocs({
  dir: 'content/docs',
});

export const blogPosts = defineCollections({
  type: "doc",
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    author: z.string().optional(),
    date: z.string().date().or(z.date()).optional(),
    tags: z.string().array().optional(),
    image: z.string().trim().optional(),
    category: z.string().array().optional()
  })
});

export const pagesPosts = defineCollections({
  type: 'doc',
  dir: 'content/pages',
  schema: frontmatterSchema.extend({
    author: z.string().optional(),
    date: z.string().date().or(z.date()).optional(),
    tags: z.string().array().optional(),
    image: z.string().trim().optional()
  })
})

export default defineConfig();
