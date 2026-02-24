"use client";

import { formatProbability, probToColor } from "@/lib/utils";

interface ProbabilityBarProps {
  probability: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProbabilityBar({
  probability,
  label,
  showValue = true,
  size = "md",
}: ProbabilityBarProps) {
  const height = size === "sm" ? "h-2" : size === "md" ? "h-3" : "h-4";
  const color = probToColor(probability);

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm font-mono font-medium" style={{ color }}>
              {formatProbability(probability)}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full rounded-full bg-[var(--color-secondary)] ${height} overflow-hidden`}
      >
        <div
          className={`${height} rounded-full transition-all duration-500`}
          style={{
            width: `${probability * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
