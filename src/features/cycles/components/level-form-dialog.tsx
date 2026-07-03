"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Combobox } from "@/components/ui/combobox";
import {
  createLevelSchema,
  updateLevelSchema,
  type CreateLevelInput,
  type UpdateLevelInput,
} from "../schemas";
import type { LevelWithCycle } from "../types";
import { useCycleOptions } from "../hooks/use-cycles";

interface LevelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level?: LevelWithCycle | null;
  defaultCycleId?: string;
  onSubmit: (values: CreateLevelInput | UpdateLevelInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateLevelInput;

export function LevelFormDialog({
  open,
  onOpenChange,
  level,
  defaultCycleId,
  onSubmit,
  isLoading = false,
}: LevelFormDialogProps) {
  const isEdit = !!level;
  const { data: cycleOptions = [] } = useCycleOptions();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateLevelSchema : createLevelSchema) as never,
    defaultValues: {
      name: "",
      code: "",
      cycle_id: defaultCycleId ?? "",
      order: 1,
    },
  });

  useEffect(() => {
    if (open && level) {
      reset({
        name: level.name,
        code: level.code,
        cycle_id: level.cycle_id,
        order: level.order,
      });
    } else if (open) {
      reset({
        name: "",
        code: "",
        cycle_id: defaultCycleId ?? cycleOptions[0]?.id ?? "",
        order: 1,
      });
    }
  }, [open, level, defaultCycleId, cycleOptions, reset]);

  const comboboxOptions = cycleOptions.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.code})`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le niveau" : "Nouveau niveau"}</DialogTitle>
          <DialogDescription>
            Ex. : 6ème, 5ème, CP, CE1…
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => onSubmit(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Cycle *</Label>
            <Controller
              name="cycle_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={comboboxOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Sélectionner un cycle"
                  emptyMessage="Aucun cycle. Créez-en un d'abord."
                />
              )}
            />
            {errors.cycle_id && (
              <p className="text-xs text-destructive">{errors.cycle_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="level-name">Nom *</Label>
            <Input id="level-name" {...register("name")} placeholder="6ème" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level-code">Code *</Label>
              <Input id="level-code" {...register("code")} placeholder="6EME" className="uppercase" />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="level-order">Ordre</Label>
              <Input
                id="level-order"
                type="number"
                min={1}
                {...register("order", { valueAsNumber: true })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || comboboxOptions.length === 0}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
