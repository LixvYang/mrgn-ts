import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { NavigationProvider } from '@/components/Providers/NavigationProvider';
import { DocsLayoutWithI18n } from '@/components/Layouts/DocsLayoutWithI18n';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const lang = (await params).lang;

  return (
    <NavigationProvider>
      <DocsLayoutWithI18n tree={source.pageTree[lang]}>
        {children}
      </DocsLayoutWithI18n>
    </NavigationProvider>
  );
}

