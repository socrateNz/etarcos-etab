"use client";

import { useMemo, useState } from "react";
import { Users, Plus, FileSpreadsheet, Printer, KeyRound, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { exportToCSV, exportToPDF } from "@/utils/export";
import { resetUserPasswordAction } from "@/features/users/actions";
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

  // Reset password states
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleResetPassword = async (row: StaffMemberWithUser) => {
    if (!row.user?.id) return;
    setResettingId(row.user.id);
    const res = await resetUserPasswordAction(row.user.id);
    if (res.success && res.data) {
      setResetResult(res.data);
      refetch();
    }
    setResettingId(null);
  };

  const handleCopyCredentials = () => {
    if (!resetResult) return;
    const text = `Identifiants pour ${resetResult.name} :\nEmail : ${resetResult.email}\nMot de passe temporaire : ${resetResult.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const columns = useMemo(
    () =>
      getStaffColumns({
        onEdit: (row) => {
          setEditingStaff(row);
          setFormOpen(true);
        },
        onDelete: setDeleteTarget,
        onResetPassword: handleResetPassword,
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
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold"
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

      {/* Reset Credentials Result Modal */}
      <Dialog open={!!resetResult} onOpenChange={(open) => !open && setResetResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-500" />
              Nouveau Mot de Passe Temporaire
            </DialogTitle>
            <DialogDescription className="text-xs">
              Un mot de passe temporaire a été généré pour {resetResult?.name}. Transmettez-le à l'employé.
            </DialogDescription>
          </DialogHeader>

          {resetResult && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground font-medium">Identifiant (Email) :</span>
                  <p className="font-bold text-foreground font-mono mt-0.5">{resetResult.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Mot de passe temporaire :</span>
                  <p className="font-bold text-primary font-mono text-sm mt-0.5">{resetResult.tempPassword}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px]">
                ℹ️ Cette option disparaîtra automatiquement dès que {resetResult.name} se sera connecté et aura modifié ce mot de passe.
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleCopyCredentials} variant="outline" className="flex-1 gap-2 text-xs">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copié dans le presse-papier !" : "Copier les identifiants"}
                </Button>
                <Button onClick={() => setResetResult(null)} size="sm">
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
