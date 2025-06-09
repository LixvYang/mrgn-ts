"use client";

import React from "react";
import { WorkCard } from "./work-card";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
export function Work() {
  const t = useTranslations("Work");

  const lists = [
    {
      step: 1,
      title: t("step1.title"),
      description: t("step1.description"),
    },
    {
      step: 2,
      title: t("step2.title"),
      description: t("step2.description"),
    },
    {
      step: 3,
      title: t("step3.title"),
      description: t("step3.description"),
      hide: false,
    },
  ];

  return (
    <section className="py-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-5 py-16 md:px-10 md:py-20">
        <p className="font-inter mb-2 text-center text-sm font-medium">{t("steps")}</p>
        <h1 className="text-center text-4xl font-bold lg:text-6xl">{t("title")}</h1>
        <p className="font-inter mx-auto mb-12 mt-4 max-w-1xl px-5 text-center text-base font-light">
          {t("description")}
        </p>
        <div className="mt-12 flex flex-col items-start justify-center lg:flex-row">
          {lists.map((li) => (
            <WorkCard key={li.step} step={li.step} hide={li.hide} title={li.title} description={li.description} />
          ))}
        </div>
      </div>
    </section>
  );
}
