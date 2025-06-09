"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Twitter, Github, Facebook, Globe, LayoutGrid } from "lucide-react";
import { Logo } from "@/components/Logo/Logo";
import type { HomeLayout } from "@/utils/types";
import { MixinIcon } from "@/components/ui/mixin";
import { GithubIcon } from "@/components/ui/github";
import { LinkIcon } from "@/components/ui/link";
// 创建上下文
const NavigationContext = createContext<HomeLayout | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const nav = useTranslations("Navigation");
  const blogNav = useTranslations("BlogNav");
  const footerT = useTranslations("Footer");

  // 获取社交媒体数据
  const socialData = footerT.raw("social") as Array<{
    name: string;
    url: string;
  }>;

  // 将社交媒体数据转换为需要的格式
  const socialLinks = socialData.map((item) => ({
    icon: getSocialIcon(item.name),
    name: item.name,
    url: item.url,
  }));

  // FAQ数据
  const faqData = useTranslations("FAQ").raw("questions") as Array<{
    key: number;
    question: string;
    answer: string;
  }>;

  const layoutOptions: HomeLayout = {
    githubUrl: "https://github.com/frontendweb3/Nextify",
    i18n: true,
    nav: {
      title: <Logo />,
      transparentMode: "top",
    },
    links: [
      { url: "/", text: nav("home") },
      { url: "/docs", text: nav("documentation") },
      // { url: "/blog", text: nav("blog") },
      // { url: "/page/about", text: nav("about") },
      // { url: "/page/changelog", text: nav("changelog") },
      {
        url: "https://mixin.one/codes/6530b1e8-3e81-42ab-ab65-96cbf709b771",
        text: "Mixin",
        type: "icon",
        icon: <MixinIcon />,
      },
    ],
    blog_nav: [
      { name: blogNav("computerScience"), url: "/blog/tag/computer-science" },
      { name: blogNav("photography"), url: "/blog/tag/photography" },
      { name: blogNav("programming"), url: "/blog/tag/programming" },
    ],
    social: socialLinks,
    faqs: faqData,
  };

  return <NavigationContext.Provider value={layoutOptions}>{children}</NavigationContext.Provider>;
}

// 辅助函数：根据名称获取社交媒体图标
function getSocialIcon(name: string) {
  switch (name) {
    case "Github":
      return <GithubIcon />;
    case "Mixin":
      return <MixinIcon />;
    case "Website":
      return <LinkIcon />;
    default:
      return <Globe />;
  }
}

// Hook 用于获取配置
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
