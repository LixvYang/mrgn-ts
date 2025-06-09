"use client";

import { Link } from "@/app/i18n/navigation";
import { useTranslations } from "next-intl";
import { Github, Facebook, Globe } from "lucide-react";
import { MixinIcon } from "../ui/mixin";
import { GithubIcon } from "../ui/github";
import { LinkIcon } from "../ui/link";
export function SocialLinks() {
  const socialData = useTranslations("Footer").raw("social") as Array<{
    name: string;
    url: string;
  }>;

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
    <div className="grid grid-flow-col grid-cols-3 gap-3">
      {socialData.map((link) => (
        <Link key={link.name} href={link.url as any} className="flex items-center justify-center">
          {getSocialIcon(link.name)}
        </Link>
      ))}
    </div>
  );
}
