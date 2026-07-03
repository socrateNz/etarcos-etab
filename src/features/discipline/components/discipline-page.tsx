"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, Plus, FileSpreadsheet, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useDisciplineRecords,
  useCreateDisciplineRecord,
  useUpdateDisciplineRecord,
  useDeleteDisciplineRecord,
} from "../hooks/use-discipline";
import { getDisciplineColumns } from "./discipline-columns";
import { DisciplineFormDialog } from "./discipline-form-dialog";
import type { DisciplineRecordWithRelations } from "../types";
import type { CreateDisciplineRecordInput, UpdateDisciplineRecordInput } from "../schemas";

export function DisciplinePage() {
  const { can } = usePermissions();
  const canCreate = can("discipline", "create");
  const canEdit = can("discipline", "edit");
  const canDelete = can("discipline", "delete");

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DisciplineRecordWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DisciplineRecordWithRelations | null>(null);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      level: levelFilter === "all" ? undefined : (levelFilter as any),
      page: 1,
      per_page: 50,
      sort_by: "incident_date",
      sort_order: "desc" as const,
    }),
    [debouncedSearch, levelFilter]
  );

  const {
    data: recordsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useDisciplineRecords(filters);

  const createRecord = useCreateDisciplineRecord();
  const updateRecord = useUpdateDisciplineRecord();
  const deleteRecord = useDeleteDisciplineRecord();

  const recordsList = recordsData?.data ?? [];

  // Statistics summaries
  const totals = useMemo(() => {
    const counts = { total: recordsList.length, warning: 0, suspension: 0, exclusion: 0 };
    recordsList.forEach((r) => {
      if (r.level === "warning") counts.warning++;
      else if (r.level === "suspension") counts.suspension++;
      else if (r.level === "exclusion") counts.exclusion++;
    });
    return counts;
  }, [recordsList]);

  const columns = useMemo(
    () =>
      getDisciplineColumns({
        onEdit: (row) => {
          setEditingRecord(row);
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
      recordsList.map((r) => ({
        eleve: r.student?.user?.name || "",
        classe: r.student?.classroom?.name || "",
        sanction: r.level,
        date: r.incident_date,
        motif: r.reason,
        decision: r.decision || "",
        duree: r.duration_days ? `${r.duration_days} jours` : "",
      })),
      "discipline"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discipline & Vie Scolaire"
        description="Suivez le comportement des élèves, enregistrez les incidents et les sanctions associées."
        icon={ShieldAlert}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Incidents loggés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totals.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Avertissements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{totals.warning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Exclusions Temp.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{totals.suspension}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Exclusions Déf.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totals.exclusion}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1 max-w-md">
          <Input
            placeholder="Rechercher par motif…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={levelFilter}
            onValueChange={(v) => setLevelFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes sanctions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes sanctions</SelectItem>
              <SelectItem value="warning">Avertissement</SelectItem>
              <SelectItem value="reprimand">Blâme</SelectItem>
              <SelectItem value="suspension">Exclusion Temporaire</SelectItem>
              <SelectItem value="exclusion">Exclusion Définitive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Suivi Disciplinaire", filename: "discipline" })}
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
                setEditingRecord(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Plus className="size-4" />
              Saisir un incident
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
          data={recordsList}
          isLoading={isLoading}
          emptyMessage="Aucun incident comportemental signalé dans cet établissement."
          pagination
        />
      )}

      <DisciplineFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRecord(null);
        }}
        record={editingRecord}
        onSubmit={async (values) => {
          if (editingRecord) {
            await updateRecord.mutateAsync({ id: editingRecord.id, values: values as UpdateDisciplineRecordInput });
          } else {
            await createRecord.mutateAsync(values as CreateDisciplineRecordInput);
          }
          setFormOpen(false);
          setEditingRecord(null);
        }}
        isLoading={createRecord.isPending || updateRecord.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer ce rapport ?"
        description={`Le rapport disciplinaire de l'élève « ${deleteTarget?.student?.user?.name} » sera définitivement supprimé.`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteRecord.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteRecord.isPending}
      />
    </div>
  );
}
