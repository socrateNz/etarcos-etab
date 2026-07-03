"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "../types";

interface ExpenseColumnsOptions {
  onEdit: (row: Expense) => void;
  onDelete: (row: Expense) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function getExpenseColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: ExpenseColumnsOptions): ColumnDef<Expense>[] {
  return [
    {
      accessorKey: "category",
      header: "Catégorie",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-semibold text-xs uppercase bg-rose-500/5 text-rose-500 border-rose-500/10">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description / Libellé",
      cell: ({ row }) => <span className="font-semibold text-sm text-foreground">{row.original.description}</span>,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Montant
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-bold text-rose-500 font-mono">{formatCurrency(row.original.amount)}</span>,
    },
    {
      accessorKey: "expense_date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date de facturation
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.original.expense_date),
    },
    {
      accessorKey: "creator.name",
      header: "Saisi par",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.creator?.name || "—"}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="no-print">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="size-4" />
                Modifier
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(row.original)}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
