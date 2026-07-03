"use client";

import { useMemo, useState } from "react";
import {
  Building, Plus, FileSpreadsheet, Printer, Filter, X,
} from "lucide-react";
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
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useEstablishments,
  useEstablishment,
  useCreateEstablishment,
  useUpdateEstablishment,
  useDeleteEstablishment,
} from "../hooks/use-establishments";
import { getEstablishmentColumns } from "./establishment-columns";
import { EstablishmentFormDialog } from "./establishment-form-dialog";
import { EstablishmentDetailsDrawer } from "./establishment-details-drawer";
import {
  ESTABLISHMENT_PLAN_LABELS,
  ESTABLISHMENT_STATUS_LABELS,
  type EstablishmentListItem,
} from "../types";
import type {
  CreateEstablishmentInput,
  UpdateEstablishmentFormInput,
} from "../schemas";
import type { EstablishmentStatus, EstablishmentPlan } from "@/types/database";

export function EstablishmentsPage() {
  const { can, isSuperAdmin } = usePermissions();

  const canCreate = can("establishments", "create");
  const canEdit = can("establishments", "edit");
  const canDelete = can("establishments", "delete");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EstablishmentStatus | "all">("all");
  const [planFilter, setPlanFilter] = useState<EstablishmentPlan | "all">("all");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EstablishmentListItem | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EstablishmentListItem | null>(null);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      plan: planFilter === "all" ? undefined : planFilter,
      page: 1,
      per_page: 50,
      sort_by: "created_at",
      sort_order: "desc" as const,
    }),
    [debouncedSearch, statusFilter, planFilter]
  );

  const { data, isLoading, isError, error, refetch } = useEstablishments(filters);
  const { data: detailEstablishment, isLoading: detailLoading } =
    useEstablishment(detailsId);

  const createMutation = useCreateEstablishment();
  const updateMutation = useUpdateEstablishment();
  const deleteMutation = useDeleteEstablishment();

  const columns = useMemo(
    () =>
      getEstablishmentColumns({
        onView: (row) => setDetailsId(row.id),
        onEdit: (row) => {
          setEditing(row);
          setFormOpen(true);
        },
        onDelete: (row) => setDeleteTarget(row),
        canEdit,
        canDelete: canDelete && isSuperAdmin,
      }),
    [canEdit, canDelete, isSuperAdmin]
  );

  const rows = data?.data ?? [];

  const handleExportCsv = () => {
    exportToCSV(
      rows.map((e) => ({
        nom: e.name,
        slug: e.slug,
        ville: e.city ?? "",
        pays: e.country,
        formule: ESTABLISHMENT_PLAN_LABELS[e.plan],
        statut: ESTABLISHMENT_STATUS_LABELS[e.status],
        email: e.email ?? "",
        telephone: e.phone ?? "",
        cree_le: e.created_at,
      })),
      "etablissements"
    );
  };

  const handleExportPdf = () => {
    exportToPDF({
      title: "Liste des établissements",
      subtitle: `${rows.length} établissement(s) – Etarcos Etab`,
      filename: "etablissements",
    });
  };

  const handleFormSubmit = async (
    values: CreateEstablishmentInput | UpdateEstablishmentFormInput
  ) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, values });
    } else {
      await createMutation.mutateAsync(values as CreateEstablishmentInput);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const hasActiveFilters =
    statusFilter !== "all" || planFilter !== "all" || search.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <PageHeader
          title="Établissements"
          description={
            isSuperAdmin
              ? "Gérez tous les établissements de la plateforme SaaS."
              : "Gérez vos établissements scolaires."
          }
          icon={Building}
        />
        {canCreate && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="sm:self-end gap-2 bg-brand-500 hover:bg-brand-600 text-white"
          >
            <Plus className="size-4" />
            Nouvel établissement
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 no-print">
        <Input
          placeholder="Rechercher par nom, slug, ville, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lg:max-w-sm bg-background"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-muted-foreground hidden sm:block" />

          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as EstablishmentStatus | "all")
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {Object.entries(ESTABLISHMENT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={planFilter}
            onValueChange={(v) => setPlanFilter(v as EstablishmentPlan | "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Formule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes formules</SelectItem>
              {Object.entries(ESTABLISHMENT_PLAN_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPlanFilter("all");
              }}
              className="gap-1"
            >
              <X className="size-3.5" />
              Réinitialiser
            </Button>
          )}

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1.5">
              <Printer className="size-3.5" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
              <FileSpreadsheet className="size-3.5 text-emerald-500" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {data && (
        <p className="text-sm text-muted-foreground no-print">
          {data.total} établissement{data.total !== 1 ? "s" : ""} trouvé
          {data.total !== 1 ? "s" : ""}
        </p>
      )}

      {isError ? (
        <ErrorState
          title="Erreur de chargement"
          description={error?.message ?? "Impossible de charger les établissements."}
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          searchPlaceholder="Filtrer dans la page…"
          emptyMessage="Aucun établissement trouvé."
          pagination
          pageSizes={[10, 20, 50]}
        />
      )}

      <EstablishmentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        establishment={editing}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <EstablishmentDetailsDrawer
        open={!!detailsId}
        onOpenChange={(open) => !open && setDetailsId(null)}
        establishment={detailEstablishment}
        isLoading={detailLoading}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer l'établissement ?"
        description={`« ${deleteTarget?.name} » sera définitivement supprimé avec toutes ses données associées.`}
        confirmLabel="Supprimer"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
