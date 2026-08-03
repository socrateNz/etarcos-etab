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
  createTrackSchema,
  updateTrackSchema,
  type CreateTrackInput,
  type UpdateTrackInput,
} from "../schemas";
import type { Track } from "../types";
import { createTracksBatchAction } from "../actions";
import { tracksKeys } from "../hooks/use-tracks";

interface TrackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: Track | null;
  onSubmit: (values: CreateTrackInput | UpdateTrackInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateTrackInput;

interface TrackBatchRow {
  name: string;
  code: string;
  description?: string;
}

const TRACK_PRESETS = [
  {
    label: "🎓 Général (S / L / SES)",
    items: [
      { name: "Scientifique", code: "S", description: "Sciences mathématiques, physiques et SVT" },
      { name: "Littéraire", code: "L", description: "Lettres, langues et sciences humaines" },
      { name: "Sciences Économiques & Sociales", code: "SES", description: "Économie et gestion sociale" },
    ],
  },
  {
    label: "⚙️ Technique & Industriel",
    items: [
      { name: "Génie Civil (Bâtiment)", code: "F4-GC", description: "Génie civil et construction" },
      { name: "Génie Électrique", code: "F3-GE", description: "Électrotechnique et électronique" },
      { name: "Génie Mécanique", code: "F1-GM", description: "Fabrication mécanique" },
    ],
  },
  {
    label: "💼 Tertiaire & Commerce",
    items: [
      { name: "Comptabilité & Gestion", code: "CG", description: "Comptabilité et finance des organisations" },
      { name: "Action Administrative", code: "ACA", description: "Bureautique et secrétariat de direction" },
      { name: "Commerce & Vente", code: "COMM", description: "Techniques commerciales et marketing" },
    ],
  },
];

export function TrackFormDialog({
  open,
  onOpenChange,
  track,
  onSubmit,
  isLoading = false,
}: TrackFormDialogProps) {
  const isEdit = !!track;
  const queryClient = useQueryClient();

  // Batch Mode States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchRows, setBatchRows] = useState<TrackBatchRow[]>([
    { name: "Scientifique", code: "S", description: "Série Scientifique" },
    { name: "Littéraire", code: "L", description: "Série Littéraire" },
  ]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

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
    if (open) {
      setIsBatchMode(false);
      if (track) {
        reset({
          name: track.name,
          code: track.code,
          description: track.description ?? "",
        });
      } else {
        reset({ name: "", code: "", description: "" });
        setBatchRows([
          { name: "Scientifique", code: "S", description: "Série Scientifique" },
          { name: "Littéraire", code: "L", description: "Série Littéraire" },
        ]);
      }
    }
  }, [open, track, reset]);

  const handleAddBatchRow = () => {
    setBatchRows([...batchRows, { name: "", code: "", description: "" }]);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const handleBatchRowChange = (index: number, field: keyof TrackBatchRow, val: string) => {
    const updated = [...batchRows];
    if (field === "name") {
      const nameVal = val;
      const codeVal = nameVal
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase();
      updated[index] = { ...updated[index], name: nameVal, code: codeVal || updated[index].code };
    } else {
      updated[index] = { ...updated[index], [field]: val };
    }
    setBatchRows(updated);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = batchRows.filter((r) => r.name.trim() !== "" && r.code.trim() !== "");
    if (validRows.length === 0) {
      toast.error("Veuillez remplir au moins une filière avec nom et code.");
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const res = await createTracksBatchAction(validRows);
      if (res.error) {
        toast.error("Erreur de création groupée", { description: res.error });
      } else {
        toast.success(`${res.data?.length ?? validRows.length} filières créées avec succès !`);
        queryClient.invalidateQueries({ queryKey: tracksKeys.all });
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
              <DialogTitle>{isEdit ? "Modifier la filière" : "Créer des filières"}</DialogTitle>
              <DialogDescription>
                {isBatchMode
                  ? "Créez rapidement plusieurs séries ou filières d'études pour votre établissement."
                  : "Ex. : Scientifique (S), Littéraire (L), Gestion, Informatique…"}
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
          /* Multi-track Batch Form */
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            {/* Presets Shortcuts */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-amber-500" /> Modèles de filières pré-configurées :
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {TRACK_PRESETS.map((p, idx) => (
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
                <div className="col-span-6">Nom de la filière *</div>
                <div className="col-span-5">Code unique *</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                {batchRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Input
                        placeholder="ex: Scientifique"
                        value={row.name}
                        onChange={(e) => handleBatchRowChange(idx, "name", e.target.value)}
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-5">
                      <Input
                        placeholder="ex: S"
                        value={row.code}
                        onChange={(e) => handleBatchRowChange(idx, "code", e.target.value.toUpperCase())}
                        className="h-8 text-xs font-mono uppercase"
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
                  <Plus className="w-3.5 h-3.5" /> Ajouter une filière
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {batchRows.length} filière(s) prête(s)
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isBatchSubmitting}>
                {isBatchSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer les {batchRows.length} filières
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Single Track Form */
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
        )}
      </DialogContent>
    </Dialog>
  );
}
