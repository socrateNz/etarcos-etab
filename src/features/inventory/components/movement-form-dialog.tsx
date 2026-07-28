"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStockMovementSchema, type CreateStockMovementInput } from "../schemas";
import type { Item } from "../types";

interface MovementFormDialogProps {
  open: boolean;
  item?: Item;
  onClose: () => void;
  onSubmit: (values: CreateStockMovementInput) => Promise<void>;
  isLoading?: boolean;
}

export function MovementFormDialog({ open, item, onClose, onSubmit, isLoading = false }: MovementFormDialogProps) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateStockMovementInput>({
    resolver: zodResolver(createStockMovementSchema as any),
    defaultValues: {
      item_id: item?.id ?? "",
      quantity: 1,
      type: "purchase",
      description: "",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (open) {
      reset({
        item_id: item?.id ?? "",
        quantity: 1,
        type: "purchase",
        description: "",
      });
    }
  }, [open, item, reset]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Mouvement de stock</DialogTitle>
          <DialogDescription>
            {item ? `Article : ${item.name} (${item.code}) — Stock actuel: ${item.quantity} ${item.unit}` : "Enregistrer une entrée ou sortie de stock."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <input type="hidden" {...register("item_id")} value={item?.id ?? ""} />

          <div className="space-y-1.5">
            <Label>Type de mouvement <span className="text-destructive">*</span></Label>
            <select
              {...register("type")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="purchase">Achat / Entrée (+)</option>
              <option value="usage">Consommation / Sortie (-)</option>
              <option value="return">Retour en stock (+)</option>
              <option value="loss">Perte / Vol / Casse (-)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Quantité ({selectedType === "usage" || selectedType === "loss" ? "retirée" : "ajoutée"}) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              {...register("quantity", {
                setValueAs: (v) => {
                  const num = Number(v);
                  // Turn negative for usage or loss
                  if (selectedType === "usage" || selectedType === "loss") {
                    return -Math.abs(num);
                  }
                  return Math.abs(num);
                },
              })}
            />
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Motif / Remarques</Label>
            <Textarea {...register("description")} placeholder="Raison du mouvement, numéro de bon d'achat/sortie..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer le mouvement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
