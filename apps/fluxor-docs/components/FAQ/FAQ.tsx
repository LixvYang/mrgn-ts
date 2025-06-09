'use client';

import FAQItem from "./FAQItem.client";
import { useTranslations } from 'next-intl';
import { ExternalLink } from '@/components/Links/ExternalLink';

export function FAQ() {
  const t = useTranslations('FAQ');
  const faqQuestions = t.raw('questions') as Array<{
    key: number;
    question: string;
    answer: string;
  }>;
  
  return (
    <section>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-5 py-16 md:px-10 md:py-20">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-6 text-center lg:max-w-3xl lg:px-10">
          <h1 className="text-3xl lg:text-4xl font-bold ">
            {t('title')}
          </h1>
          <p className="font-inter mt-4 max-w-xl px-5 text-base font-light  lg:max-w-lg">
            {t('description')}
          </p>
        </div>
        <div className="mt-10 flex w-full max-w-4xl flex-col">
          {faqQuestions?.map((faq) => (
            <FAQItem 
              key={faq.key} 
              id={faq.key} 
              answer={faq.answer} 
              question={faq.question} 
            />
          ))}
        </div>
        <p className="font-inter mx-auto mt-12 text-base  text-center">
          {t('support')}
          <ExternalLink href="https://mixin.one/codes/6530b1e8-3e81-42ab-ab65-96cbf709b771" className="font-bold">
            {" "}
            {t('supportLink')}
          </ExternalLink>
        </p>
      </div>
    </section>
  )
}

