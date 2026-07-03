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
import { useLevels } from "@/features/cycles";
import {
  createFeeCategorySchema,
  type CreateFeeCategoryInput,
} from "../schemas";

interface FeeCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateFeeCategoryInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateFeeCategoryInput;

export function FeeCategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: FeeCategoryDialogProps) {
  const { data: levelsData, isLoading: loadingLevels } = useLevels({ per_page: 100 });
  const levels = levelsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createFeeCategorySchema) as never,
    defaultValues: {
      name: "",
      description: "",
      amount: 50000,
      level_id: null,
      is_mandatory: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        description: "",
        amount: 50000,
        level_id: null,
        is_mandatory: true,
      });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une catégorie de frais</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle ligne tarifaire (ex: Inscription, Scolarité T1, Uniformes).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => {
            const payload = { ...values };
            if (payload.level_id === "" || payload.level_id === "none") {
              payload.level_id = null;
            }
            await onSubmit(payload);
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="fee-name">Libellé des frais *</Label>
            <Input id="fee-name" {...register("name")} placeholder="ex: Frais de scolarité Trimestre 1" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee-desc">Description</Label>
            <Input id="fee-desc" {...register("description")} placeholder="ex: Premier versement obligatoire pour tous" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fee-amount">Montant (FCFA) *</Label>
              <Input
                id="fee-amount"
                type="number"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-level">Niveau ciblé</Label>
              <select
                id="fee-level"
                {...register("level_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingLevels}
              >
                <option value="none">Tous les niveaux (Général)</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="fee-mandatory"
              {...register("is_mandatory")}
              className="rounded border-input text-brand-500 focus:ring-brand-500 size-4"
            />
            <Label htmlFor="fee-mandatory" className="cursor-pointer font-medium text-sm">
              Frais obligatoire pour tous les élèves du niveau
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
