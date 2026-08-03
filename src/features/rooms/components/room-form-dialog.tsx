"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Layers, Sparkles } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createRoomSchema,
  updateRoomSchema,
  type CreateRoomInput,
  type UpdateRoomInput,
} from "../schemas";
import type { Room } from "../types";
import { createRoomsBatchAction } from "../actions";
import { roomsKeys } from "../hooks/use-rooms";

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSubmit: (values: CreateRoomInput | UpdateRoomInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateRoomInput;

interface RoomBatchRow {
  name: string;
  type: "classroom" | "lab" | "library" | "gym" | "office" | "other";
  capacity: number;
}

const ROOM_PRESETS = [
  {
    label: "🏫 Salles de Cours (101 à 105)",
    items: [
      { name: "Salle 101", type: "classroom" as const, capacity: 40 },
      { name: "Salle 102", type: "classroom" as const, capacity: 40 },
      { name: "Salle 103", type: "classroom" as const, capacity: 40 },
      { name: "Salle 104", type: "classroom" as const, capacity: 40 },
      { name: "Salle 105", type: "classroom" as const, capacity: 40 },
    ],
  },
  {
    label: "🔬 Laboratoires & Tech",
    items: [
      { name: "Labo de Physique", type: "lab" as const, capacity: 30 },
      { name: "Labo de Chimie", type: "lab" as const, capacity: 30 },
      { name: "Labo de SVT", type: "lab" as const, capacity: 30 },
      { name: "Salle Informatique", type: "lab" as const, capacity: 35 },
    ],
  },
  {
    label: "🏢 Équipements Spéciaux",
    items: [
      { name: "Bibliothèque / CDI", type: "library" as const, capacity: 60 },
      { name: "Gymnase", type: "gym" as const, capacity: 100 },
      { name: "Salle des Professeurs", type: "office" as const, capacity: 25 },
      { name: "Bureau Direction", type: "office" as const, capacity: 10 },
    ],
  },
];

export function RoomFormDialog({
  open,
  onOpenChange,
  room,
  onSubmit,
  isLoading = false,
}: RoomFormDialogProps) {
  const isEdit = !!room;
  const queryClient = useQueryClient();

  // Batch Mode States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchRows, setBatchRows] = useState<RoomBatchRow[]>([
    { name: "Salle 101", type: "classroom", capacity: 40 },
    { name: "Salle 102", type: "classroom", capacity: 40 },
    { name: "Labo de Physique", type: "lab", capacity: 30 },
  ]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

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
      setIsBatchMode(false);
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
        setBatchRows([
          { name: "Salle 101", type: "classroom", capacity: 40 },
          { name: "Salle 102", type: "classroom", capacity: 40 },
          { name: "Labo de Physique", type: "lab", capacity: 30 },
        ]);
      }
    }
  }, [open, room, reset]);

  const handleAddBatchRow = () => {
    const nextNum = 101 + batchRows.length;
    setBatchRows([
      ...batchRows,
      { name: `Salle ${nextNum}`, type: "classroom", capacity: 40 },
    ]);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const handleBatchRowChange = (index: number, field: keyof RoomBatchRow, val: string | number) => {
    const updated = [...batchRows];
    updated[index] = { ...updated[index], [field]: val };
    setBatchRows(updated);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = batchRows.filter((r) => r.name.trim() !== "");
    if (validRows.length === 0) {
      toast.error("Veuillez remplir au moins un nom de salle.");
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const res = await createRoomsBatchAction(validRows);
      if (res.error) {
        toast.error("Erreur de création groupée", { description: res.error });
      } else {
        toast.success(`${res.data?.length ?? validRows.length} salles créées avec succès !`);
        queryClient.invalidateQueries({ queryKey: roomsKeys.all });
        onOpenChange(false);
      }
    } catch {
      toast.error("Erreur inattendue lors de la création.");
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isBatchMode && !isEdit ? "sm:max-w-2xl" : "sm:max-w-md"}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{isEdit ? "Modifier la salle" : "Créer des salles"}</DialogTitle>
              <DialogDescription>
                {isBatchMode
                  ? "Créez rapidement les salles physiques et laboratoires de votre établissement."
                  : "Enregistrez les informations physiques de la salle."}
              </DialogDescription>
            </div>
            {!isEdit && (
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <Button
                  type="button"
                  size="xs"
                  variant={!isBatchMode ? "default" : "ghost"}
                  onClick={() => setIsBatchMode(false)}
                  className="text-xs"
                >
                  Unique
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={isBatchMode ? "default" : "ghost"}
                  onClick={() => setIsBatchMode(true)}
                  className="text-xs gap-1"
                >
                  <Layers className="w-3 h-3" /> Plusieur (Batch)
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {!isEdit && isBatchMode ? (
          /* Multi-room Batch Form */
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            {/* Presets Shortcuts */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-amber-500" /> Modèles de salles pré-configurées :
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {ROOM_PRESETS.map((p, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setBatchRows(p.items)}
                    className="text-xs bg-slate-50 dark:bg-slate-800 hover:bg-primary/10"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Dynamic Rows Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="grid grid-cols-12 gap-2 p-2 bg-muted/60 text-xs font-semibold text-muted-foreground border-b">
                <div className="col-span-5">Nom de la salle *</div>
                <div className="col-span-4">Type de salle</div>
                <div className="col-span-2">Capacité</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                {batchRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-5">
                      <Input
                        placeholder="ex: Salle 101"
                        value={row.name}
                        onChange={(e) => handleBatchRowChange(idx, "name", e.target.value)}
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-4">
                      <select
                        value={row.type}
                        onChange={(e) => handleBatchRowChange(idx, "type", e.target.value as any)}
                        className="w-full h-8 rounded border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="classroom">Salle de cours</option>
                        <option value="lab">Laboratoire</option>
                        <option value="library">Bibliothèque</option>
                        <option value="gym">Gymnase</option>
                        <option value="office">Bureau</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={1}
                        value={row.capacity}
                        onChange={(e) => handleBatchRowChange(idx, "capacity", parseInt(e.target.value) || 40)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={batchRows.length <= 1}
                        onClick={() => handleRemoveBatchRow(idx)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 bg-muted/30 border-t flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleAddBatchRow}
                  className="gap-1 text-xs text-primary hover:text-primary"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter une salle
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {batchRows.length} salle(s) prête(s)
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isBatchSubmitting}>
                {isBatchSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer les {batchRows.length} salles
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Single Room Form */
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
                Salle disponible
              </Label>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
