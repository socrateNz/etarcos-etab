"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Layers, Sparkles, AlertCircle } from "lucide-react";
import { autoCreateDefaultAcademicYearAction } from "@/app/actions/academic-years";
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
import { useLevels } from "@/features/cycles";
import { useTrackOptions } from "@/features/tracks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useTeachersOptions,
  useAcademicYearsOptions,
  classroomsKeys,
} from "../hooks/use-classrooms";
import {
  createClassroomSchema,
  updateClassroomSchema,
  type CreateClassroomInput,
  type UpdateClassroomInput,
} from "../schemas";
import type { ClassroomWithRelations } from "../types";
import { createClassroomsBatchAction } from "../actions";

interface ClassroomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroom?: ClassroomWithRelations | null;
  onSubmit: (values: CreateClassroomInput | UpdateClassroomInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateClassroomInput;

interface ClassroomBatchRow {
  name: string;
  code: string;
  capacity: number;
}

export function ClassroomFormDialog({
  open,
  onOpenChange,
  classroom,
  onSubmit,
  isLoading = false,
}: ClassroomFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!classroom;

  // Load options
  const { data: levelsData, isLoading: loadingLevels } = useLevels({ per_page: 100 });
  const { data: tracks = [], isLoading: loadingTracks } = useTrackOptions();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachersOptions();
  const { data: academicYears = [], isLoading: loadingYears } = useAcademicYearsOptions();

  const levels = levelsData?.data ?? [];

  // Batch Mode States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchLevelId, setBatchLevelId] = useState("");
  const [batchTrackId, setBatchTrackId] = useState<string>("all");
  const [batchYearId, setBatchYearId] = useState("");
  const [batchRows, setBatchRows] = useState<ClassroomBatchRow[]>([
    { name: "3ème A", code: "3A", capacity: 40 },
    { name: "3ème B", code: "3B", capacity: 40 },
  ]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateClassroomSchema : createClassroomSchema) as never,
    defaultValues: {
      name: "",
      code: "",
      level_id: "",
      track_id: null,
      capacity: 40,
      main_teacher_id: null,
      academic_year_id: "",
    },
  });

  useEffect(() => {
    if (open) {
      setIsBatchMode(false);
      const currentYear = academicYears.find((y) => y.is_current);
      const defaultYearId = currentYear?.id || academicYears[0]?.id || "";
      const defaultLevelId = levels[0]?.id || "";

      setBatchYearId(defaultYearId);
      setBatchLevelId(defaultLevelId);

      if (classroom) {
        reset({
          name: classroom.name,
          code: classroom.code,
          level_id: classroom.level_id,
          track_id: classroom.track_id ?? null,
          capacity: classroom.capacity,
          main_teacher_id: classroom.main_teacher_id ?? null,
          academic_year_id: classroom.academic_year_id,
        });
      } else {
        reset({
          name: "",
          code: "",
          level_id: defaultLevelId,
          track_id: null,
          capacity: 40,
          main_teacher_id: null,
          academic_year_id: defaultYearId,
        });

        // Pre-fill initial batch rows based on level name
        const selectedLevel = levels.find((l) => l.id === defaultLevelId);
        const levelName = selectedLevel?.name || "Classe";
        const levelCode = selectedLevel?.code || "C";
        setBatchRows([
          { name: `${levelName} A`, code: `${levelCode}A`, capacity: 40 },
          { name: `${levelName} B`, code: `${levelCode}B`, capacity: 40 },
        ]);
      }
    }
  }, [open, classroom, reset]);

  // Generate presets based on selected level
  const handleApplyPreset = (type: "ABC" | "123" | "ALLES") => {
    const selectedLevel = levels.find((l) => l.id === batchLevelId);
    const levelName = selectedLevel?.name || "Classe";
    const levelCode = selectedLevel?.code || "C";

    if (type === "ABC") {
      setBatchRows([
        { name: `${levelName} A`, code: `${levelCode}A`, capacity: 40 },
        { name: `${levelName} B`, code: `${levelCode}B`, capacity: 40 },
        { name: `${levelName} C`, code: `${levelCode}C`, capacity: 40 },
        { name: `${levelName} D`, code: `${levelCode}D`, capacity: 40 },
      ]);
    } else if (type === "123") {
      setBatchRows([
        { name: `${levelName} 1`, code: `${levelCode}1`, capacity: 40 },
        { name: `${levelName} 2`, code: `${levelCode}2`, capacity: 40 },
        { name: `${levelName} 3`, code: `${levelCode}3`, capacity: 40 },
      ]);
    } else if (type === "ALLES") {
      setBatchRows([
        { name: `${levelName} Allemand`, code: `${levelCode}ALL`, capacity: 40 },
        { name: `${levelName} Espagnol`, code: `${levelCode}ESP`, capacity: 40 },
      ]);
    }
  };

  const handleAddBatchRow = () => {
    const selectedLevel = levels.find((l) => l.id === batchLevelId);
    const levelName = selectedLevel?.name || "Classe";
    const levelCode = selectedLevel?.code || "C";
    const nextLetter = String.fromCharCode(65 + batchRows.length); // A, B, C...
    setBatchRows([
      ...batchRows,
      { name: `${levelName} ${nextLetter}`, code: `${levelCode}${nextLetter}`, capacity: 40 },
    ]);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const handleBatchRowChange = (index: number, field: keyof ClassroomBatchRow, val: string | number) => {
    const updated = [...batchRows];
    updated[index] = { ...updated[index], [field]: val };
    setBatchRows(updated);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchLevelId) {
      toast.error("Veuillez sélectionner un niveau.");
      return;
    }
    const validRows = batchRows.filter((r) => r.name.trim() !== "" && r.code.trim() !== "");
    if (validRows.length === 0) {
      toast.error("Veuillez remplir au moins une classe avec nom et code.");
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const res = await createClassroomsBatchAction(
        batchLevelId,
        batchYearId,
        batchTrackId === "all" ? null : batchTrackId,
        validRows
      );
      if (res.error) {
        toast.error("Erreur de création groupée", { description: res.error });
      } else {
        toast.success(`${res.data?.length ?? validRows.length} classes créées avec succès !`);
        queryClient.invalidateQueries({ queryKey: classroomsKeys.all });
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
              <DialogTitle>{isEdit ? "Modifier la classe" : "Créer des classes"}</DialogTitle>
              <DialogDescription>
                {isBatchMode
                  ? "Générez rapidement plusieurs divisions de classe pour un niveau."
                  : "Configurez le nom de la classe physique, son niveau académique et son professeur."}
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
          /* Multi-classroom Batch Form */
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-level">Niveau académique *</Label>
                <select
                  id="batch-level"
                  value={batchLevelId}
                  onChange={(e) => setBatchLevelId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                  disabled={loadingLevels}
                >
                  <option value="">Sélectionnez un niveau</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-track">Filière / Série</Label>
                <select
                  id="batch-track"
                  value={batchTrackId}
                  onChange={(e) => setBatchTrackId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={loadingTracks}
                >
                  <option value="all">Générale (Aucune)</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Presets Shortcuts */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-amber-500" /> Génération automatique de séries :
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleApplyPreset("ABC")}
                  className="text-xs bg-slate-50 dark:bg-slate-800 hover:bg-primary/10"
                >
                  🅰️ Divisions A, B, C, D
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleApplyPreset("123")}
                  className="text-xs bg-slate-50 dark:bg-slate-800 hover:bg-primary/10"
                >
                  🔢 Divisions 1, 2, 3
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleApplyPreset("ALLES")}
                  className="text-xs bg-slate-50 dark:bg-slate-800 hover:bg-primary/10"
                >
                  🇩🇪/🇪🇸 Allemand & Espagnol
                </Button>
              </div>
            </div>

            {/* Dynamic Rows Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="grid grid-cols-12 gap-2 p-2 bg-muted/60 text-xs font-semibold text-muted-foreground border-b">
                <div className="col-span-5">Nom de la classe *</div>
                <div className="col-span-4">Code unique *</div>
                <div className="col-span-2">Capacité</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                {batchRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        placeholder="ex: 3ème A"
                        value={row.name}
                        onChange={(e) => handleBatchRowChange(idx, "name", e.target.value)}
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        placeholder="ex: 3A"
                        value={row.code}
                        onChange={(e) => handleBatchRowChange(idx, "code", e.target.value.toUpperCase())}
                        className="h-8 text-xs font-mono uppercase"
                      />
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
                  <Plus className="w-3.5 h-3.5" /> Ajouter une classe
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {batchRows.length} classe(s) prête(s)
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isBatchSubmitting || levels.length === 0}>
                {isBatchSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer les {batchRows.length} classes
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Single Classroom Form */
          <form
            onSubmit={handleSubmit(async (values) => {
              const payload = { ...values };
              if (payload.track_id === "" || payload.track_id === "all") {
                payload.track_id = null;
              }
              if (payload.main_teacher_id === "" || payload.main_teacher_id === "none") {
                payload.main_teacher_id = null;
              }
              await onSubmit(payload);
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="classroom-name">Nom de la classe *</Label>
              <Input id="classroom-name" {...register("name")} placeholder="ex: 3ème A" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classroom-code">Code unique *</Label>
                <Input id="classroom-code" {...register("code")} placeholder="ex: 3A" className="uppercase" />
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classroom-capacity">Capacité max *</Label>
                <Input
                  id="classroom-capacity"
                  type="number"
                  min="1"
                  max="200"
                  {...register("capacity", { valueAsNumber: true })}
                />
                {errors.capacity && (
                  <p className="text-xs text-destructive">{errors.capacity.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classroom-level">Niveau *</Label>
                <select
                  id="classroom-level"
                  {...register("level_id")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={loadingLevels}
                >
                  <option value="">Sélectionnez un niveau</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
                {errors.level_id && (
                  <p className="text-xs text-destructive">{errors.level_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classroom-track">Filière</Label>
                <select
                  id="classroom-track"
                  {...register("track_id")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={loadingTracks}
                >
                  <option value="all">Générale (Aucune)</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {errors.track_id && (
                  <p className="text-xs text-destructive">{errors.track_id.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classroom-teacher">Professeur Principal</Label>
              <select
                id="classroom-teacher"
                {...register("main_teacher_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingTeachers}
              >
                <option value="none">Non assigné</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
              {errors.main_teacher_id && (
                <p className="text-xs text-destructive">{errors.main_teacher_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="classroom-year">Année Académique</Label>
              {academicYears.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-semibold">Aucune année académique active.</span>
                  </div>
                  <Button
                    type="button"
                    onClick={async () => {
                      const res = await autoCreateDefaultAcademicYearAction();
                      if (res.error) {
                        toast.error("Erreur", { description: res.error });
                      } else {
                        toast.success("Année 2025-2026 activée !");
                        if (res.data) {
                          setValue("academic_year_id", res.data.id);
                          setBatchYearId(res.data.id);
                        }
                      }
                    }}
                    size="xs"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold self-start gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Activer l'année 2025-2026 en 1 clic
                  </Button>
                </div>
              ) : (
                <select
                  id="classroom-year"
                  {...register("academic_year_id")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={loadingYears}
                >
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.is_current ? "(Courante)" : ""}
                    </option>
                  ))}
                </select>
              )}
              {errors.academic_year_id && (
                <p className="text-xs text-destructive">{errors.academic_year_id.message}</p>
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
