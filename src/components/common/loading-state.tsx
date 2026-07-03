"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
  className?: string;
  variant?: "spinner" | "skeleton" | "page";
  skeletonCount?: number;
}

export function LoadingState({
  message = "Chargement en cours...",
  className,
  variant = "spinner",
  skeletonCount = 3,
}: LoadingStateProps) {
  if (variant === "page") {
    return (
      <div className={cn("flex flex-col items-center justify-center min-h-[50vh] p-8", className)}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-4"
        >
          <Loader2 className="w-10 h-10 text-primary" />
        </motion.div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4 w-full", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 p-4 border border-border/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center p-8 gap-3", className)}>
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
