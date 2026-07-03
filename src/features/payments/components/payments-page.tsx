"use client";

import { useMemo, useState } from "react";
import { DollarSign, Search, Plus, FileSpreadsheet, Printer, Eye, Trash2, Tag, CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useFeeCategories,
  useCreateFeeCategory,
  useDeleteFeeCategory,
  usePayments,
  useCreatePayment,
  useDeletePayment,
} from "../hooks/use-payments";
import { FeeCategoryDialog } from "./fee-category-dialog";
import { PaymentFormDialog } from "./payment-form-dialog";
import { ReceiptDetailsDialog } from "./receipt-details-dialog";
import type { PaymentWithRelations, FeeCategory } from "../types";
import type { CreateFeeCategoryInput, CreatePaymentInput } from "../schemas";

const statusColors: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10",
  partial: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
  pending: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10",
  overdue: "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10",
  cancelled: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10",
};

const statusLabels: Record<string, string> = {
  paid: "Réglé",
  partial: "Partiel",
  pending: "En attente",
  overdue: "En retard",
  cancelled: "Annulé",
};

const methodLabels: Record<string, string> = {
  cash: "Espèces",
  check: "Chèque",
  card: "Carte Bancaire",
  mobile_money: "Mobile Money",
  transfer: "Virement",
};

