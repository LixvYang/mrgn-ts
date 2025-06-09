import { pageLists } from '@/lib/source';
import { createMetadata } from '@/utils/metadata';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Asterisk } from "lucide-react"

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {

  const { slug } = await params

  const page = pageLists.getPage([slug]);

  if (!page) notFound();
  const MDX = page.data.body;
  return (
    <>
      <div className="w-full max-w-4xl mx-auto py-12  md:py-16 lg:py-20">
        <div className="space-y-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {page.data.title}
          </h1>
        </div>

        <div className="container mt-4 prose prose-gray max-w-none dark:prose-invert">
          <MDX components={{ ...defaultMdxComponents }} />
        </div>
      </div>
      <div className="flex w-full items-center">
        <div className="flex-1 border-b border-fd-border"></div>
        <span className=" flex flex-row text-lg font-semibold leading-8 px-8 py-3"> <Asterisk /> <Asterisk /> <Asterisk /> </span>
        <div className="flex-1 border-b border-fd-border"></div>
      </div>
    </>
  )
}

export function generateStaticParams() {
  return pageLists.getPages().map((page) => {
    return ({
      slug: page.slugs[0],
    })
  });
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {

  const { slug } = await params

  const page = pageLists.getPage([slug]);

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
