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
import type { DisciplineRecordWithRelations } from "../types";

interface DisciplineColumnsOptions {
  onEdit: (row: DisciplineRecordWithRelations) => void;
  onDelete: (row: DisciplineRecordWithRelations) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const levelLabels: Record<string, string> = {
  warning: "Avertissement",
  reprimand: "Blâme",
  suspension: "Exclusion Temp.",
  exclusion: "Exclusion Déf.",
};

const levelColors: Record<string, string> = {
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
  reprimand: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/10",
  suspension: "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10",
  exclusion: "bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/20",
};

export function getDisciplineColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: DisciplineColumnsOptions): ColumnDef<DisciplineRecordWithRelations>[] {
  return [
    {
      accessorKey: "student.user.name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Élève concerné
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-sm text-foreground">{row.original.student?.user?.name || "Sans nom"}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.original.student?.student_number || "—"}</p>
        </div>
      ),
    },
    {
      accessorKey: "student.classroom.name",
      header: "Classe",
      cell: ({ row }) => <span className="text-sm">{row.original.student?.classroom?.name || "Sans classe"}</span>,
    },
    {
      accessorKey: "level",
      header: "Type de sanction",
      cell: ({ row }) => (
        <Badge className={`border ${levelColors[row.original.level] || ""}`}>
          {levelLabels[row.original.level] || row.original.level}
        </Badge>
      ),
    },
    {
      accessorKey: "incident_date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date Incident
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.original.incident_date),
    },
    {
      accessorKey: "reason",
      header: "Motif de l'incident",
      cell: ({ row }) => (
        <p className="text-xs max-w-xs truncate text-muted-foreground" title={row.original.reason}>
          {row.original.reason}
        </p>
      ),
    },
    {
      accessorKey: "decision",
      header: "Sanction / Décision",
      cell: ({ row }) => (
        <p className="text-xs max-w-xs truncate text-foreground font-medium" title={row.original.decision || ""}>
          {row.original.decision || "—"}
        </p>
      ),
    },
    {
      accessorKey: "duration_days",
      header: "Durée",
      cell: ({ row }) =>
        row.original.level === "suspension" && row.original.duration_days ? (
          <Badge variant="secondary" className="font-normal font-sans">
            {row.original.duration_days} jours
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
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
