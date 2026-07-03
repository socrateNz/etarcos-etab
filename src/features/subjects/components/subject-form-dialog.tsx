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
import { useTrackOptions } from "@/features/tracks";
import {
  createSubjectSchema,
  updateSubjectSchema,
  type CreateSubjectInput,
  type UpdateSubjectInput,
} from "../schemas";
import type { SubjectWithTrack } from "../types";

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: SubjectWithTrack | null;
  onSubmit: (values: CreateSubjectInput | UpdateSubjectInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateSubjectInput;

export function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
  onSubmit,
  isLoading = false,
}: SubjectFormDialogProps) {
  const isEdit = !!subject;
  const { data: tracks = [], isLoading: loadingTracks } = useTrackOptions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateSubjectSchema : createSubjectSchema) as never,
    defaultValues: {
      name: "",
      code: "",
      coefficient: 1.0,
      color: "#6366f1",
      description: "",
      track_id: null,
    },
  });

  useEffect(() => {
    if (open && subject) {
      reset({
        name: subject.name,
        code: subject.code,
        coefficient: subject.coefficient,
        color: subject.color ?? "#6366f1",
        description: subject.description ?? "",
        track_id: subject.track_id ?? null,
      });
    } else if (open) {
      reset({
        name: "",
        code: "",
        coefficient: 1.0,
        color: "#6366f1",
        description: "",
        track_id: null,
      });
    }
  }, [open, subject, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la matière" : "Nouvelle matière"}</DialogTitle>
          <DialogDescription>
            Configurez le nom, coefficient, et associez la matière à une filière spécifique si nécessaire.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => {
            // Convert empty track_id select values to null
            const payload = { ...values };
            if (payload.track_id === "" || payload.track_id === "all") {
              payload.track_id = null;
            }
            await onSubmit(payload);
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="subject-name">Nom *</Label>
            <Input id="subject-name" {...register("name")} placeholder="Mathématiques" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject-code">Code *</Label>
              <Input id="subject-code" {...register("code")} placeholder="MATH" className="uppercase" />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-coeff">Coefficient *</Label>
              <Input
                id="subject-coeff"
                type="number"
                step="0.25"
                min="0.25"
                max="20"
                {...register("coefficient", { valueAsNumber: true })}
              />
              {errors.coefficient && (
                <p className="text-xs text-destructive">{errors.coefficient.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="subject-track">Filière associée</Label>
              <select
                id="subject-track"
                {...register("track_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingTracks}
              >
                <option value="all">Toutes (Générale)</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
              {errors.track_id && (
                <p className="text-xs text-destructive">{errors.track_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-color" className="block">Couleur</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="subject-color"
                  type="color"
                  className="w-12 h-9 p-1 cursor-pointer"
                  {...register("color")}
                />
                <span className="text-xs font-mono text-muted-foreground">Couleur</span>
              </div>
              {errors.color && (
                <p className="text-xs text-destructive">{errors.color.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-desc">Description</Label>
            <Input id="subject-desc" {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
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
