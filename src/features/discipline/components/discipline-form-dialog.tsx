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
import { useStudents } from "@/features/students";
import {
  createDisciplineRecordSchema,
  updateDisciplineRecordSchema,
  type CreateDisciplineRecordInput,
  type UpdateDisciplineRecordInput,
} from "../schemas";
import type { DisciplineRecordWithRelations } from "../types";
import { Textarea } from "@/components/ui/textarea";

interface DisciplineFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: DisciplineRecordWithRelations | null;
  onSubmit: (values: CreateDisciplineRecordInput | UpdateDisciplineRecordInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateDisciplineRecordInput;

export function DisciplineFormDialog({
  open,
  onOpenChange,
  record,
  onSubmit,
  isLoading = false,
}: DisciplineFormDialogProps) {
  const isEdit = !!record;
  const { data: studentsData, isLoading: loadingStudents } = useStudents({ per_page: 200 });
  const students = studentsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateDisciplineRecordSchema : createDisciplineRecordSchema) as never,
    defaultValues: {
      student_id: "",
      level: "warning",
      reason: "",
      decision: "",
      incident_date: new Date().toISOString().split("T")[0],
      duration_days: null,
    },
  });

  const selectedLevel = watch("level");

  useEffect(() => {
    if (open) {
      if (record) {
        reset({
          student_id: record.student_id,
          level: record.level,
          reason: record.reason,
          decision: record.decision ?? "",
          incident_date: record.incident_date || "",
          duration_days: record.duration_days ?? null,
        });
      } else {
        reset({
          student_id: "",
          level: "warning",
          reason: "",
          decision: "",
          incident_date: new Date().toISOString().split("T")[0],
          duration_days: null,
        });
      }
    }
  }, [open, record, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le rapport disciplinaire" : "Enregistrer un incident"}</DialogTitle>
          <DialogDescription>
            Loggez le manquement comportemental de l'élève et la décision du conseil de discipline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="disc-student">Élève concerné *</Label>
            <select
              id="disc-student"
              {...register("student_id")}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={loadingStudents || isEdit}
            >
              <option value="">Sélectionner un élève...</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.user?.name} ({st.student_number}) — {st.classroom?.name || "Pas de classe"}
                </option>
              ))}
            </select>
            {errors.student_id && (
              <p className="text-xs text-destructive">{errors.student_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="disc-level">Type de sanction *</Label>
              <select
                id="disc-level"
                {...register("level")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="warning">Avertissement</option>
                <option value="reprimand">Blâme</option>
                <option value="suspension">Exclusion Temporaire</option>
                <option value="exclusion">Exclusion Définitive</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disc-date">Date de l'incident *</Label>
              <Input id="disc-date" type="date" {...register("incident_date")} />
              {errors.incident_date && (
                <p className="text-xs text-destructive">{errors.incident_date.message}</p>
              )}
            </div>
          </div>

          {selectedLevel === "suspension" && (
            <div className="space-y-2">
              <Label htmlFor="disc-duration">Durée de l'exclusion (jours) *</Label>
              <Input
                id="disc-duration"
                type="number"
                min="1"
                {...register("duration_days", { valueAsNumber: true })}
                placeholder="ex: 3"
              />
              {errors.duration_days && (
                <p className="text-xs text-destructive">{errors.duration_days.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="disc-reason">Motif / Description des faits *</Label>
            <Textarea
              id="disc-reason"
              {...register("reason")}
              placeholder="Saisissez en détail les manquements observés..."
              className="h-20"
            />
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="disc-decision">Sanction / Mesures prises</Label>
            <Textarea
              id="disc-decision"
              {...register("decision")}
              placeholder="ex: Heures de colle, convocation des parents..."
              className="h-20"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Confirmer la sanction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
