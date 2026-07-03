"use client";

import { useMemo, useState } from "react";
import { Users, Plus, FileSpreadsheet, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useParents,
  useCreateParent,
  useUpdateParent,
  useDeleteParent,
} from "../hooks/use-parents";
import { getParentColumns } from "./parent-columns";
import { ParentFormDialog } from "./parent-form-dialog";
import type { ParentWithRelations } from "../types";
import type { CreateParentInput, UpdateParentInput } from "../schemas";

export function ParentsPage() {
  const { can } = usePermissions();
  const canCreate = can("parents", "create");
  const canEdit = can("parents", "edit");
  const canDelete = can("parents", "delete");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<ParentWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParentWithRelations | null>(null);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page: 1,
      per_page: 50,
      sort_by: "created_at",
      sort_order: "desc" as const,
    }),
    [debouncedSearch]
  );

  const {
    data: parentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useParents(filters);

  const createParent = useCreateParent();
  const updateParent = useUpdateParent();
  const deleteParent = useDeleteParent();

  const parentsList = parentsData?.data ?? [];

  const columns = useMemo(
    () =>
      getParentColumns({
        onEdit: (row) => {
          setEditingParent(row);
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
      parentsList.map((p) => ({
        nom: p.user?.name || "",
        email: p.user?.email || "",
        telephone: p.user?.phone || "",
        lien: p.relationship,
        profession: p.profession || "",
        urgence: p.is_emergency_contact ? "Oui" : "Non",
        enfants: (p.students ?? []).map((s) => s.user?.name).join(", "),
      })),
      "parents"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registre des Parents d'élèves"
        description="Gérez les fiches de contact des parents d'élèves et les liens familiaux."
        icon={Users}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1 max-w-xs">
          <Input
            placeholder="Rechercher par profession…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Registre des Parents", filename: "parents" })}
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
                setEditingParent(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-white"
            >
              <Plus className="size-4" />
              Nouveau parent
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
          data={parentsList}
          isLoading={isLoading}
          emptyMessage="Aucun parent d'élève configuré. Ajoutez le premier contact parent."
          pagination
        />
      )}

      <ParentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingParent(null);
        }}
        parent={editingParent}
        onSubmit={async (values) => {
          if (editingParent) {
            await updateParent.mutateAsync({ id: editingParent.id, values: values as UpdateParentInput });
          } else {
            await createParent.mutateAsync(values as CreateParentInput);
          }
          setFormOpen(false);
          setEditingParent(null);
        }}
        isLoading={createParent.isPending || updateParent.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer ce parent ?"
        description={`Le contact « ${deleteTarget?.user?.name} » sera définitivement supprimé (les comptes d'accès associés seront également révoqués).`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteParent.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteParent.isPending}
      />
    </div>
  );
}
