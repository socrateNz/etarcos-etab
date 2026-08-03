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
import { useTrackOptions } from "@/features/tracks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createSubjectSchema,
  updateSubjectSchema,
  type CreateSubjectInput,
  type UpdateSubjectInput,
} from "../schemas";
import type { SubjectWithTrack } from "../types";
import { createSubjectsBatchAction } from "../actions";
import { subjectsKeys } from "../hooks/use-subjects";

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: SubjectWithTrack | null;
  onSubmit: (values: CreateSubjectInput | UpdateSubjectInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateSubjectInput;

interface SubjectBatchRow {
  name: string;
  code: string;
  coefficient: number;
}

const SUBJECT_PRESETS = [
  {
    label: "📐 Scientifique",
    items: [
      { name: "Mathématiques", code: "MATH", coefficient: 4 },
      { name: "Physique-Chimie", code: "PHYS", coefficient: 3 },
      { name: "SVT", code: "SVT", coefficient: 2 },
      { name: "Informatique", code: "INFO", coefficient: 2 },
    ],
  },
  {
    label: "📚 Littéraire",
    items: [
      { name: "Français", code: "FRAN", coefficient: 4 },
      { name: "Anglais", code: "ANG", coefficient: 3 },
      { name: "Histoire-Géographie", code: "HG", coefficient: 3 },
      { name: "Philosophie", code: "PHIL", coefficient: 3 },
    ],
  },
  {
    label: "🎨 Éveil & Secondaires",
    items: [
      { name: "Éducation Physique & Sportive", code: "EPS", coefficient: 2 },
      { name: "Arts Plastiques", code: "ART", coefficient: 1 },
      { name: "Musique", code: "MUS", coefficient: 1 },
      { name: "Éducation à la Citoyenneté", code: "ECM", coefficient: 1 },
    ],
  },
];

export function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
  onSubmit,
  isLoading = false,
}: SubjectFormDialogProps) {
  const isEdit = !!subject;
  const queryClient = useQueryClient();
  const { data: tracks = [], isLoading: loadingTracks } = useTrackOptions();

  // Batch Mode States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchTrackId, setBatchTrackId] = useState<string>("all");
  const [batchRows, setBatchRows] = useState<SubjectBatchRow[]>([
    { name: "Mathématiques", code: "MATH", coefficient: 4 },
    { name: "Physique-Chimie", code: "PHYS", coefficient: 3 },
    { name: "Français", code: "FRAN", coefficient: 3 },
  ]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

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
    if (open) {
      setIsBatchMode(false);
      if (subject) {
        reset({
          name: subject.name,
          code: subject.code,
          coefficient: subject.coefficient,
          color: subject.color ?? "#6366f1",
          description: subject.description ?? "",
          track_id: subject.track_id ?? null,
        });
      } else {
        reset({
          name: "",
          code: "",
          coefficient: 1.0,
          color: "#6366f1",
          description: "",
          track_id: null,
        });
        setBatchRows([
          { name: "Mathématiques", code: "MATH", coefficient: 4 },
          { name: "Physique-Chimie", code: "PHYS", coefficient: 3 },
          { name: "Français", code: "FRAN", coefficient: 3 },
        ]);
      }
    }
  }, [open, subject, reset]);

  const handleAddBatchRow = () => {
    setBatchRows([...batchRows, { name: "", code: "", coefficient: 1 }]);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const handleBatchRowChange = (index: number, field: keyof SubjectBatchRow, val: string | number) => {
    const updated = [...batchRows];
    if (field === "name") {
      const nameVal = String(val);
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
      toast.error("Veuillez remplir au moins une matière avec nom et code.");
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const res = await createSubjectsBatchAction(
        batchTrackId === "all" ? null : batchTrackId,
        validRows
      );
      if (res.error) {
        toast.error("Erreur de création groupée", { description: res.error });
      } else {
        toast.success(`${res.data?.length ?? validRows.length} matières créées avec succès !`);
        queryClient.invalidateQueries({ queryKey: subjectsKeys.all });
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
              <DialogTitle>{isEdit ? "Modifier la matière" : "Créer des matières"}</DialogTitle>
              <DialogDescription>
                {isBatchMode
                  ? "Configurez rapidement la liste des matières enseignées dans votre établissement."
                  : "Configurez le nom, coefficient, et associez la matière à une filière."}
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
          /* Multi-subject Batch Form */
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-track">Filière / Série associée (Optionnel)</Label>
              <select
                id="batch-track"
                value={batchTrackId}
                onChange={(e) => setBatchTrackId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingTracks}
              >
                <option value="all">Toutes les filières (Matières générales)</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Presets Shortcuts */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-amber-500" /> Modèles de programmes disciplinaires :
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_PRESETS.map((p, idx) => (
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
                <div className="col-span-6">Nom de la matière *</div>
                <div className="col-span-3">Code *</div>
                <div className="col-span-2">Coefficient</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                {batchRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Input
                        placeholder="ex: Mathématiques"
                        value={row.name}
                        onChange={(e) => handleBatchRowChange(idx, "name", e.target.value)}
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="ex: MATH"
                        value={row.code}
                        onChange={(e) => handleBatchRowChange(idx, "code", e.target.value.toUpperCase())}
                        className="h-8 text-xs font-mono uppercase"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="20"
                        value={row.coefficient}
                        onChange={(e) => handleBatchRowChange(idx, "coefficient", parseFloat(e.target.value) || 1)}
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
                  <Plus className="w-3.5 h-3.5" /> Ajouter une matière
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {batchRows.length} matière(s) prête(s)
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isBatchSubmitting}>
                {isBatchSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer les {batchRows.length} matières
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Single Subject Form */
          <form
            onSubmit={handleSubmit(async (values) => {
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
        )}
      </DialogContent>
    </Dialog>
  );
}
