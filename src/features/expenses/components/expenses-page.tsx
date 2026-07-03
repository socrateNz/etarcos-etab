"use client";

import { useMemo, useState } from "react";
import { TrendingDown, Plus, FileSpreadsheet, Printer } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "../hooks/use-expenses";
import { getExpenseColumns } from "./expense-columns";
import { ExpenseFormDialog } from "./expense-form-dialog";
import type { Expense } from "../types";
import type { CreateExpenseInput, UpdateExpenseInput } from "../schemas";

export function ExpensesPage() {
  const { can } = usePermissions();
  const canCreate = can("expenses", "create");
  const canEdit = can("expenses", "edit");
  const canDelete = can("expenses", "delete");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      page: 1,
      per_page: 50,
      sort_by: "expense_date",
      sort_order: "desc" as const,
    }),
    [debouncedSearch, categoryFilter]
  );

  const {
    data: expensesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useExpenses(filters);

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const expensesList = expensesData?.data ?? [];

  // Summary total amount
  const totalExpenses = useMemo(() => {
    return expensesList.reduce((acc, exp) => acc + Number(exp.amount), 0);
  }, [expensesList]);

  const columns = useMemo(
    () =>
      getExpenseColumns({
        onEdit: (row) => {
          setEditingExpense(row);
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
      expensesList.map((e) => ({
        categorie: e.category,
        libelle: e.description,
        montant: e.amount,
        date: e.expense_date,
        saisi_par: e.creator?.name || "",
      })),
      "depenses"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal des Dépenses & Sorties"
        description="Gérez les charges d'exploitation, les factures courantes et les fournitures."
        icon={TrendingDown}
      />

      {/* KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Sorties de caisse totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1 max-w-md">
          <Input
            placeholder="Rechercher une dépense…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="Fournitures">Fournitures scolaires</SelectItem>
              <SelectItem value="Salaires">Salaires & RH</SelectItem>
              <SelectItem value="Maintenance">Maintenance & Travaux</SelectItem>
              <SelectItem value="Factures">Factures (Eau/Élec/Net)</SelectItem>
              <SelectItem value="Loyers">Loyer & Location</SelectItem>
              <SelectItem value="Autres">Autres charges</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Journal des Charges", filename: "depenses" })}
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
                setEditingExpense(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Plus className="size-4" />
              Saisir une dépense
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
          data={expensesList}
          isLoading={isLoading}
          emptyMessage="Aucune sortie de caisse enregistrée."
          pagination
        />
      )}

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingExpense(null);
        }}
        expense={editingExpense}
        onSubmit={async (values) => {
          if (editingExpense) {
            await updateExpense.mutateAsync({ id: editingExpense.id, values: values as UpdateExpenseInput });
          } else {
            await createExpense.mutateAsync(values as CreateExpenseInput);
          }
          setFormOpen(false);
          setEditingExpense(null);
        }}
        isLoading={createExpense.isPending || updateExpense.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer cette dépense ?"
        description={`La dépense de « ${deleteTarget?.amount} FCFA » enregistrée pour « ${deleteTarget?.description} » sera définitivement retirée de la comptabilité.`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteExpense.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteExpense.isPending}
      />
    </div>
  );
}
