import type { ReactNode } from "react";
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export interface TypeSocial {
  icon: ReactNode; name: string; url: string
}

export interface TypeFAQ {
  question: string; answer: string, key: number
}

export interface TypeBlogNav {
  name: string; url: string
}

export interface HomeLayout extends BaseLayoutProps {
  social?: TypeSocial[];
  faqs?: TypeFAQ[]
  blog_nav?: TypeBlogNav[]
}
