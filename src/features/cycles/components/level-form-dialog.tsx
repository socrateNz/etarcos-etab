"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import {
  createLevelSchema,
  updateLevelSchema,
  type CreateLevelInput,
  type UpdateLevelInput,
} from "../schemas";
import type { LevelWithCycle } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { cyclesKeys, useCycleOptions } from "../hooks/use-cycles";
import { createLevelsBatchAction } from "../actions";

interface LevelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level?: LevelWithCycle | null;
  defaultCycleId?: string;
  onSubmit: (values: CreateLevelInput | UpdateLevelInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateLevelInput;

interface BatchRow {
  name: string;
  code: string;
  order: number;
}

const PRESETS = [
  {
    label: "🎓 Collège (6e-3e)",
    items: [
      { name: "6ème", code: "6EME", order: 1 },
      { name: "5ème", code: "5EME", order: 2 },
      { name: "4ème", code: "4EME", order: 3 },
      { name: "3ème", code: "3EME", order: 4 },
    ],
  },
  {
    label: "🎓 Lycée (2nde-Tle)",
    items: [
      { name: "2nde", code: "2NDE", order: 1 },
      { name: "1ère", code: "1ERE", order: 2 },
      { name: "Terminales", code: "TLE", order: 3 },
    ],
  },
  {
    label: "🏫 Primaire (SIL-CM2)",
    items: [
      { name: "SIL", code: "SIL", order: 1 },
      { name: "CP", code: "CP", order: 2 },
      { name: "CE1", code: "CE1", order: 3 },
      { name: "CE2", code: "CE2", order: 4 },
      { name: "CM1", code: "CM1", order: 5 },
      { name: "CM2", code: "CM2", order: 6 },
    ],
  },
  {
    label: "👶 Maternelle",
    items: [
      { name: "Petite Section", code: "PS", order: 1 },
      { name: "Moyenne Section", code: "MS", order: 2 },
      { name: "Grande Section", code: "GS", order: 3 },
    ],
  },
];

export function LevelFormDialog({
  open,
  onOpenChange,
  level,
  defaultCycleId,
  onSubmit,
  isLoading = false,
}: LevelFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!level;
  const { data: cycleOptions = [] } = useCycleOptions();
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchCycleId, setBatchCycleId] = useState("");
  const [batchRows, setBatchRows] = useState<BatchRow[]>([
    { name: "6ème", code: "6EME", order: 1 },
    { name: "5ème", code: "5EME", order: 2 },
  ]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateLevelSchema : createLevelSchema) as never,
    defaultValues: {
      name: "",
      code: "",
      cycle_id: defaultCycleId ?? "",
      order: 1,
    },
  });

  useEffect(() => {
    if (open) {
      const initialCycle = defaultCycleId ?? cycleOptions[0]?.id ?? "";
      setBatchCycleId(initialCycle);
      setIsBatchMode(false);

      if (level) {
        reset({
          name: level.name,
          code: level.code,
          cycle_id: level.cycle_id,
          order: level.order,
        });
      } else {
        reset({
          name: "",
          code: "",
          cycle_id: initialCycle,
          order: 1,
        });
        setBatchRows([
          { name: "6ème", code: "6EME", order: 1 },
          { name: "5ème", code: "5EME", order: 2 },
        ]);
      }
    }
  }, [open, level, defaultCycleId, reset]);

  const comboboxOptions = cycleOptions.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.code})`,
  }));

  const handleAddBatchRow = () => {
    const nextOrder = batchRows.length + 1;
    setBatchRows([...batchRows, { name: "", code: "", order: nextOrder }]);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const handleBatchRowChange = (index: number, field: keyof BatchRow, val: string | number) => {
    const updated = [...batchRows];
    if (field === "name") {
      const nameVal = String(val);
      const codeVal = nameVal.toUpperCase().replace(/[^A-Z0-9]/g, "");
      updated[index] = { ...updated[index], name: nameVal, code: codeVal || updated[index].code };
    } else {
      updated[index] = { ...updated[index], [field]: val };
    }
    setBatchRows(updated);
  };

  const handleApplyPreset = (presetItems: BatchRow[]) => {
    setBatchRows(presetItems.map((item, idx) => ({ ...item, order: idx + 1 })));
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCycleId) {
      toast.error("Veuillez sélectionner un cycle.");
      return;
    }
    const validRows = batchRows.filter((r) => r.name.trim() !== "" && r.code.trim() !== "");
    if (validRows.length === 0) {
      toast.error("Veuillez remplir au moins un niveau avec nom et code.");
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const res = await createLevelsBatchAction(batchCycleId, validRows);
      if (res.error) {
        toast.error("Erreur de création groupée", { description: res.error });
      } else {
        toast.success(`${res.data?.length ?? validRows.length} niveaux créés avec succès !`);
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
              <DialogTitle>{isEdit ? "Modifier le niveau" : "Créer des niveaux"}</DialogTitle>
              <DialogDescription>
                {isBatchMode
                  ? "Ajoutez rapidement plusieurs niveaux scolaires en une seule fois."
                  : "Ex. : 6ème, 5ème, CP, CE1…"}
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
          /* Multi-level Batch Mode Form */
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cycle de destination *</Label>
              <Combobox
                options={comboboxOptions}
                value={batchCycleId}
                onValueChange={setBatchCycleId}
                placeholder="Sélectionner un cycle"
                emptyMessage="Aucun cycle disponible."
              />
            </div>

            {/* Presets Shortcuts */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-amber-500" /> Modèles prédéfinis rapides :
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleApplyPreset(p.items)}
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
                <div className="col-span-5">Nom du niveau *</div>
                <div className="col-span-4">Code *</div>
                <div className="col-span-2">Ordre</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                {batchRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        placeholder="ex: 6ème"
                        value={row.name}
                        onChange={(e) => handleBatchRowChange(idx, "name", e.target.value)}
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        placeholder="ex: 6EME"
                        value={row.code}
                        onChange={(e) => handleBatchRowChange(idx, "code", e.target.value.toUpperCase())}
                        className="h-8 text-xs font-mono uppercase"
                      />
                    </div>
                    <div className="col-span-2">
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
                  <Plus className="w-3.5 h-3.5" /> Ajouter un autre niveau
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {batchRows.length} niveau(x) prêt(s)
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isBatchSubmitting || comboboxOptions.length === 0}>
                {isBatchSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer les {batchRows.length} niveaux
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Single Level Form */
          <form
            onSubmit={handleSubmit(async (values) => onSubmit(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Cycle *</Label>
              <Controller
                name="cycle_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={comboboxOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Sélectionner un cycle"
                    emptyMessage="Aucun cycle. Créez-en un d'abord."
                  />
                )}
              />
              {errors.cycle_id && (
                <p className="text-xs text-destructive">{errors.cycle_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level-name">Nom *</Label>
              <Input id="level-name" {...register("name")} placeholder="6ème" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level-code">Code *</Label>
                <Input id="level-code" {...register("code")} placeholder="6EME" className="uppercase" />
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="level-order">Ordre</Label>
                <Input
                  id="level-order"
                  type="number"
                  min={1}
                  {...register("order", { valueAsNumber: true })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading || comboboxOptions.length === 0}>
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
