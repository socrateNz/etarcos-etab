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
import { useLevels } from "@/features/cycles";
import { useTrackOptions } from "@/features/tracks";
import {
  useTeachersOptions,
  useAcademicYearsOptions,
} from "../hooks/use-classrooms";
import {
  createClassroomSchema,
  updateClassroomSchema,
  type CreateClassroomInput,
  type UpdateClassroomInput,
} from "../schemas";
import type { ClassroomWithRelations } from "../types";

interface ClassroomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroom?: ClassroomWithRelations | null;
  onSubmit: (values: CreateClassroomInput | UpdateClassroomInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateClassroomInput;

export function ClassroomFormDialog({
  open,
  onOpenChange,
  classroom,
  onSubmit,
  isLoading = false,
}: ClassroomFormDialogProps) {
  const isEdit = !!classroom;

  // Load options
  const { data: levelsData, isLoading: loadingLevels } = useLevels({ per_page: 100 });
  const { data: tracks = [], isLoading: loadingTracks } = useTrackOptions();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachersOptions();
  const { data: academicYears = [], isLoading: loadingYears } = useAcademicYearsOptions();

  const levels = levelsData?.data ?? [];

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
        // Find current active academic year to set as default
        const currentYear = academicYears.find((y) => y.is_current);
        reset({
          name: "",
          code: "",
          level_id: levels[0]?.id || "",
          track_id: null,
          capacity: 40,
          main_teacher_id: null,
          academic_year_id: currentYear?.id || academicYears[0]?.id || "",
        });
      }
    }
  }, [open, classroom, reset, academicYears, levels]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la classe" : "Créer une classe"}</DialogTitle>
          <DialogDescription>
            Configurez le nom de la classe physique, son niveau académique et son professeur principal.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
