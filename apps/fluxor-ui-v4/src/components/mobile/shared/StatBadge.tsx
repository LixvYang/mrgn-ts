import React from "react";

interface StatBadgeProps {
  label: string;
  value: string;
  tone?: "default" | "muted";
}

/**
 * Lightweight stat pill for mobile summaries.
 */
export const StatBadge = ({ label, value, tone = "default" }: StatBadgeProps) => {
  const toneClasses =
    tone === "muted"
      ? "bg-muted/40 text-muted-foreground border-border/70"
      : "bg-card/60 text-foreground border-border";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${toneClasses}`}>
      <span className="font-normal whitespace-nowrap">{label}</span>
      <span className="font-semibold whitespace-nowrap">{value}</span>
    </div>
  );
};

export default StatBadge;
