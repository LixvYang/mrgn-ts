import { Hero } from '@/components/Hero/Hero';
import { Work } from '@/components/Work/Work';
import { FAQ } from '@/components/FAQ/FAQ';
import { Testimonial } from '@/components/Testimonial/Testimonial';
import { baseUrl, createMetadata } from "@/utils/metadata";
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/app/i18n';

export const metadata = createMetadata({
  title: 'Fluxor',
  description: 'Fluxor is a decentralized dApp built on MarginFi, enabling you to access native yield, embedded risk systems, and off-chain data plugins anywhere. Use Fluxor to access the margin you need, when you need it.',
  metadataBase: baseUrl,
});

// Generate static params for all supported locales
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  // Wait for params to resolve before using its properties
  const resolvedParams = await params;
  
  // Enable static rendering
  setRequestLocale(resolvedParams.lang);
  
  return (
    <>
      <Hero />
      {/* <Work /> */}
      <FAQ />
      {/* <Testimonial /> */}
    </>
  );
}

