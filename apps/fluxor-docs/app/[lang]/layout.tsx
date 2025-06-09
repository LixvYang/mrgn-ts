import '@/styles/global.css';

import { I18nProvider, type Translations } from 'fumadocs-ui/i18n';
import { RootProvider } from 'fumadocs-ui/provider';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '@/app/i18n';
import { setRequestLocale } from 'next-intl/server';

// Define translations for fumadocs UI
const zhCn: Partial<Translations> = {
  search: '搜索',
  // Add other translations as needed
};

const zhTw: Partial<Translations> = {
  search: '搜尋',
  // Add other translations as needed
};

// Available languages that will be displayed on UI
// Make sure `locale` is consistent with your i18n config
const localeMappings = [
  {
    name: 'English',
    locale: 'en',
  },
  {
    name: 'Simplified Chinese',
    locale: 'zh-cn',
  },
  {
    name: 'Traditional Chinese',
    locale: 'zh-tw',
  },
];

type TranslationsMap = {
  'zh-cn': Partial<Translations>;
  'zh-tw': Partial<Translations>;
};

const translationsMap: TranslationsMap = {
  'zh-cn': zhCn,
  'zh-tw': zhTw
};

// Generate static params for all supported locales
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  
  // Validate that the incoming locale is valid
  if (!locales.includes(lang)) {
    notFound();
  }
  
  // Enable static rendering
  setRequestLocale(lang);
  
  // Load translations
  let messages: Record<string, Record<string, string>>;
  try {
    messages = (await import(`../../messages/${lang}/index.json`)).default;
  } catch {
    notFound();
  }
  
  const translations = translationsMap[lang as keyof TranslationsMap];

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body>
        <NextIntlClientProvider 
          locale={lang} 
          messages={messages}
          timeZone="UTC"
          now={new Date()}
        >
          <I18nProvider
            locale={lang}
            locales={localeMappings}
            translations={translations}
          >
            <RootProvider>{children}</RootProvider>
          </I18nProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

