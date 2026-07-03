"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  color?: "brand" | "violet" | "cyan" | "success" | "warning" | "danger";
  isLoading?: boolean;
  className?: string;
  index?: number;
}

const COLOR_CLASSES = {
  brand: {
    icon: "bg-brand-600/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400",
    accent: "bg-brand-gradient",
  },
  violet: {
    icon: "bg-violet-600/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
    accent: "bg-gradient-to-r from-violet-500 to-purple-600",
  },
  cyan: {
    icon: "bg-cyan-600/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400",
    accent: "bg-gradient-to-r from-cyan-500 to-teal-600",
  },
  success: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accent: "bg-gradient-to-r from-emerald-500 to-green-600",
  },
  warning: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    accent: "bg-gradient-to-r from-amber-500 to-orange-600",
  },
  danger: {
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
    accent: "bg-gradient-to-r from-red-500 to-rose-600",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "brand",
  isLoading = false,
  className,
  index = 0,
}: StatsCardProps) {
  const colors = COLOR_CLASSES[color];

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className={className}
    >
      <Card className="overflow-hidden group hover:shadow-md transition-shadow duration-300 relative">
        {/* Top accent bar */}
        <div className={cn("absolute top-0 left-0 right-0 h-0.5", colors.accent)} />

        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            {/* Icon */}
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.icon)}>
              <div className="w-5 h-5">{icon}</div>
            </div>

            {/* Trend badge */}
            {trend !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                  trend.value > 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : trend.value < 0
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {trend.value > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : trend.value < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>

          {/* Value */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {typeof value === "number" ? formatNumber(value) : value}
            </p>
          </motion.div>

          {/* Title & subtitle */}
          <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">{subtitle}</p>
          )}
          {trend?.label && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">{trend.label}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
