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
import { toast } from "sonner";
import {
  createCycleSchema,
  updateCycleSchema,
  type CreateCycleInput,
  type UpdateCycleInput,
} from "../schemas";
import type { CycleWithLevelsCount } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { cyclesKeys } from "../hooks/use-cycles";
import { createCyclesBatchAction } from "../actions";

interface CycleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle?: CycleWithLevelsCount | null;
  onSubmit: (values: CreateCycleInput | UpdateCycleInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateCycleInput;

interface CycleBatchRow {
  name: string;
  code: string;
  order: number;
  description?: string;
}

const CYCLE_PRESETS = [
  {
    label: "🏫 Général (Maternelle - Second Cycle)",
    items: [
      { name: "Maternelle", code: "MAT", order: 1, description: "Cycle d'éveil et de pré-scolarisation" },
      { name: "Primaire", code: "PRIM", order: 2, description: "Cycle de l'enseignement de base" },
      { name: "Premier Cycle", code: "PC", order: 3, description: "Collège (de la 6ème à la 3ème)" },
      { name: "Second Cycle", code: "SC", order: 4, description: "Lycée (de la 2nde à la Terminale)" },
    ],
  },
  {
    label: "🛠️ Technique & Professionnel",
    items: [
      { name: "1er Cycle Technique", code: "PCT", order: 1, description: "Brevet d'Études Premier Cycle Technique" },
      { name: "2nd Cycle Technique", code: "SCT", order: 2, description: "Baccalauréat Technique & Professionnel" },
    ],
  },
];

export function CycleFormDialog({
  open,
  onOpenChange,
  cycle,
  onSubmit,
  isLoading = false,
}: CycleFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!cycle;
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchRows, setBatchRows] = useState<CycleBatchRow[]>([
    { name: "Premier Cycle", code: "PC", order: 1, description: "Collège" },
    { name: "Second Cycle", code: "SC", order: 2, description: "Lycée" },
  ]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateCycleSchema : createCycleSchema) as never,
    defaultValues: {
      name: "",
      code: "",
      description: "",
      order: 1,
    },
  });

  useEffect(() => {
    if (open) {
      setIsBatchMode(false);
      if (cycle) {
        reset({
          name: cycle.name,
          code: cycle.code,
          description: cycle.description ?? "",
          order: cycle.order,
        });
      } else {
        reset({ name: "", code: "", description: "", order: 1 });
        setBatchRows([
          { name: "Premier Cycle", code: "PC", order: 1, description: "Collège" },
          { name: "Second Cycle", code: "SC", order: 2, description: "Lycée" },
        ]);
      }
    }
  }, [open, cycle, reset]);

  const handleAddBatchRow = () => {
    const nextOrder = batchRows.length + 1;
    setBatchRows([...batchRows, { name: "", code: "", order: nextOrder, description: "" }]);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const handleBatchRowChange = (index: number, field: keyof CycleBatchRow, val: string | number) => {
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
      toast.error("Veuillez remplir au moins un cycle avec nom et code.");
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const res = await createCyclesBatchAction(validRows);
      if (res.error) {
        toast.error("Erreur de création groupée", { description: res.error });
      } else {
        toast.success(`${res.data?.length ?? validRows.length} cycles créés avec succès !`);
        queryClient.invalidateQueries({ queryKey: cyclesKeys.all });
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
              <DialogTitle>{isEdit ? "Modifier le cycle" : "Créer des cycles"}</DialogTitle>
              <DialogDescription>
                {isBatchMode
                  ? "Créez rapidement l'ensemble des cycles d'études de votre établissement."
                  : "Ex. : Premier Cycle, Second Cycle, Maternelle…"}
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
          /* Multi-cycle Batch Form */
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            {/* Presets Shortcuts */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-amber-500" /> Modèles prédéfinis d'enseignements :
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {CYCLE_PRESETS.map((p, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setBatchRows(p.items.map((it, i) => ({ ...it, order: i + 1 })))}
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
                <div className="col-span-5">Nom du cycle *</div>
                <div className="col-span-3">Code *</div>
                <div className="col-span-3">Ordre</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                {batchRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        placeholder="ex: Premier Cycle"
                        value={row.name}
                        onChange={(e) => handleBatchRowChange(idx, "name", e.target.value)}
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="ex: PC"
                        value={row.code}
                        onChange={(e) => handleBatchRowChange(idx, "code", e.target.value.toUpperCase())}
                        className="h-8 text-xs font-mono uppercase"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min={1}
                        value={row.order}
                        onChange={(e) => handleBatchRowChange(idx, "order", parseInt(e.target.value) || 1)}
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
                  <Plus className="w-3.5 h-3.5" /> Ajouter un autre cycle
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {batchRows.length} cycle(s) prêt(s)
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isBatchSubmitting}>
                {isBatchSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer les {batchRows.length} cycles
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Single Cycle Form */
          <form
            onSubmit={handleSubmit(async (values) => onSubmit(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="cycle-name">Nom *</Label>
              <Input id="cycle-name" {...register("name")} placeholder="Premier Cycle" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cycle-code">Code *</Label>
                <Input id="cycle-code" {...register("code")} placeholder="PC" className="uppercase" />
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle-order">Ordre</Label>
                <Input
                  id="cycle-order"
                  type="number"
                  min={1}
                  {...register("order", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycle-desc">Description</Label>
              <Input id="cycle-desc" {...register("description")} />
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
