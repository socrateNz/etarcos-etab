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
import type { Room } from "../types";

interface RoomColumnsOptions {
  onEdit: (row: Room) => void;
  onDelete: (row: Room) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const typeLabels: Record<string, string> = {
  classroom: "Salle de cours",
  lab: "Laboratoire",
  library: "Bibliothèque",
  gym: "Gymnase",
  office: "Bureau",
  other: "Autre",
};

const typeColors: Record<string, string> = {
  classroom: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/10",
  lab: "bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/10",
  library: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10",
  gym: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
  office: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10",
  other: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10",
};

export function getRoomColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: RoomColumnsOptions): ColumnDef<Room>[] {
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
          Nom de la Salle
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-bold text-sm text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge className={`border ${typeColors[row.original.type] || ""}`}>
          {typeLabels[row.original.type] || row.original.type}
        </Badge>
      ),
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
          Capacité
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.capacity} places
        </Badge>
      ),
    },
    {
      accessorKey: "building",
      header: "Localisation",
      cell: ({ row }) => {
        const build = row.original.building;
        const floor = row.original.floor;
        if (!build && floor === null) return <span className="text-muted-foreground">—</span>;

        const parts = [];
        if (build) parts.push(build);
        if (floor !== null) {
          parts.push(floor === 0 ? "RDC" : `Étage ${floor}`);
        }
        return <span className="text-sm">{parts.join(", ")}</span>;
      },
    },
    {
      accessorKey: "is_available",
      header: "Disponibilité",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.is_available
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
              : "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
          }
        >
          {row.original.is_available ? "Disponible" : "Occupée / Indispo"}
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
