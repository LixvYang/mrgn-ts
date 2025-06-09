"use client";

import { Link } from "@/app/i18n/navigation";
import { useTranslations } from "next-intl";
import { ExternalLink } from "@/components/Links/ExternalLink";
import { getParticles, type Particle } from "./particles.config";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { HandCoinsIcon } from "@/components/ui/hand-coins";
import { FileTextIcon } from "@/components/ui/file-text";
import { CursorClickIcon } from "@/components/ui/cursor-click";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const ANIMATION_CLASSES = {
  "float-1": "animate-float-1",
  "float-2": "animate-float-2",
  "float-3": "animate-float-3",
  "float-4": "animate-float-4",
  "float-5": "animate-float-5",
  "float-6": "animate-float-6",
  "float-7": "animate-float-7",
  "float-8": "animate-float-8",
} as const;

export function Hero() {
  const t = useTranslations("Hero");
  const containerRef = useRef(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const fadeVariants = {
    hidden: { opacity: 0, y: 10, transition: { duration: 1 } },
    visible: { opacity: 1, y: 0, transition: { duration: 1 } },
  };

  useEffect(() => {
    setParticles(getParticles());
  }, []);
  const isInView = useInView(containerRef);

  return (
    <header className="relative overflow-hidden pt-24 pb-32 flex flex-col items-center justify-center text-center min-h-[110vh]">
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="w-[400px] h-[400px] dark:bg-blue-700/40 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />

        {particles.map((particle, index) => (
          <div
            key={index}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              position: "absolute",
              ...particle.position,
            }}
            className={`dark:bg-blue-400 bg-blue-600 rounded-full ${ANIMATION_CLASSES[particle.animation as keyof typeof ANIMATION_CLASSES]}`}
          />
        ))}
      </div>

      <div className="container relative z-10 max-w-5xl mx-auto px-5 space-y-16">
        <motion.h1
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeVariants}
          className="text-5xl font-medium bg-gradient-to-r from-blue-400 to-blue-600 leading-none inline-block text-transparent bg-clip-text sm:text-[3.5rem] md:text-7xl lg:leading-[1.15]"
        >
          {t("title")}
        </motion.h1>

        {/* <motion.div
          className="flex flex-col xs:flex-row gap-4 w-full md:gap-8"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {CONTENT.features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-r from-blue-400/40 to-blue-600/40 p-[1px] rounded-xl xs:w-1/2 md:w-full md:max-w-[20rem]"
              variants={fadeVariants}
            >
              <div className="flex flex-col gap-4 items-center justify-between rounded-xl px-4 py-6 text-center h-full bg-black/40 backdrop-blur-sm">
                {feature.icon}
                <div className="text-primary/80">{feature.body}</div>
                <ExternalLink href={feature.cta.target}>
                  <Button className="mt-2">
                    {feature.cta.label}
                    <CursorClickIcon className="ml-1.5" />
                  </Button>
                </ExternalLink>
              </div>
            </motion.div>
          ))}
        </motion.div> */}

        <motion.div initial="hidden" animate={isInView ? "visible" : "hidden"} variants={fadeVariants}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" asChild size="lg" className="w-full sm:w-auto py-6 px-12">
              <ExternalLink href="https://app.fluxor.cc">
                Launch dApp <CursorClickIcon />
              </ExternalLink>
            </Button>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
