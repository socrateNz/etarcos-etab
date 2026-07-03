"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClassroomWithRelations } from "../types";

interface ClassroomColumnsOptions {
  onEdit: (row: ClassroomWithRelations) => void;
  onDelete: (row: ClassroomWithRelations) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function getClassroomColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: ClassroomColumnsOptions): ColumnDef<ClassroomWithRelations>[] {
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
          Classe
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-base text-foreground">{row.original.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.original.code}</p>
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: "Niveau / Cycle",
      cell: ({ row }) => {
        const lvl = row.original.level;
        if (!lvl) return "—";
        return (
          <div>
            <p className="text-sm font-medium">{lvl.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{lvl.code}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "track",
      header: "Filière",
      cell: ({ row }) => {
        const track = row.original.track;
        if (!track) return <Badge variant="secondary" className="font-normal text-xs">Générale</Badge>;
        return (
          <div>
            <p className="text-sm font-medium text-brand-500">{track.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{track.code}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "capacity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Effectif / Capacité
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const count = row.original.student_count ?? 0;
        const cap = row.original.capacity ?? 40;
        const isOverCapacity = count > cap;

        return (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span
              className={`font-mono text-sm font-bold ${
                isOverCapacity ? "text-rose-500" : "text-foreground"
              }`}
            >
              {count}
            </span>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-muted-foreground font-mono text-xs">{cap}</span>
            {isOverCapacity && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                Surchargée
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "main_teacher",
      header: "Professeur Principal",
      cell: ({ row }) => {
        const teacher = row.original.main_teacher;
        if (!teacher) return <span className="text-xs text-muted-foreground italic">Non assigné</span>;
        return (
          <div>
            <p className="text-sm font-medium">{teacher.name}</p>
            <p className="text-xs text-muted-foreground">{teacher.email}</p>
          </div>
        );
      },
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
