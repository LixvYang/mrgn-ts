"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { cn } from "@/utils/cn";

export interface MixinIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface MixinIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const iconVariants: Variants = {
  normal: {
    rotate: 0,
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  animate: {
    rotate: [0, 360],
    scale: [0.9, 1.1, 1],
    opacity: [0, 1],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
  hover: {
    rotate: [0, 360],
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

const MixinIcon = forwardRef<MixinIconHandle, MixinIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          await controls.start("animate");
          controls.start("hover");
        },
        stopAnimation: () => {
          controls.start("normal");
        },
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          await controls.start("animate");
          controls.start("hover");
        } else {
          onMouseEnter?.(e);
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start("normal");
        } else {
          onMouseLeave?.(e);
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div className={cn(className)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 26 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          variants={iconVariants}
          initial="normal"
          animate={controls}
        >
          <motion.path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M25.6287 0C25.83 0 25.9939 0.160567 26 0.360959L26.0002 0.372563V19.6273C26.0002 19.6827 25.9879 19.7373 25.9642 19.7872C25.8779 19.9694 25.6632 20.049 25.4803 19.9689L25.4693 19.9639L20.7068 17.694C20.4849 17.5883 20.3418 17.3663 20.336 17.1209L20.3358 17.1052V2.56665C20.3358 2.30646 20.4899 2.07171 20.727 1.96855L20.7411 1.96263L25.4889 0.0274101C25.5333 0.00930793 25.5808 0 25.6287 0ZM0.371435 0C0.419373 0 0.466858 0.00930793 0.51127 0.0274101L5.25908 1.96263C5.50412 2.06251 5.66438 2.30135 5.66438 2.56665V17.1052C5.66438 17.3568 5.51997 17.586 5.29334 17.694L0.530845 19.9639C0.34556 20.0522 0.123986 19.9731 0.0359467 19.7872C0.0122794 19.7373 0 19.6827 0 19.6273V0.372563C0 0.166802 0.166297 0 0.371435 0ZM13.4176 4.20606L17.8091 6.74916C18.0676 6.8989 18.2269 7.17564 18.2269 7.47512V12.5613C18.2269 12.8608 18.0676 13.1375 17.8091 13.2873L13.4176 15.8304C13.159 15.9801 12.8405 15.9801 12.5819 15.8304L8.19045 13.2873C7.93187 13.1375 7.77258 12.8608 7.77258 12.5613V7.47512C7.77258 7.17564 7.93187 6.8989 8.19045 6.74916L12.5819 4.20606C12.8405 4.05631 13.159 4.05631 13.4176 4.20606Z"
            fill="url(#paint0_linear_530_59334)"
          />
          <defs>
            <linearGradient id="paint0_linear_530_59334" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#44B9FF" />
              <stop offset="1" stopColor="#3688FF" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>
    );
  }
);

MixinIcon.displayName = "MixinIcon";

export { MixinIcon };
