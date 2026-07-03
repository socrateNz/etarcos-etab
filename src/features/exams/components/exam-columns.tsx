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
import type { ExamWithRelations } from "../types";

interface ExamColumnsOptions {
  onEdit: (row: ExamWithRelations) => void;
  onDelete: (row: ExamWithRelations) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function getExamColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: ExamColumnsOptions): ColumnDef<ExamWithRelations>[] {
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
          Nom de l'évaluation
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-bold text-sm text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "classroom.name",
      header: "Classe",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.classroom?.name || <Badge variant="outline">Toutes les classes</Badge>}
        </span>
      ),
    },
    {
      accessorKey: "subject.name",
      header: "Matière",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-brand-500">
          {row.original.subject?.name || "Matière inconnue"}
        </span>
      ),
    },
    {
      accessorKey: "exam_date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date d'examen
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.original.exam_date),
    },
    {
      accessorKey: "start_time",
      header: "Horaire",
      cell: ({ row }) => {
        const start = row.original.start_time;
        const end = row.original.end_time;
        if (!start) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <Badge variant="outline" className="font-mono text-xs">
            {start.substring(0, 5)} {end ? `- ${end.substring(0, 5)}` : ""}
          </Badge>
        );
      },
    },
    {
      accessorKey: "room.name",
      header: "Salle",
      cell: ({ row }) => (
        <span className="text-sm font-semibold">{row.original.room?.name || "—"}</span>
      ),
    },
    {
      accessorKey: "max_score",
      header: "Note Max",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono font-normal">
          /{row.original.max_score}
        </Badge>
      ),
    },
    {
      accessorKey: "coefficient",
      header: "Coef",
      cell: ({ row }) => <span className="font-semibold text-sm font-mono">x{row.original.coefficient}</span>,
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
