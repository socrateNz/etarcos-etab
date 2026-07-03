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
import { useSubjects } from "@/features/subjects";
import { useStaff } from "@/features/staff";
import { useRoomOptions } from "@/features/rooms";
import {
  createLessonSchema,
  updateLessonSchema,
  type CreateLessonInput,
  type UpdateLessonInput,
} from "../schemas";
import type { LessonWithRelations } from "../types";

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  lesson?: LessonWithRelations | null;
  onSubmit: (values: CreateLessonInput | UpdateLessonInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateLessonInput;

export function LessonFormDialog({
  open,
  onOpenChange,
  classroomId,
  lesson,
  onSubmit,
  isLoading = false,
}: LessonFormDialogProps) {
  const isEdit = !!lesson;

  // Load selection options
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects({ per_page: 100 });
  const { data: staffData, isLoading: loadingStaff } = useStaff({ per_page: 100 });
  const { data: rooms = [], isLoading: loadingRooms } = useRoomOptions();

  const subjects = subjectsData?.data ?? [];
  const teachers = (staffData?.data ?? []).filter((s) =>
    s.position?.toLowerCase().includes("enseign") || s.position?.toLowerCase().includes("prof")
  );

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
      if (lesson) {
        reset({
          classroom_id: classroomId,
          subject_id: lesson.subject_id,
          teacher_id: lesson.teacher_id,
          room_id: lesson.room_id ?? null,
          day_of_week: lesson.day_of_week,
          // Format start_time and end_time to HH:MM if they are in HH:MM:SS format
          start_time: lesson.start_time.substring(0, 5),
          end_time: lesson.end_time.substring(0, 5),
        });
      } else {
        reset({
          classroom_id: classroomId,
          subject_id: "",
          teacher_id: "",
          room_id: null,
          day_of_week: 1,
          start_time: "08:00",
          end_time: "10:00",
        });
      }
    }
  }, [open, lesson, classroomId, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le cours" : "Planifier un cours"}</DialogTitle>
          <DialogDescription>
            Saisissez l'horaire et associez une matière, un enseignant et optionnellement une salle spécifique.
          </DialogDescription>
        </DialogHeader>

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
              {teachers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.user?.name || "Sans nom"} ({t.position})
                </option>
              ))}
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
                <option value={1}>Lundi</option>
                <option value={2}>Mardi</option>
                <option value={3}>Mercredi</option>
                <option value={4}>Jeudi</option>
                <option value={5}>Vendredi</option>
                <option value={6}>Samedi</option>
                <option value={7}>Dimanche</option>
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
                <option value="none">Aucune salle</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Cap. {r.capacity})
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

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Planifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
