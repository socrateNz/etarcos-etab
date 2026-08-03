"use client";

import { useMemo, useState } from "react";
import { Calendar, Plus, Printer, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/hooks/use-permissions";
import { useClassrooms } from "@/features/classrooms";
import {
  useLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from "../hooks/use-timetables";
import { WeeklyCalendar } from "./weekly-calendar";
import { LessonFormDialog } from "./lesson-form-dialog";
import type { LessonWithRelations } from "../types";
import type { CreateLessonInput, UpdateLessonInput } from "../schemas";

export function TimetablesPage() {
  const { can } = usePermissions();
  const canCreate = can("timetables", "create");
  const canEdit = can("timetables", "edit");
  const canDelete = can("timetables", "delete");

  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LessonWithRelations | null>(null);

  // Load classrooms options
  const { data: classroomsData, isLoading: loadingClasses } = useClassrooms({ per_page: 100 });
  const classrooms = classroomsData?.data ?? [];

  // Filter lessons by classroom
  const filters = useMemo(
    () => ({
      classroom_id: selectedClassId === "all" ? undefined : selectedClassId,
    }),
    [selectedClassId]
  );

  const {
    data: lessons = [],
    isLoading: loadingLessons,
    isError,
    error,
    refetch,
  } = useLessons(filters);

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const handlePrint = () => {
    window.print();
  };

  const selectedClassName = classrooms.find((c) => c.id === selectedClassId)?.name || "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emplois du temps & Cours"
        description="Planifiez et gérez la répartition hebdomadaire des matières, des enseignants et des salles."
        icon={Calendar}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print border-b pb-4">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Select
            value={selectedClassId}
            onValueChange={(v) => setSelectedClassId(v || "all")}
            disabled={loadingClasses}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une classe..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Choisir une classe...</SelectItem>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selectedClassId !== "all" && (
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="size-3.5" /> Imprimer
            </Button>
          )}
          {canCreate && selectedClassId !== "all" && (
            <Button
              onClick={() => {
                setEditingLesson(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold"
            >
              <Plus className="size-4" />
              Planifier un cours
            </Button>
          )}
        </div>
      </div>

      {selectedClassId === "all" ? (
        <div className="flex flex-col items-center justify-center py-16 border rounded-xl bg-card border-dashed">
          <BookOpen className="size-10 text-muted-foreground stroke-1 mb-3" />
          <p className="font-semibold text-sm text-foreground">Aucune classe sélectionnée</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center">
            Veuillez sélectionner une classe dans le menu déroulant ci-dessus pour visualiser son emploi du temps hebdomadaire.
          </p>
        </div>
      ) : isError ? (
        <ErrorState
          title="Erreur"
          description={error?.message}
          onRetry={() => refetch()}
        />
      ) : loadingLessons ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-muted rounded-xl border" />
          ))}
        </div>
      ) : (
        <div className="print:p-0 print:shadow-none">
          <div className="hidden print:block mb-4 text-center">
            <h1 className="text-xl font-bold uppercase">Emploi du temps hebdomadaire</h1>
            <p className="text-md text-brand-500 font-semibold mt-1">Classe : {selectedClassName}</p>
          </div>
          <WeeklyCalendar
            lessons={lessons}
            onEdit={(l) => {
              setEditingLesson(l);
              setFormOpen(true);
            }}
            onDelete={setDeleteTarget}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      )}

      {selectedClassId !== "all" && (
        <LessonFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingLesson(null);
          }}
          classroomId={selectedClassId}
          lesson={editingLesson}
          onSubmit={async (values) => {
            if (editingLesson) {
              await updateLesson.mutateAsync({ id: editingLesson.id, values: values as UpdateLessonInput });
            } else {
              await createLesson.mutateAsync(values as CreateLessonInput);
            }
            setFormOpen(false);
            setEditingLesson(null);
          }}
          isLoading={createLesson.isPending || updateLesson.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Retirer ce cours ?"
        description={`Le cours de « ${deleteTarget?.subject?.name} » dispensé par « ${deleteTarget?.teacher?.name} » sera supprimé de l'emploi du temps.`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteLesson.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteLesson.isPending}
      />
    </div>
  );
}
