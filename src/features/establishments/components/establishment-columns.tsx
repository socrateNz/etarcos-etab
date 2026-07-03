"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import type { EstablishmentListItem } from "../types";
import {
  EstablishmentPlanBadge,
  EstablishmentStatusBadge,
} from "./establishment-badges";

interface EstablishmentColumnsOptions {
  onView: (row: EstablishmentListItem) => void;
  onEdit: (row: EstablishmentListItem) => void;
  onDelete: (row: EstablishmentListItem) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function getEstablishmentColumns({
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: EstablishmentColumnsOptions): ColumnDef<EstablishmentListItem>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Établissement
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "Ville",
      cell: ({ row }) => row.original.city ?? "—",
    },
    {
      accessorKey: "plan",
      header: "Formule",
      cell: ({ row }) => <EstablishmentPlanBadge plan={row.original.plan} />,
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => <EstablishmentStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "created_at",
      header: "Créé le",
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
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
            <DropdownMenuItem onClick={() => onView(row.original)}>
              <Eye className="size-4" />
              Voir les détails
            </DropdownMenuItem>
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
