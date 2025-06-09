"use client";

import { Link } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';

export function BlogNav() {
  const blogNav = useTranslations('BlogNav');
  
  const categories = [
    { name: blogNav('computerScience'), url: "/blog/tag/computer-science" },
    { name: blogNav('photography'), url: "/blog/tag/photography" },
    { name: blogNav('programming'), url: "/blog/tag/programming" }
  ];
  
  return (
    <div className="my-10 md:my-20 flex flex-col md:flex-row justify-center gap-3">
      {categories.map(category => (
        <Link 
          href={{ pathname: '/blog', query: { tag: category.url.split('/').pop() } }}
          key={category.url} 
          className="px-4 py-2 bg-fd-primary text-fd-primary-foreground font-semibold rounded-full"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
} 