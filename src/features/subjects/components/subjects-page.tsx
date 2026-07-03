"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus, FileSpreadsheet, Printer } from "lucide-react";
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
import { useTrackOptions } from "@/features/tracks";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "../hooks/use-subjects";
import { getSubjectColumns } from "./subject-columns";
import { SubjectFormDialog } from "./subject-form-dialog";
import type { SubjectWithTrack } from "../types";
import type { CreateSubjectInput, UpdateSubjectInput } from "../schemas";

export function SubjectsPage() {
  const { can } = usePermissions();
  const canCreate = can("subjects", "create");
  const canEdit = can("subjects", "edit");
  const canDelete = can("subjects", "delete");

  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithTrack | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectWithTrack | null>(null);

  const { data: tracks = [] } = useTrackOptions();

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      track_id: trackFilter === "all" ? undefined : trackFilter,
      page: 1,
      per_page: 50,
      sort_by: "name",
      sort_order: "asc" as const,
    }),
    [debouncedSearch, trackFilter]
  );

  const {
    data: subjectsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSubjects(filters);

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const subjects = subjectsData?.data ?? [];

  const columns = useMemo(
    () =>
      getSubjectColumns({
        onEdit: (row) => {
          setEditingSubject(row);
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
      subjects.map((s) => ({
        nom: s.name,
        code: s.code,
        coefficient: s.coefficient,
        filiere: s.track?.name || "Toutes",
        description: s.description || "",
      })),
      "matieres"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matières d'enseignement"
        description="Gérez les disciplines enseignées, leurs coefficients et leurs filières associées."
        icon={BookOpen}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1 max-w-lg">
          <Input
            placeholder="Rechercher une matière…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={trackFilter}
            onValueChange={(v) => setTrackFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les filières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les filières</SelectItem>
              {tracks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Matières d'enseignement", filename: "matieres" })}
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
                setEditingSubject(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-white"
            >
              <Plus className="size-4" />
              Nouvelle matière
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
          data={subjects}
          isLoading={isLoading}
          emptyMessage="Aucune matière configurée. Commencez par créer une matière."
          pagination
        />
      )}

      <SubjectFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingSubject(null);
        }}
        subject={editingSubject}
        onSubmit={async (values) => {
          if (editingSubject) {
            await updateSubject.mutateAsync({ id: editingSubject.id, values: values as UpdateSubjectInput });
          } else {
            await createSubject.mutateAsync(values as CreateSubjectInput);
          }
          setFormOpen(false);
          setEditingSubject(null);
        }}
        isLoading={createSubject.isPending || updateSubject.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer cette matière ?"
        description={`La matière « ${deleteTarget?.name} » sera définitivement supprimée.`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteSubject.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteSubject.isPending}
      />
    </div>
  );
}
