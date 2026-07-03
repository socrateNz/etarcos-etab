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
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
} from "../hooks/use-staff";
import { getStaffColumns } from "./staff-columns";
import { StaffFormDialog } from "./staff-form-dialog";
import type { StaffMemberWithUser } from "../types";
import type { CreateStaffInput, UpdateStaffInput } from "../schemas";

export function StaffPage() {
  const { can } = usePermissions();
  const canCreate = can("staff", "create");
  const canEdit = can("staff", "edit");
  const canDelete = can("staff", "delete");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMemberWithUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMemberWithUser | null>(null);

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
    data: staffData,
    isLoading,
    isError,
    error,
    refetch,
  } = useStaff(filters);

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const staffList = staffData?.data ?? [];

  const columns = useMemo(
    () =>
      getStaffColumns({
        onEdit: (row) => {
          setEditingStaff(row);
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
      staffList.map((s) => ({
        matricule: s.employee_number,
        nom: s.user?.name || "",
        email: s.user?.email || "",
        telephone: s.user?.phone || "",
        poste: s.position,
        departement: s.department || "",
        contrat: s.contract_type,
        recrutement: s.hire_date,
        statut: s.status,
      })),
      "personnel"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ressources Humaines & Personnel"
        description="Gérez les contrats, postes et informations des enseignants et du personnel administratif."
        icon={Users}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1 max-w-xs">
          <Input
            placeholder="Rechercher un membre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Personnel & RH", filename: "personnel" })}
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
                setEditingStaff(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-white"
            >
              <Plus className="size-4" />
              Recruter un personnel
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
          data={staffList}
          isLoading={isLoading}
          emptyMessage="Aucun membre du personnel configuré. Commencez par en recruter un."
          pagination
        />
      )}

      <StaffFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingStaff(null);
        }}
        staff={editingStaff}
        onSubmit={async (values) => {
          if (editingStaff) {
            await updateStaff.mutateAsync({ id: editingStaff.id, values: values as UpdateStaffInput });
          } else {
            await createStaff.mutateAsync(values as CreateStaffInput);
          }
          setFormOpen(false);
          setEditingStaff(null);
        }}
        isLoading={createStaff.isPending || updateStaff.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer cet employé ?"
        description={`« ${deleteTarget?.user?.name} » sera définitivement supprimé de la plateforme (son compte d'accès associé sera également supprimé).`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteStaff.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteStaff.isPending}
      />
    </div>
  );
}
