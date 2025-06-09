import { blog } from '@/lib/source';
import { notFound } from 'next/navigation';
import dayjs from 'dayjs';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import Image from "next/image";
import { Share } from './share.client';
import Card from "@/components/Card/Card";
import { createMetadata } from '@/utils/metadata';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Asterisk } from "lucide-react"


export default async function Page({ params }: { params: Promise<{ slug: string }> }) {

  const { slug } = await params

  const post = blog.getPage([slug]);

  if (!post) notFound();

  const related = [...blog.getPages()].filter(function(singlePost) {
    return (post.data.tags && singlePost.data?.tags) && singlePost.data?.tags.some(function(tag: string) {
      return post.data?.tags?.includes(tag) && post.data.title !== singlePost.data.title;
    });
  });
  const MDX = post.data.body;
  return (
    <>
      <div className="w-full max-w-4xl mx-auto py-12  md:py-16 lg:py-20">
        <div className="space-y-8">
          {
            post.data.image && <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
              <Image
                src={post.data.image}
                alt={post.data.title}
                width={1280}
                height={720}
                className="h-full w-full object-cover"
                style={{ aspectRatio: "1280/720", objectFit: "cover" }}
              />
            </div>

          }
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {post.data.title}
            </h1>
            <p className="mt-2"> {post.data?.description} </p>
          </div>

          <div className="flex flex-row justify-between items-center gap-2">
            <div className="flex flex-col gap-1">
              <p className="font-medium">{post.data?.author}</p>
              <p className="text-sm text-muted-foreground">Published on  {dayjs(post.data?.date).format("MMMM DD, YYYY")} </p>
            </div>
            <Share url={post.url} />
          </div>
        </div>

        <div className="container mt-8 prose prose-gray max-w-none dark:prose-invert">
          <InlineTOC items={post.data.toc} />
          <MDX components={{ ...defaultMdxComponents }} />
        </div>
      </div>
      <div className="flex w-full items-center rounded-full">
        <div className="flex-1 border-b border-fd-border"></div>
        <span className=" flex flex-row text-lg font-semibold leading-8 px-8 py-3"> <Asterisk /> <Asterisk /> <Asterisk /> </span>
        <div className="flex-1 border-b border-fd-border"></div>
      </div>
      {
        (related !== undefined && related.length !== 0) && <div className="mt-16 max-w-6xl mx-auto">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl"> Related Posts </h1>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {
              related.map(post => <Card
                key={post.url}
                title={post.data.title}
                author={post.data?.author}
                date={post.data?.date}
                url={post.url}
                category={post.data?.category}
                image={post.data?.image}
              />)
            }
          </div>
        </div>
      }
    </>)
}


export function generateStaticParams() {
  return blog.getPages().map((page) => {
    return ({
      slug: page.slugs[0],
    })
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {

  const { slug } = await params

  const page = blog.getPage([slug]);

  if (!page) notFound();

  const description = page.data.description ?? 'Cupidatat voluptate deserunt non ea exercitation sit consequat ullamco ex nostrud elit magna.';

  const getImageURL: string = page.data.image ? page.data.image : "/banner.png"

  const image = {
    alt: page.data.title,
    url: getImageURL,
    width: 1200,
    height: 630,
  };

  return createMetadata({
    title: `${page.data.title} | Published By ${page.data.author}`,
    description,
    openGraph: {
      url: `/blog/${page.slugs.join('/')}`,
      images: image,
    },
    twitter: {
      images: image,
    },
  });
}
