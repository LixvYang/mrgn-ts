"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { useTranslations } from "next-intl";
export default function MaintenancePage() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef);
  const t = useTranslations("Maintenance");

  const fadeVariants = {
    hidden: { opacity: 0, y: 20, transition: { duration: 0.8 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4">
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      >
        <div className="w-[400px] h-[400px] dark:bg-blue-700/40 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="text-center max-w-lg mx-auto p-8 rounded-2xl backdrop-blur-sm relative z-10"
      >
        <motion.div variants={fadeVariants} className="text-4xl mb-6">
          🛠️
        </motion.div>

        <motion.h1
          variants={fadeVariants}
          className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 tracking-tight mb-4"
        >
          {t("title")}
        </motion.h1>

        <motion.p variants={fadeVariants} className="text-lg text-gray-700 dark:text-gray-200/80  leading-relaxed">
          {t("description")}
        </motion.p>
      </motion.div>
    </div>
  );
}
