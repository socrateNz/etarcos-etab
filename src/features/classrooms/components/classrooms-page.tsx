"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Plus, FileSpreadsheet, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { useLevels } from "@/features/cycles";
import { useTrackOptions } from "@/features/tracks";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useClassrooms,
  useCreateClassroom,
  useUpdateClassroom,
  useDeleteClassroom,
  useAcademicYearsOptions,
} from "../hooks/use-classrooms";
import { getClassroomColumns } from "./classroom-columns";
import { ClassroomFormDialog } from "./classroom-form-dialog";
import type { ClassroomWithRelations } from "../types";
import type { CreateClassroomInput, UpdateClassroomInput } from "../schemas";

export function ClassroomsPage() {
  const { can } = usePermissions();
  const canCreate = can("classes", "create");
  const canEdit = can("classes", "edit");
  const canDelete = can("classes", "delete");

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [trackFilter, setTrackFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("active");

  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<ClassroomWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassroomWithRelations | null>(null);

  // Load select options for filters
  const { data: levelsData } = useLevels({ per_page: 100 });
  const { data: tracks = [] } = useTrackOptions();
  const { data: academicYears = [] } = useAcademicYearsOptions();

  const levels = levelsData?.data ?? [];

  // Determine active year default filter
  const activeYearId = useMemo(() => {
    return academicYears.find((y) => y.is_current)?.id || "";
  }, [academicYears]);

  const selectedYearId = useMemo(() => {
    if (yearFilter === "active") return activeYearId || undefined;
    return yearFilter === "all" ? undefined : yearFilter;
  }, [yearFilter, activeYearId]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      level_id: levelFilter === "all" ? undefined : levelFilter,
      track_id: trackFilter === "all" ? undefined : trackFilter,
      academic_year_id: selectedYearId,
      page: 1,
      per_page: 50,
      sort_by: "name",
      sort_order: "asc" as const,
    }),
    [debouncedSearch, levelFilter, trackFilter, selectedYearId]
  );

  const {
    data: classroomsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useClassrooms(filters);

  const createClassroom = useCreateClassroom();
  const updateClassroom = useUpdateClassroom();
  const deleteClassroom = useDeleteClassroom();

  const classrooms = classroomsData?.data ?? [];

  const columns = useMemo(
    () =>
      getClassroomColumns({
        onEdit: (row) => {
          setEditingClassroom(row);
          setFormOpen(true);
        },
        onDelete: setDeleteTarget,
        canEdit,
        canDelete,
      }),
    [canEdit, canDelete]
  );

  const handleExport = () => {
    exportToCSV(
      classrooms.map((c) => ({
        nom: c.name,
        code: c.code,
        niveau: c.level?.name || "",
        filiere: c.track?.name || "Générale",
        effectif: c.student_count || 0,
        capacite: c.capacity,
        prof_principal: c.main_teacher?.name || "Non assigné",
      })),
      "classes"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes & Salles"
        description="Gérez les classes physiques de votre établissement, leurs filières et enseignants titulaires."
        icon={GraduationCap}
      />

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1">
          <Input
            placeholder="Rechercher une classe…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[200px]"
          />

          <Select
            value={levelFilter}
            onValueChange={(v) => setLevelFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les niveaux" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              {levels.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={trackFilter}
            onValueChange={(v) => setTrackFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes les filières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les filières</SelectItem>
              <SelectItem value="none">Générale</SelectItem>
              {tracks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={yearFilter}
            onValueChange={(v) => setYearFilter(v ?? "active")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Année académique" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Année Courante</SelectItem>
              <SelectItem value="all">Toutes les années</SelectItem>
              {academicYears.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 self-start xl:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Classes & Salles", filename: "classes" })}
            className="gap-1.5"
          >
            <Printer className="size-3.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <FileSpreadsheet className="size-3.5 text-emerald-500" /> Excel
          </Button>
          {canCreate && (
            <Button
              onClick={() => {
                setEditingClassroom(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold"
            >
              <Plus className="size-4" />
              Créer une classe
            </Button>
          )}
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Erreur"
          description={error?.message}
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={classrooms}
          isLoading={isLoading}
          emptyMessage="Aucune classe configurée. Commencez par créer une classe."
          pagination
        />
      )}

      <ClassroomFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingClassroom(null);
        }}
        classroom={editingClassroom}
        onSubmit={async (values) => {
          if (editingClassroom) {
            await updateClassroom.mutateAsync({ id: editingClassroom.id, values: values as UpdateClassroomInput });
          } else {
            await createClassroom.mutateAsync(values as CreateClassroomInput);
          }
          await refetch();
          setFormOpen(false);
          setEditingClassroom(null);
        }}
        isLoading={createClassroom.isPending || updateClassroom.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer cette classe ?"
        description={`La classe « ${deleteTarget?.name} » sera supprimée. Cette action est impossible si des élèves y sont déjà inscrits.`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteClassroom.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteClassroom.isPending}
      />
    </div>
  );
}
