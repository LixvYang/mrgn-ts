"use client";

import { Logo } from "@/components/Logo/Logo";
import { Newsletter } from "@/components/Newsletter/Newsletter";
import { useTranslations } from "next-intl";
import { Github, Facebook, Globe, LayoutGrid } from "lucide-react";
import { ExternalLink } from "@/components/Links/ExternalLink";
import { MixinIcon } from "@/components/ui/mixin";
import { GithubIcon } from "@/components/ui/github";
import { LinkIcon } from "@/components/ui/link";
import { cn } from "@/utils/cn";

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

const FooterLink = ({ href, children }: FooterLinkProps) => (
  <ExternalLink href={href} className="py-2 text-sm font-normal transition hover:text-blue-600">
    {children}
  </ExternalLink>
);

interface FooterSectionProps {
  title: string;
  links: Array<{
    text: string;
    href: string;
  }>;
  className?: string;
}

const FooterSection = ({ title, links, className }: FooterSectionProps) => (
  <div className={cn("gap-1 flex flex-col items-start font-semibold", className)}>
    <div className="mb-4">
      <p className="font-bold uppercase">{title}</p>
    </div>
    {links.map((link) => (
      <FooterLink key={link.text} href={link.href}>
        {link.text}
      </FooterLink>
    ))}
  </div>
);

export function Footer() {
  const t = useTranslations("Footer");
  const socialData = t.raw("social") as Array<{
    name: string;
    url: string;
  }>;

  const solutionLinks = [
    { text: t("solution.marketing"), href: "#" },
    { text: t("solution.analytics"), href: "#" },
    { text: t("solution.commerce"), href: "#" },
    { text: t("solution.insights"), href: "#" },
  ];

  const aboutLinks = [
    { text: t("terms"), href: "#" },
    { text: t("license"), href: "#" },
    { text: t("privacy"), href: "#" },
  ];

  const getSocialIcon = (name: string) => {
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
  };

  return (
    <footer className="block">
      <div className="mx-auto w-full max-w-7xl px-5 py-4 md:px-10 md:py-8">
        <div className="flex flex-col gap-8">
          <div className="grid md:grid-cols-[2fr_1fr_1fr] items-start gap-6 md:gap-8">
            <div className="flex flex-col items-start gap-6">
              <div>
                <Logo />
              </div>
              <p className="hidden md:block">{t("description")}</p>
              <div className="hidden md:grid w-full max-w-52 grid-flow-col grid-cols-3 gap-3">
                {socialData?.map((link) => (
                  <ExternalLink
                    key={link.name}
                    href={link.url}
                    // className="mx-auto flex max-w-6 flex-col items-center justify-center text-fd-foreground"
                  >
                    {getSocialIcon(link.name)}
                  </ExternalLink>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-0 col-span-2 md:col-span-1">
              {/* <FooterSection title={t("solution.title")} links={solutionLinks} /> */}
              <FooterSection title={t("about.title")} links={aboutLinks} className="md:hidden" />
            </div>

            <FooterSection title={t("about.title")} links={aboutLinks} className="hidden md:flex" />
          </div>

          <div className="md:hidden flex flex-col items-start gap-6">
            <p>{t("description")}</p>
            <div className="grid w-full max-w-52 grid-flow-col grid-cols-3 mx-auto gap-3">
              {socialData?.map((link) => (
                <ExternalLink
                  key={link.name}
                  href={link.url}
                  // className="mx-auto flex max-w-6 flex-col items-center justify-center text-fd-foreground"
                >
                  {getSocialIcon(link.name)}
                </ExternalLink>
              ))}
            </div>
          </div>

          <div className="flex justify-center items-center pt-4 border-t">
            <p className="text-sm sm:text-base text-muted-foreground">{t("copyright")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
