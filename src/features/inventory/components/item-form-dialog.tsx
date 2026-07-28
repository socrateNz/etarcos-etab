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
import { createItemSchema, updateItemSchema, type CreateItemInput, type UpdateItemInput } from "../schemas";
import type { Item } from "../types";

interface ItemFormDialogProps {
  open: boolean;
  item?: Item;
  onClose: () => void;
  onSubmit: (values: CreateItemInput | UpdateItemInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateItemInput;

export function ItemFormDialog({ open, item, onClose, onSubmit, isLoading = false }: ItemFormDialogProps) {
  const isEdit = !!item;
  const schema = isEdit ? updateItemSchema.omit({ id: true }) : createItemSchema;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: "",
      code: "",
      category: "",
      description: "",
      quantity: 0,
      unit: "unité",
      location: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(item
        ? { name: item.name, code: item.code, category: item.category ?? "", description: item.description ?? "", quantity: item.quantity, unit: item.unit, location: item.location ?? "" }
        : { name: "", code: "", category: "", description: "", quantity: 0, unit: "unité", location: "" }
      );
    }
  }, [open, item, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    if (isEdit && item) {
      await onSubmit({ ...values, id: item.id });
    } else {
      await onSubmit(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'article" : "Ajouter un article à l'inventaire"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez la fiche de l'article." : "Enregistrez un nouveau bien ou consommable."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Nom de l'article <span className="text-destructive">*</span></Label>
              <Input {...register("name")} placeholder="Ex: Rames de papier A4, Projecteur..." />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Code / Référence <span className="text-destructive">*</span></Label>
              <Input {...register("code")} placeholder="Ex: PAP-001" />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Input {...register("category")} placeholder="Fournitures, Électronique..." />
            </div>

            <div className="space-y-1.5">
              <Label>Quantité initiale <span className="text-destructive">*</span></Label>
              <Input type="number" min={0} {...register("quantity")} disabled={isEdit} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Unité de mesure <span className="text-destructive">*</span></Label>
              <Input {...register("unit")} placeholder="unité, carton, kg, rame..." />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label>Localisation (Bâtiment, bureau, stock)</Label>
              <Input {...register("location")} placeholder="Ex: Magasin Central, Étagère B" />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label>Description / Notes</Label>
              <Textarea {...register("description")} placeholder="Détails complémentaires..." rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer l'article"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
