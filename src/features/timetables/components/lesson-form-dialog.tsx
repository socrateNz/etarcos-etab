"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Layers } from "lucide-react";
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
import { useSubjects } from "@/features/subjects";
import { useStaff } from "@/features/staff";
import { useRoomOptions } from "@/features/rooms";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createLessonSchema,
  updateLessonSchema,
  type CreateLessonInput,
  type UpdateLessonInput,
} from "../schemas";
import type { LessonWithRelations } from "../types";
import { createLessonsBatchAction } from "../actions";
import { timetablesKeys } from "../hooks/use-timetables";

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  lesson?: LessonWithRelations | null;
  onSubmit: (values: CreateLessonInput | UpdateLessonInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateLessonInput;

interface LessonBatchRow {
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_id: string | null;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

export function LessonFormDialog({
  open,
  onOpenChange,
  classroomId,
  lesson,
  onSubmit,
  isLoading = false,
}: LessonFormDialogProps) {
  const isEdit = !!lesson;
  const queryClient = useQueryClient();

  // Load selection options
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects({ per_page: 100 });
  const { data: staffData, isLoading: loadingStaff } = useStaff({ per_page: 100 });
  const { data: rooms = [], isLoading: loadingRooms } = useRoomOptions();

  const subjects = subjectsData?.data ?? [];
  const teachers = (staffData?.data ?? []).filter(
    (s) =>
      s.position?.toLowerCase().includes("enseign") ||
      s.position?.toLowerCase().includes("prof")
  );

  // Batch Mode States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchRows, setBatchRows] = useState<LessonBatchRow[]>([
    {
      subject_id: "",
      teacher_id: "",
      day_of_week: 1,
      start_time: "08:00",
      end_time: "10:00",
      room_id: null,
    },
  ]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateLessonSchema : createLessonSchema) as never,
    defaultValues: {
      classroom_id: classroomId,
      subject_id: "",
      teacher_id: "",
      room_id: null,
      day_of_week: 1,
      start_time: "08:00",
      end_time: "10:00",
    },
  });

  useEffect(() => {
    if (open) {
      setIsBatchMode(false);
      if (lesson) {
        reset({
          classroom_id: classroomId,
          subject_id: lesson.subject_id,
          teacher_id: lesson.teacher_id,
          room_id: lesson.room_id ?? null,
          day_of_week: lesson.day_of_week,
          start_time: lesson.start_time.substring(0, 5),
          end_time: lesson.end_time.substring(0, 5),
        });
      } else {
        const defaultSubj = subjects[0]?.id || "";
        const firstTeacher = teachers[0] || (staffData?.data ?? [])[0];
        const defaultTeacher = firstTeacher?.user_id || firstTeacher?.user?.id || firstTeacher?.id || "";
        reset({
          classroom_id: classroomId,
          subject_id: defaultSubj,
          teacher_id: defaultTeacher,
          room_id: null,
          day_of_week: 1,
          start_time: "08:00",
          end_time: "10:00",
        });
        setBatchRows([
          {
            subject_id: defaultSubj,
            teacher_id: defaultTeacher,
            day_of_week: 1,
            start_time: "08:00",
            end_time: "10:00",
            room_id: null,
          },
          {
            subject_id: subjects[1]?.id || defaultSubj,
            teacher_id: defaultTeacher,
            day_of_week: 1,
            start_time: "10:00",
            end_time: "12:00",
            room_id: null,
          },
        ]);
      }
    }
  }, [open, lesson, classroomId, reset]);

  const handleAddBatchRow = () => {
    const lastRow = batchRows[batchRows.length - 1];
    const firstTeacher = teachers[0] || (staffData?.data ?? [])[0];
    const defaultTeacher = firstTeacher?.user_id || firstTeacher?.user?.id || firstTeacher?.id || "";
    setBatchRows([
      ...batchRows,
      {
        subject_id: subjects[0]?.id || "",
        teacher_id: defaultTeacher,
        day_of_week: lastRow ? lastRow.day_of_week : 1,
        start_time: "14:00",
        end_time: "16:00",
        room_id: null,
      },
    ]);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const handleBatchRowChange = (index: number, field: keyof LessonBatchRow, val: string | number | null) => {
    const updated = [...batchRows];
    updated[index] = { ...updated[index], [field]: val };
    setBatchRows(updated);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = batchRows.filter((r) => r.subject_id !== "" && r.teacher_id !== "");
    if (validRows.length === 0) {
      toast.error("Veuillez sélectionner au moins une matière et un enseignant par cours.");
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const res = await createLessonsBatchAction(classroomId, validRows);
      if (res.error) {
        toast.error("Erreur de planification groupée", { description: res.error });
      } else {
        toast.success(`${res.data?.length ?? validRows.length} cours planifiés avec succès !`);
        queryClient.invalidateQueries({ queryKey: timetablesKeys.all });
        onOpenChange(false);
      }
    } catch {
      toast.error("Erreur inattendue lors de la planification.");
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  const teacherList = teachers.length > 0 ? teachers : (staffData?.data ?? []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isBatchMode && !isEdit ? "sm:max-w-3xl" : "sm:max-w-md"}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{isEdit ? "Modifier le cours" : "Planifier des cours"}</DialogTitle>
              <DialogDescription>
                {isBatchMode
                  ? "Planifiez rapidement plusieurs créneaux de l'emploi du temps pour cette classe."
                  : "Saisissez l'horaire et associez une matière, un enseignant et optionnellement une salle."}
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
          /* Multi-lesson Batch Form */
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            {/* Dynamic Rows Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="grid grid-cols-12 gap-2 p-2 bg-muted/60 text-xs font-semibold text-muted-foreground border-b">
                <div className="col-span-3">Matière *</div>
                <div className="col-span-3">Enseignant *</div>
                <div className="col-span-2">Jour</div>
                <div className="col-span-3">Horaires (Début - Fin)</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="max-h-72 overflow-y-auto p-2 space-y-2">
                {batchRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-3">
                      <select
                        value={row.subject_id}
                        onChange={(e) => handleBatchRowChange(idx, "subject_id", e.target.value)}
                        className="w-full h-8 rounded border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="">Matière...</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <select
                        value={row.teacher_id}
                        onChange={(e) => handleBatchRowChange(idx, "teacher_id", e.target.value)}
                        className="w-full h-8 rounded border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="">Enseignant...</option>
                        {teacherList.map((t) => {
                          const teacherUserId = t.user_id || t.user?.id || t.id;
                          return (
                            <option key={t.id} value={teacherUserId}>
                              {t.user?.name || t.user?.email || "Enseignant"}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <select
                        value={row.day_of_week}
                        onChange={(e) => handleBatchRowChange(idx, "day_of_week", parseInt(e.target.value) || 1)}
                        className="w-full h-8 rounded border border-input bg-background px-2 py-1 text-xs"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3 flex items-center gap-1">
                      <Input
                        type="time"
                        value={row.start_time}
                        onChange={(e) => handleBatchRowChange(idx, "start_time", e.target.value)}
                        className="h-8 text-xs p-1"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={row.end_time}
                        onChange={(e) => handleBatchRowChange(idx, "end_time", e.target.value)}
                        className="h-8 text-xs p-1"
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
                  <Plus className="w-3.5 h-3.5" /> Ajouter un autre cours
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {batchRows.length} cours prêt(s)
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isBatchSubmitting}>
                {isBatchSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Planifier les {batchRows.length} cours
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Single Lesson Form */
          <form
            onSubmit={handleSubmit(async (values) => {
              const payload = { ...values, classroom_id: classroomId };
              if (payload.room_id === "" || payload.room_id === "none") {
                payload.room_id = null;
              }
              await onSubmit(payload);
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="lesson-subj">Matière *</Label>
              <select
                id="lesson-subj"
                {...register("subject_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingSubjects}
              >
                <option value="">Sélectionner une matière...</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
              {errors.subject_id && (
                <p className="text-xs text-destructive">{errors.subject_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-teacher">Enseignant *</Label>
              <select
                id="lesson-teacher"
                {...register("teacher_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingStaff}
              >
                <option value="">Sélectionner un enseignant...</option>
                {teacherList.map((tch) => {
                  const teacherUserId = tch.user_id || tch.user?.id || tch.id;
                  return (
                    <option key={tch.id} value={teacherUserId}>
                      {tch.user?.name || tch.user?.email || "Enseignant"}
                    </option>
                  );
                })}
              </select>
              {errors.teacher_id && (
                <p className="text-xs text-destructive">{errors.teacher_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-day">Jour de la semaine</Label>
                <select
                  id="lesson-day"
                  {...register("day_of_week", { valueAsNumber: true })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-room">Salle (Optionnelle)</Label>
                <select
                  id="lesson-room"
                  {...register("room_id")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={loadingRooms}
                >
                  <option value="none">Aucune salle spécifique</option>
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-start">Heure de début *</Label>
                <Input id="lesson-start" type="time" {...register("start_time")} />
                {errors.start_time && (
                  <p className="text-xs text-destructive">{errors.start_time.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-end">Heure de fin *</Label>
                <Input id="lesson-end" type="time" {...register("end_time")} />
                {errors.end_time && (
                  <p className="text-xs text-destructive">{errors.end_time.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEdit ? "Enregistrer" : "Planifier"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
