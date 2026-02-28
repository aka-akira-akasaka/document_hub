"use client";

import { Badge } from "@/components/ui/badge";
import { ATTITUDE_COLORS, ATTITUDE_LABELS } from "@/lib/constants";
import type { Attitude } from "@/types/stakeholder";
import { cn } from "@/lib/utils";

interface AttitudeBadgeProps {
  attitude: Attitude;
  className?: string;
}

export function AttitudeBadge({ attitude, className }: AttitudeBadgeProps) {
  const colors = ATTITUDE_COLORS[attitude];
  return (
    <Badge
      variant="outline"
      className={cn(colors.bg, colors.text, colors.border, className)}
    >
      {ATTITUDE_LABELS[attitude]}
    </Badge>
  );
}
