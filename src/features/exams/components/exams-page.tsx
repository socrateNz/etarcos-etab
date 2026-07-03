"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Plus, FileSpreadsheet, Printer } from "lucide-react";
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
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useExams,
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
} from "../hooks/use-exams";
import { getExamColumns } from "./exam-columns";
import { ExamFormDialog } from "./exam-form-dialog";
import type { ExamWithRelations } from "../types";
import type { CreateExamInput, UpdateExamInput } from "../schemas";

export function ExamsPage() {
  const { can } = usePermissions();
  const canCreate = can("exams", "create");
  const canEdit = can("exams", "edit");
  const canDelete = can("exams", "delete");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamWithRelations | null>(null);

  // Classrooms options
  const { data: classroomsData } = useClassrooms({ per_page: 100 });
  const classrooms = classroomsData?.data ?? [];

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      classroom_id: classFilter === "all" ? undefined : classFilter,
      page: 1,
      per_page: 50,
      sort_by: "exam_date",
      sort_order: "asc" as const,
    }),
    [debouncedSearch, classFilter]
  );

  const {
    data: examsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useExams(filters);

  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  const examsList = examsData?.data ?? [];

  const columns = useMemo(
    () =>
      getExamColumns({
        onEdit: (row) => {
          setEditingExam(row);
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
      examsList.map((e) => ({
        nom: e.name,
        classe: e.classroom?.name || "Toutes",
        matiere: e.subject?.name || "",
        date: e.exam_date,
        debut: e.start_time || "",
        fin: e.end_time || "",
        salle: e.room?.name || "",
        note_max: e.max_score,
        coefficient: e.coefficient,
      })),
      "examens"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendrier des Examens & Devoirs"
        description="Planifiez les sessions d'évaluations et réservez les salles d'examen."
        icon={ClipboardList}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1 max-w-md">
          <Input
            placeholder="Rechercher par nom d'examen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
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
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Calendrier des Évaluations", filename: "examens" })}
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
                setEditingExam(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-white"
            >
              <Plus className="size-4" />
              Planifier un examen
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
          data={examsList}
          isLoading={isLoading}
          emptyMessage="Aucun examen ou devoir planifié. Commencez par en programmer un."
          pagination
        />
      )}

      <ExamFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingExam(null);
        }}
        exam={editingExam}
        onSubmit={async (values) => {
          if (editingExam) {
            await updateExam.mutateAsync({ id: editingExam.id, values: values as UpdateExamInput });
          } else {
            await createExam.mutateAsync(values as CreateExamInput);
          }
          setFormOpen(false);
          setEditingExam(null);
        }}
        isLoading={createExam.isPending || updateExam.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Annuler cette session d'évaluation ?"
        description={`« ${deleteTarget?.name} » sera supprimé du calendrier des évaluations.`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteExam.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteExam.isPending}
      />
    </div>
  );
}