export function PaymentsPage() {
  const { can } = usePermissions();
  const canCreate = can("payments", "create");
  const canDelete = can("payments", "delete");

  const [activeTab, setActiveTab] = useState<"journal" | "tarifs">("journal");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [feeFormOpen, setFeeFormOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentWithRelations | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<PaymentWithRelations | null>(null);
  const [deleteFeeTarget, setDeleteFeeTarget] = useState<FeeCategory | null>(null);

  // Queries
  const { data: feeCategories = [], isLoading: loadingFees, refetch: refetchFees } = useFeeCategories();
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
  const { data: paymentsData, isLoading: loadingPayments, isError, error, refetch: refetchPayments } = usePayments(filters);

  const createPayment = useCreatePayment();
  const deletePayment = useDeletePayment();
  const createFeeCategory = useCreateFeeCategory();
  const deleteFeeCategory = useDeleteFeeCategory();

  const paymentsList = paymentsData?.data ?? [];

  // Statistics
  const totalRevenue = useMemo(() => {
    return paymentsList.reduce((acc, p) => acc + (p.status !== "cancelled" ? Number(p.amount_paid) : 0), 0);
  }, [paymentsList]);

  // Payment Table Columns
  const paymentColumns = useMemo(
    () => [
      {
        accessorKey: "receipt_number",
        header: "N° Reçu",
        cell: ({ row }: any) => <span className="font-mono text-xs font-semibold">{row.original.receipt_number}</span>,
      },
      {
        accessorKey: "student.user.name",
        header: "Élève",
        cell: ({ row }: any) => (
          <div>
            <p className="font-bold text-sm">{row.original.student?.user?.name || "Sans nom"}</p>
            <p className="text-xs text-muted-foreground font-mono">{row.original.student?.student_number || "—"}</p>
          </div>
        ),
      },
      {
        accessorKey: "fee_category.name",
        header: "Frais scolaires",
        cell: ({ row }: any) => <span className="text-sm">{row.original.fee_category?.name || "—"}</span>,
      },
      {
        accessorKey: "amount_paid",
        header: "Versé",
        cell: ({ row }: any) => <span className="font-bold text-emerald-500">{formatCurrency(row.original.amount_paid)}</span>,
      },
      {
        accessorKey: "balance",
        header: "Reste",
        cell: ({ row }: any) => (
          <span className={`font-mono text-xs ${Number(row.original.balance) > 0 ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>
            {formatCurrency(row.original.balance)}
          </span>
        ),
      },
      {
        accessorKey: "payment_date",
        header: "Date",
        cell: ({ row }: any) => formatDate(row.original.payment_date || row.original.created_at),
      },
      {
        accessorKey: "payment_method",
        header: "Mode",
        cell: ({ row }: any) => <span className="text-xs">{methodLabels[row.original.payment_method] || row.original.payment_method}</span>,
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }: any) => (
          <Badge className={`border ${statusColors[row.original.status] || ""}`}>
            {statusLabels[row.original.status] || row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }: any) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setSelectedReceipt(row.original)}
              title="Voir Reçu"
            >
              <Eye className="size-3.5 text-muted-foreground hover:text-foreground" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDeletePaymentTarget(row.original)}
                title="Annuler"
              >
                <Trash2 className="size-3.5 text-rose-500 hover:text-rose-600" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canDelete]
  );

  // Fee Table Columns
  const feeColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Libellé des frais",
        cell: ({ row }: any) => <span className="font-bold text-sm">{row.original.name}</span>,
      },
      {
        accessorKey: "amount",
        header: "Montant",
        cell: ({ row }: any) => <span className="font-bold text-brand-500">{formatCurrency(row.original.amount)}</span>,
      },
      {
        accessorKey: "level.name",
        header: "Niveau",
        cell: ({ row }: any) => <span className="text-sm">{row.original.level?.name || "Tous"}</span>,
      },
      {
        accessorKey: "is_mandatory",
        header: "Caractère",
        cell: ({ row }: any) => (
          <Badge variant={row.original.is_mandatory ? "default" : "secondary"}>
            {row.original.is_mandatory ? "Obligatoire" : "Facultatif"}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }: any) => (
          <div className="flex justify-end">
            {canDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDeleteFeeTarget(row.original)}
                title="Supprimer"
              >
                <Trash2 className="size-3.5 text-rose-500 hover:text-rose-600" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canDelete]
  );

  const handleExport = () => {
    exportToCSV(
      paymentsList.map((p) => ({
        recu: p.receipt_number,
        eleve: p.student?.user?.name || "",
        frais: p.fee_category?.name || "",
        verse: p.amount_paid,
        reste: p.balance,
        date: p.payment_date,
        mode: p.payment_method,
        statut: p.status,
      })),
      "versements"
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <PageHeader
          title="Frais, Scolarités & Paiements"
          description="Gérez les versements scolaires des élèves et configurez les grilles tarifaires."
          icon={DollarSign}
        />

        <div className="flex gap-2">
          {activeTab === "journal" && canCreate && (
            <Button
              onClick={() => setPaymentFormOpen(true)}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Plus className="size-4" /> Enregistrer un versement
            </Button>
          )}
          {activeTab === "tarifs" && canCreate && (
            <Button
              onClick={() => setFeeFormOpen(true)}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-white"
            >
              <Plus className="size-4" /> Nouvelle catégorie
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-4 no-print">
        <button
          onClick={() => setActiveTab("journal")}
          className={`pb-2.5 font-semibold text-sm flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "journal"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarRange className="size-4" /> Journal des Versements
        </button>
        <button
          onClick={() => setActiveTab("tarifs")}
          className={`pb-2.5 font-semibold text-sm flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "tarifs"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="size-4" /> Configuration des Tarifs
        </button>
      </div>

      {activeTab === "journal" ? (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Revenus Perçus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{formatCurrency(totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{paymentsList.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase font-sans">Tarifs Configurés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-500">{feeCategories.length} catégories</div>
              </CardContent>
            </Card>
          </div>

          {/* Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border no-print">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro de reçu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => exportToPDF({ title: "Journal Financier", filename: "journal_caisse" })} className="gap-2 text-xs w-full sm:w-auto">
                <Printer className="size-3.5" /> PDF
              </Button>
              <Button variant="outline" onClick={handleExport} className="gap-2 text-xs w-full sm:w-auto">
                <FileSpreadsheet className="size-3.5 text-emerald-500" /> Excel
              </Button>
            </div>
          </div>

          {/* Payments Table */}
          {isError ? (
            <ErrorState
              title="Erreur"
              description={error?.message}
              onRetry={() => refetchPayments()}
            />
          ) : (
            <DataTable
              columns={paymentColumns}
              data={paymentsList}
              isLoading={loadingPayments}
              emptyMessage="Aucune transaction encaissée pour l'instant."
              pagination
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Fee Grid */}
          <DataTable
            columns={feeColumns}
            data={feeCategories}
            isLoading={loadingFees}
            emptyMessage="Aucun tarif d'école configuré. Créez des tarifs pour pouvoir facturer."
          />
        </div>
      )}

      {/* Forms & Dialogs */}
      <PaymentFormDialog
        open={paymentFormOpen}
        onOpenChange={setPaymentFormOpen}
        onSubmit={async (values) => {
          await createPayment.mutateAsync(values as CreatePaymentInput);
          setPaymentFormOpen(false);
        }}
        isLoading={createPayment.isPending}
      />

      <FeeCategoryDialog
        open={feeFormOpen}
        onOpenChange={setFeeFormOpen}
        onSubmit={async (values) => {
          await createFeeCategory.mutateAsync(values as CreateFeeCategoryInput);
          setFeeFormOpen(false);
        }}
        isLoading={createFeeCategory.isPending}
      />

      <ReceiptDetailsDialog
        open={!!selectedReceipt}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
        payment={selectedReceipt}
      />

      <ConfirmDialog
        open={!!deletePaymentTarget}
        onOpenChange={(open) => !open && setDeletePaymentTarget(null)}
        title="Annuler ce versement ?"
        description={`Le reçu « ${deletePaymentTarget?.receipt_number} » sera définitivement supprimé. Le compte de l'élève « ${deletePaymentTarget?.student?.user?.name} » sera mis à jour avec une balance débirentière.`}
        onConfirm={async () => {
          if (deletePaymentTarget) {
            await deletePayment.mutateAsync(deletePaymentTarget.id);
            setDeletePaymentTarget(null);
          }
        }}
        isLoading={deletePayment.isPending}
      />

      <ConfirmDialog
        open={!!deleteFeeTarget}
        onOpenChange={(open) => !open && setDeleteFeeTarget(null)}
        title="Supprimer ce tarif ?"
        description={`La grille tarifaire « ${deleteFeeTarget?.name} » sera supprimée. Les élèves n'y seront plus assujettis.`}
        onConfirm={async () => {
          if (deleteFeeTarget) {
            await deleteFeeCategory.mutateAsync(deleteFeeTarget.id);
            setDeleteFeeTarget(null);
          }
        }}
        isLoading={deleteFeeCategory.isPending}
      />
    </div>
  );
}
