import { cn } from "@/utils/cn";
import React from "react";
import Image from "next/image";

export function Logo({ className, width = 28, height = 28 }: { className?: string; width?: number; height?: number }) {
  return (
    <div className={cn("mx-auto flex flex-row items-center justify-center", className)}>
      <Image src="/images/fluxor.png" alt="Fluxor Logo" width={width} height={height} />
      <p className="ml-2 text-2xl"> Fluxor </p>
    </div>
  );
}
