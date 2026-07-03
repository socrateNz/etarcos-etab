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
import { formatDate } from "@/lib/utils";
import type { StaffMemberWithUser } from "../types";

interface StaffColumnsOptions {
  onEdit: (row: StaffMemberWithUser) => void;
  onDelete: (row: StaffMemberWithUser) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const contractLabels: Record<string, string> = {
  permanent: "CDI",
  temporary: "CDD",
  part_time: "Temps partiel",
  intern: "Stagiaire",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10",
  inactive: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10",
  suspended: "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
};

const statusLabels: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
  pending: "En attente",
};

export function getStaffColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: StaffColumnsOptions): ColumnDef<StaffMemberWithUser>[] {
  return [
    {
      accessorKey: "employee_number",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Matricule
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.employee_number}
        </Badge>
      ),
    },
    {
      accessorKey: "user.name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nom
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-sm text-foreground">
            {row.original.user?.name || "Sans nom"}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.user?.email || "—"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "position",
      header: "Poste",
      cell: ({ row }) => (
        <span className="font-medium text-brand-500 text-sm">{row.original.position}</span>
      ),
    },
    {
      accessorKey: "department",
      header: "Département",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.department || "—"}</span>
      ),
    },
    {
      accessorKey: "contract_type",
      header: "Contrat",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal text-xs">
          {contractLabels[row.original.contract_type] || row.original.contract_type}
        </Badge>
      ),
    },
    {
      accessorKey: "hire_date",
      header: "Recruté le",
      cell: ({ row }) => formatDate(row.original.hire_date),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => (
        <Badge className={`border ${statusColors[row.original.status] || ""}`}>
          {statusLabels[row.original.status] || row.original.status}
        </Badge>
      ),
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
