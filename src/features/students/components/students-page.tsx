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
import { useClassrooms } from "@/features/classrooms";
import { useTrackOptions } from "@/features/tracks";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from "../hooks/use-students";
import { getStudentColumns } from "./student-columns";
import { StudentFormDialog } from "./student-form-dialog";
import type { StudentWithRelations } from "../types";
import type { CreateStudentInput, UpdateStudentInput } from "../schemas";

export function StudentsPage() {
  const { can } = usePermissions();
  const canCreate = can("students", "create");
  const canEdit = can("students", "edit");
  const canDelete = can("students", "delete");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [trackFilter, setTrackFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentWithRelations | null>(null);

  // Options filters
  const { data: classroomsData } = useClassrooms({ per_page: 100 });
  const { data: tracks = [] } = useTrackOptions();

  const classrooms = classroomsData?.data ?? [];

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      classroom_id: classFilter === "all" ? undefined : classFilter,
      track_id: trackFilter === "all" ? undefined : trackFilter,
      status: statusFilter === "all" ? undefined : (statusFilter as any),
      page: 1,
      per_page: 50,
      sort_by: "created_at",
      sort_order: "desc" as const,
    }),
    [debouncedSearch, classFilter, trackFilter, statusFilter]
  );

  const {
    data: studentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useStudents(filters);

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const studentsList = studentsData?.data ?? [];

  const columns = useMemo(
    () =>
      getStudentColumns({
        onEdit: (row) => {
          setEditingStudent(row);
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
      studentsList.map((s) => ({
        matricule: s.student_number,
        nom: s.user?.name || "",
        classe: s.classroom?.name || "Non affecté",
        filiere: s.track?.name || "Générale",
        inscription: s.enrollment_date,
        statut: s.status,
      })),
      "eleves"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers Scolaires & Élèves"
        description="Gérez les fiches des élèves, leurs affectations de classes et les bourses d'études."
        icon={GraduationCap}
      />

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1">
          <Input
            placeholder="Rechercher par matricule…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[200px]"
          />

          <Select
            value={classFilter}
            onValueChange={(v) => setClassFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
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
              {tracks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs (Inscrits)</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
              <SelectItem value="suspended">Suspendus</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 self-start xl:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Registre des Élèves", filename: "eleves" })}
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
                setEditingStudent(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold"
            >
              <Plus className="size-4" />
              Inscrire un élève
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
          data={studentsList}
          isLoading={isLoading}
          emptyMessage="Aucun élève inscrit. Inscrivez le premier élève de votre école."
          pagination
        />
      )}

      <StudentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingStudent(null);
        }}
        student={editingStudent}
        onSubmit={async (values) => {
          if (editingStudent) {
            await updateStudent.mutateAsync({ id: editingStudent.id, values: values as UpdateStudentInput });
          } else {
            await createStudent.mutateAsync(values as CreateStudentInput);
          }
          setFormOpen(false);
          setEditingStudent(null);
        }}
        isLoading={createStudent.isPending || updateStudent.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Désinscrire l'élève ?"
        description={`« ${deleteTarget?.user?.name} » sera définitivement désinscrit de la plateforme (sa fiche élève et son compte d'accès seront supprimés).`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteStudent.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteStudent.isPending}
      />
    </div>
  );
}
