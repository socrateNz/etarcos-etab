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
import { useClassrooms } from "@/features/classrooms";
import { useSubjects } from "@/features/subjects";
import { useRoomOptions } from "@/features/rooms";
import {
  createExamSchema,
  updateExamSchema,
  type CreateExamInput,
  type UpdateExamInput,
} from "../schemas";
import type { ExamWithRelations } from "../types";

interface ExamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: ExamWithRelations | null;
  onSubmit: (values: CreateExamInput | UpdateExamInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateExamInput;

export function ExamFormDialog({
  open,
  onOpenChange,
  exam,
  onSubmit,
  isLoading = false,
}: ExamFormDialogProps) {
  const isEdit = !!exam;

  const { data: classroomsData, isLoading: loadingClasses } = useClassrooms({ per_page: 100 });
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects({ per_page: 100 });
  const { data: rooms = [], isLoading: loadingRooms } = useRoomOptions();

  const classrooms = classroomsData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateExamSchema : createExamSchema) as never,
    defaultValues: {
      name: "",
      classroom_id: null,
      subject_id: "",
      exam_date: new Date().toISOString().split("T")[0],
      start_time: "08:00",
      end_time: "10:00",
      room_id: null,
      max_score: 20.00,
      coefficient: 1.00,
    },
  });

  useEffect(() => {
    if (open) {
      if (exam) {
        reset({
          name: exam.name,
          classroom_id: exam.classroom_id ?? null,
          subject_id: exam.subject_id,
          exam_date: exam.exam_date || "",
          start_time: exam.start_time ? exam.start_time.substring(0, 5) : "",
          end_time: exam.end_time ? exam.end_time.substring(0, 5) : "",
          room_id: exam.room_id ?? null,
          max_score: Number(exam.max_score),
          coefficient: Number(exam.coefficient),
        });
      } else {
        reset({
          name: "",
          classroom_id: null,
          subject_id: "",
          exam_date: new Date().toISOString().split("T")[0],
          start_time: "08:00",
          end_time: "10:00",
          room_id: null,
          max_score: 20.00,
          coefficient: 1.00,
        });
      }
    }
  }, [open, exam, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la session d'examen" : "Planifier une évaluation"}</DialogTitle>
          <DialogDescription>
            Configurez les paramètres de planification de la session d'évaluation.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => {
            const payload = { ...values };
            if (payload.classroom_id === "" || payload.classroom_id === "none") {
              payload.classroom_id = null;
            }
            if (payload.room_id === "" || payload.room_id === "none") {
              payload.room_id = null;
            }
            await onSubmit(payload);
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="exam-name">Nom de l'évaluation *</Label>
            <Input id="exam-name" {...register("name")} placeholder="ex: Devoir Commun 1 Mathématiques" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam-class">Classe (Optionnelle)</Label>
              <select
                id="exam-class"
                {...register("classroom_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingClasses}
              >
                <option value="none">Toutes les classes</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-subject">Matière *</Label>
              <select
                id="exam-subject"
                {...register("subject_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingSubjects}
              >
                <option value="">Sélectionner une matière...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              {errors.subject_id && (
                <p className="text-xs text-destructive">{errors.subject_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="exam-date">Date de l'examen *</Label>
              <Input id="exam-date" type="date" {...register("exam_date")} />
              {errors.exam_date && (
                <p className="text-xs text-destructive">{errors.exam_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-room">Salle</Label>
              <select
                id="exam-room"
                {...register("room_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingRooms}
              >
                <option value="none">Non définie</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam-start">Heure de début</Label>
              <Input id="exam-start" type="time" {...register("start_time")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-end">Heure de fin</Label>
              <Input id="exam-end" type="time" {...register("end_time")} />
              {errors.end_time && (
                <p className="text-xs text-destructive">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam-max">Note maximale</Label>
              <Input
                id="exam-max"
                type="number"
                step="0.25"
                {...register("max_score", { valueAsNumber: true })}
              />
              {errors.max_score && (
                <p className="text-xs text-destructive">{errors.max_score.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-coef">Coefficient</Label>
              <Input
                id="exam-coef"
                type="number"
                step="0.25"
                {...register("coefficient", { valueAsNumber: true })}
              />
              {errors.coefficient && (
                <p className="text-xs text-destructive">{errors.coefficient.message}</p>
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
