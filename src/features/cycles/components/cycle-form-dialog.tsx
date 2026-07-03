"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCycleSchema,
  updateCycleSchema,
  type CreateCycleInput,
  type UpdateCycleInput,
} from "../schemas";
import type { CycleWithLevelsCount } from "../types";

interface CycleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle?: CycleWithLevelsCount | null;
  onSubmit: (values: CreateCycleInput | UpdateCycleInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateCycleInput;

export function CycleFormDialog({
  open,
  onOpenChange,
  cycle,
  onSubmit,
  isLoading = false,
}: CycleFormDialogProps) {
  const isEdit = !!cycle;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateCycleSchema : createCycleSchema) as never,
    defaultValues: {
      name: "",
      code: "",
      description: "",
      order: 1,
    },
  });

  useEffect(() => {
    if (open && cycle) {
      reset({
        name: cycle.name,
        code: cycle.code,
        description: cycle.description ?? "",
        order: cycle.order,
      });
    } else if (open) {
      reset({ name: "", code: "", description: "", order: 1 });
    }
  }, [open, cycle, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le cycle" : "Nouveau cycle"}</DialogTitle>
          <DialogDescription>
            Ex. : Premier Cycle, Second Cycle, Maternelle…
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => onSubmit(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="cycle-name">Nom *</Label>
            <Input id="cycle-name" {...register("name")} placeholder="Premier Cycle" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-code">Code *</Label>
              <Input id="cycle-code" {...register("code")} placeholder="PC" className="uppercase" />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-order">Ordre</Label>
              <Input
                id="cycle-order"
                type="number"
                min={1}
                {...register("order", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cycle-desc">Description</Label>
            <Input id="cycle-desc" {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
