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
import type { SubjectWithTrack } from "../types";

interface SubjectColumnsOptions {
  onEdit: (row: SubjectWithTrack) => void;
  onDelete: (row: SubjectWithTrack) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function getSubjectColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: SubjectColumnsOptions): ColumnDef<SubjectWithTrack>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Code
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.code}
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
          Matière
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.color && (
            <span
              className="size-3.5 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: row.original.color }}
            />
          )}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "coefficient",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Coef
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge className="font-mono bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/10">
          {row.original.coefficient}
        </Badge>
      ),
    },
    {
      accessorKey: "track",
      header: "Filière",
      cell: ({ row }) => {
        const track = row.original.track;
        if (!track) return <span className="text-xs text-muted-foreground">Toutes (Générale)</span>;
        return (
          <div>
            <p className="text-sm font-medium">{track.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{track.code}</p>
          </div>
        );
      },
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
