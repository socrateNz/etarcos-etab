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
import type { CycleWithLevelsCount } from "../types";

interface CycleColumnsOptions {
  onEdit: (row: CycleWithLevelsCount) => void;
  onDelete: (row: CycleWithLevelsCount) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function getCycleColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: CycleColumnsOptions): ColumnDef<CycleWithLevelsCount>[] {
  return [
    {
      accessorKey: "order",
      header: "Ordre",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.order}
        </Badge>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cycle
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.original.code}</p>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "levels_count",
      header: "Niveaux",
      cell: ({ row }) => row.original.levels_count ?? 0,
    },
    {
      accessorKey: "created_at",
      header: "Créé le",
      cell: ({ row }) => formatDate(row.original.created_at),
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
