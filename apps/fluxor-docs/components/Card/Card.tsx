import { Link } from '@/app/i18n/navigation';
import Image from "next/image";
import dayjs from 'dayjs';
import type { ComponentProps } from 'react';
import type { Link as LinkType } from '@/app/i18n/navigation';

type LinkProps = ComponentProps<typeof LinkType>;
type LinkHref = LinkProps['href'];

export default function Card({ title, author, date, url, category, image }: { title: string; author?: string; date?: Date | string | undefined; url: string, category?: string[] | undefined, image?: string | undefined }) {
  // 从URL中提取文章slug
  const pathSegments = url.split('/');
  const slug = pathSegments[pathSegments.length - 1];
  
  // 根据URL类型构建不同的href对象
  const getHref = (): LinkHref => {
    if (url.includes('/tag/')) {
      return { pathname: '/blog/tag/[tag]', params: { tag: slug } };
    } 
    
    if (url.includes('/page/')) {
      return { pathname: '/page/[slug]', params: { slug } };
    } 
    
    if (url.startsWith('/blog/') && url !== '/blog') {
      return { pathname: '/blog/[slug]', params: { slug } };
    } 
    
    if (url === '/blog') {
      return '/blog';
    } 
    
    if (url === '/docs') {
      return '/docs';
    } 
    
    if (url === '/') {
      return '/';
    }
    
    // 默认情况下，假设是博客文章
    return { pathname: '/blog/[slug]', params: { slug } };
  };

  return (
    <div className="bg-fd-card shadow-sm rounded-lg border-fd-border overflow-hidden">
      <div className="relative h-80">
        {
          image && <Image
            className="h-80 w-full object-cover"
            src={image}
            alt={title}
            height={324}
            width={324}
          />

        }
        {
          category && <span className="absolute shadow bottom-5 right-5 text-sm font-semibold px-2.5 py-2 rounded bg-fd-primary text-fd-primary-foreground">
            {category[0]}
          </span>
        }
      </div>

      <div className="flex flex-col items-start py-4 px-4">
        <Link href={getHref()} className="mb-4 text-xl font-bold md:text-2xl"> {title} </Link>
        <div className="flex flex-row items-start text-sm lg:items-center">
          <p> Published by </p>
          {author && <p className="font-bold mx-1.5"> {author} </p>}
          {date && <p className="text-sm hidden sm:inline"> on {dayjs(date).format("MMMM DD, YYYY")} </p>}
        </div>
      </div>
    </div>
  )
}
