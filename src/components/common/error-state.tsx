"use client";

import { motion } from "framer-motion";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Une erreur est survenue",
  description = "Nous n'avons pas pu charger les données. Veuillez réessayer ou contacter le support si le problème persiste.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center border border-destructive/20 bg-destructive/5 rounded-2xl max-w-md mx-auto my-8",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Réessayer
        </Button>
      )}
    </motion.div>
  );
}
