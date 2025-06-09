import { blog } from '@/lib/source';
import { notFound } from 'next/navigation';
import Card from "@/components/Card/Card";
import slugify from 'slugify';
import type { BlogPage } from '@/lib/source';
import { createMetadata } from '@/utils/metadata';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const relatedPosts: BlogPage[] = [...blog.getPages()].filter(function(post) {
    return post.data.tags && post.data?.tags.some(function(tag: string) {
      const tagSlugify = slugify(tag, {
        lower: true,
        strict: false
      })
      return tagSlugify === slug
    });
  });

  if (relatedPosts === undefined || relatedPosts.length === 0) notFound();

  const getTitle = slug?.replace(/-/g, " ")

  return (<div className="mt-20 max-w-6xl mx-auto">
    <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl capitalize"> {getTitle} </h1>
    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {
        relatedPosts.map((post, index) => <Card
          key={`${post.url}-${index}`}
          title={post.data.title}
          author={post.data?.author}
          date={post.data?.date}
          url={post.url}
          category={post.data?.category}
          image={post.data?.image}
        />)
      }
    </div>
  </div>)

}
export function generateStaticParams() {

  const TagsList: { slug: string; }[] = []

  blog.getPages().map((post) => {
    if (post.data.tags !== undefined) {
      post.data.tags.filter(tag => {
        const formatTag = tag.toLowerCase().trim().split(" ").join("-")
        if (formatTag) {
          TagsList.push({ slug: formatTag })
        }
      })
    }
  })

  return TagsList
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {

  const { slug } = await params

  return createMetadata({
    title: slug?.replace(/-/g, " ") ,
    openGraph: {
      url: `/tag/${slug}`,
    },
  });
}
