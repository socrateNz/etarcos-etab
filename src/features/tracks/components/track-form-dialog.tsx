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
  createTrackSchema,
  updateTrackSchema,
  type CreateTrackInput,
  type UpdateTrackInput,
} from "../schemas";
import type { Track } from "../types";

interface TrackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: Track | null;
  onSubmit: (values: CreateTrackInput | UpdateTrackInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateTrackInput;

export function TrackFormDialog({
  open,
  onOpenChange,
  track,
  onSubmit,
  isLoading = false,
}: TrackFormDialogProps) {
  const isEdit = !!track;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateTrackSchema : createTrackSchema) as never,
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open && track) {
      reset({
        name: track.name,
        code: track.code,
        description: track.description ?? "",
      });
    } else if (open) {
      reset({ name: "", code: "", description: "" });
    }
  }, [open, track, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la filière" : "Nouvelle filière"}</DialogTitle>
          <DialogDescription>
            Ex. : Scientifique (S), Littéraire (L), Gestion, Informatique…
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => onSubmit(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="track-name">Nom *</Label>
            <Input id="track-name" {...register("name")} placeholder="Scientifique" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="track-code">Code *</Label>
            <Input id="track-code" {...register("code")} placeholder="S" className="uppercase" />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="track-desc">Description</Label>
            <Input id="track-desc" {...register("description")} />
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
