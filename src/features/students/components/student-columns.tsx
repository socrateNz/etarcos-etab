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
import type { StudentWithRelations } from "../types";

interface StudentColumnsOptions {
  onEdit: (row: StudentWithRelations) => void;
  onDelete: (row: StudentWithRelations) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const scholarshipLabels: Record<string, string> = {
  none: "Standard",
  partial: "Demi-bourse",
  full: "Boursier",
};

const scholarshipColors: Record<string, string> = {
  none: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10",
  partial: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
  full: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10",
  inactive: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10",
  suspended: "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
};

const statusLabels: Record<string, string> = {
  active: "Inscrit",
  inactive: "Inactif",
  suspended: "Exclu / Suspendu",
  pending: "En attente",
};

export function getStudentColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: StudentColumnsOptions): ColumnDef<StudentWithRelations>[] {
  return [
    {
      accessorKey: "student_number",
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
          {row.original.student_number}
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
          Nom de l'élève
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-sm text-foreground">
            {row.original.user?.name || "Sans nom"}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {row.original.user?.phone || row.original.user?.email || "—"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "classroom",
      header: "Classe",
      cell: ({ row }) => (
        <span className="font-semibold text-foreground text-sm">
          {row.original.classroom?.name || <span className="text-xs text-muted-foreground italic">Non affecté</span>}
        </span>
      ),
    },
    {
      accessorKey: "track",
      header: "Filière",
      cell: ({ row }) => (
        <span className="text-xs text-brand-500">
          {row.original.track?.name || "Générale"}
        </span>
      ),
    },
    {
      accessorKey: "enrollment_date",
      header: "Inscrit le",
      cell: ({ row }) => formatDate(row.original.enrollment_date),
    },
    {
      accessorKey: "scholarship_type",
      header: "Régime / Bourse",
      cell: ({ row }) => (
        <Badge className={`border ${scholarshipColors[row.original.scholarship_type || "none"] || ""}`}>
          {scholarshipLabels[row.original.scholarship_type || "none"] || row.original.scholarship_type}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => (
        <Badge className={`border ${statusColors[row.original.status || "active"] || ""}`}>
          {statusLabels[row.original.status || "active"] || row.original.status}
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
