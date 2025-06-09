import type { ReactNode } from 'react';
import { Banner } from 'fumadocs-ui/components/banner';
import { Footer } from "@/components/Footer/Footer";
import { NavigationProvider } from '@/components/Providers/NavigationProvider';
import { HomeLayoutWithI18n } from '@/components/Layouts/HomeLayoutWithI18n';

export default function Layout({ children }: { children: ReactNode; }): React.ReactElement {
  return (
    <NavigationProvider>
      {/* <Banner id="banner-1">
        I failed my way to success - Thomas Edison
      </Banner> */}
      <HomeLayoutWithI18n>
        {children}
      </HomeLayoutWithI18n>
      <Footer />
    </NavigationProvider>
  );
}
