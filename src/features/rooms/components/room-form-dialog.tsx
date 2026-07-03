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
  createRoomSchema,
  updateRoomSchema,
  type CreateRoomInput,
  type UpdateRoomInput,
} from "../schemas";
import type { Room } from "../types";

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSubmit: (values: CreateRoomInput | UpdateRoomInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateRoomInput;

export function RoomFormDialog({
  open,
  onOpenChange,
  room,
  onSubmit,
  isLoading = false,
}: RoomFormDialogProps) {
  const isEdit = !!room;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateRoomSchema : createRoomSchema) as never,
    defaultValues: {
      name: "",
      type: "classroom",
      capacity: 40,
      floor: 0,
      building: "",
      is_available: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (room) {
        reset({
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          floor: room.floor ?? 0,
          building: room.building ?? "",
          is_available: room.is_available,
        });
      } else {
        reset({
          name: "",
          type: "classroom",
          capacity: 40,
          floor: 0,
          building: "",
          is_available: true,
        });
      }
    }
  }, [open, room, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la salle" : "Créer une salle"}</DialogTitle>
          <DialogDescription>
            Enregistrez les informations physiques de la salle pour pouvoir l'attribuer aux cours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Nom de la salle *</Label>
            <Input id="room-name" {...register("name")} placeholder="ex: Salle 104, Labo de Chimie" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room-type">Type de salle</Label>
              <select
                id="room-type"
                {...register("type")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="classroom">Salle de cours</option>
                <option value="lab">Laboratoire</option>
                <option value="library">Bibliothèque</option>
                <option value="gym">Gymnase</option>
                <option value="office">Bureau</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-capacity">Capacité (Places) *</Label>
              <Input
                id="room-capacity"
                type="number"
                min="1"
                {...register("capacity", { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p className="text-xs text-destructive">{errors.capacity.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room-building">Bâtiment</Label>
              <Input id="room-building" {...register("building")} placeholder="ex: Bâtiment B" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-floor">Étage</Label>
              <Input
                id="room-floor"
                type="number"
                {...register("floor", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="room-available"
              {...register("is_available")}
              className="rounded border-input text-brand-500 focus:ring-brand-500 size-4"
            />
            <Label htmlFor="room-available" className="cursor-pointer font-medium text-sm">
              Salle disponible pour les réservations
            </Label>
          </div>

          <DialogFooter className="pt-2">
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
