import Card from "@/components/Card/Card"
import { blog } from '@/lib/source';
import { createMetadata } from "@/utils/metadata";
import type { Metadata } from "next";
import { BlogNav } from '@/components/Blog/BlogNav';

export default async function Page() {
  const posts = [...blog.getPages()].sort(
    (a, b) =>
      new Date(b.data.date ?? b.file.name).getTime() -
      new Date(a.data.date ?? a.file.name).getTime(),
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-20">
      <div className="text-center mb-12">
        <h2 className="mb-4 mt-6 text-3xl font-bold md:text-5xl">
          The latest and greatest news
        </h2>
        <p className="mt-2">
          Lorem ipsum dolor sit amet elit ut aliquam
        </p>
        <BlogNav />
      </div>

      {/* Blog Content */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {posts.map((post, index) => <Card
            key={`${post.url}-${index}`}
            title={post.data.title}
            author={post.data?.author}
            date={post.data?.date}
            url={post.url}
            category={post.data?.category}
            image={post.data?.image}
          />
          )
          }
        </div>
      </div>
    </section>
  );
}

export function generateMetadata(): Metadata {
  return createMetadata({
    title: "Blog - Home Page",
    description: 'Read our latest blog post about the upcoming announcement, product updates, etc.',
    openGraph: {
      url: '/blog',
    },
  });
}
