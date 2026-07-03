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
import type { ParentWithRelations } from "../types";

interface ParentColumnsOptions {
  onEdit: (row: ParentWithRelations) => void;
  onDelete: (row: ParentWithRelations) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const relationshipLabels: Record<string, string> = {
  father: "Père",
  mother: "Mère",
  guardian: "Tuteur",
  other: "Autre",
};

const relationshipColors: Record<string, string> = {
  father: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/10",
  mother: "bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/10",
  guardian: "bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/10",
  other: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10",
};

export function getParentColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: ParentColumnsOptions): ColumnDef<ParentWithRelations>[] {
  return [
    {
      accessorKey: "user.name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nom du Parent
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-sm text-foreground">
            {row.original.user?.name || "Sans nom"}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.user?.phone || row.original.user?.email || "—"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "relationship",
      header: "Lien de parenté",
      cell: ({ row }) => (
        <Badge className={`border ${relationshipColors[row.original.relationship] || ""}`}>
          {relationshipLabels[row.original.relationship] || row.original.relationship}
        </Badge>
      ),
    },
    {
      accessorKey: "profession",
      header: "Profession",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.profession || "—"}</span>
      ),
    },
    {
      accessorKey: "is_emergency_contact",
      header: "Urgence",
      cell: ({ row }) =>
        row.original.is_emergency_contact ? (
          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10">
            Contact Principal
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "students",
      header: "Élèves rattachés",
      cell: ({ row }) => {
        const students = row.original.students ?? [];
        if (students.length === 0) {
          return <span className="text-xs text-muted-foreground italic">Aucun élève</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {students.map((s) => (
              <Badge key={s.id} variant="outline" className="font-normal text-[11px] font-sans">
                {s.user?.name} ({s.student_number})
              </Badge>
            ))}
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
