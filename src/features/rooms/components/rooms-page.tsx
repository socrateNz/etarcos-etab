"use client";

import { useMemo, useState } from "react";
import { School, Plus, FileSpreadsheet, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from "../hooks/use-rooms";
import { getRoomColumns } from "./room-columns";
import { RoomFormDialog } from "./room-form-dialog";
import type { Room } from "../types";
import type { CreateRoomInput, UpdateRoomInput } from "../schemas";

export function RoomsPage() {
  const { can } = usePermissions();
  const canCreate = can("rooms", "create");
  const canEdit = can("rooms", "edit");
  const canDelete = can("rooms", "delete");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: typeFilter === "all" ? undefined : (typeFilter as any),
      page: 1,
      per_page: 50,
      sort_by: "name",
      sort_order: "asc" as const,
    }),
    [debouncedSearch, typeFilter]
  );

  const {
    data: roomsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useRooms(filters);

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const roomsList = roomsData?.data ?? [];

  const columns = useMemo(
    () =>
      getRoomColumns({
        onEdit: (row) => {
          setEditingRoom(row);
          setFormOpen(true);
        },
        onDelete: setDeleteTarget,
        canEdit,
        canDelete,
      }),
    [canEdit, canDelete]
  );

  const handleExport = () => {
    exportToCSV(
      roomsList.map((r) => ({
        nom: r.name,
        type: r.type,
        capacite: r.capacity,
        batiment: r.building || "",
        etage: r.floor !== null ? r.floor : "",
        disponible: r.is_available ? "Oui" : "Non",
      })),
      "salles"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infrastructures & Salles"
        description="Gérez les salles physiques, laboratoires et bureaux de votre établissement."
        icon={School}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1 max-w-md">
          <Input
            placeholder="Rechercher une salle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="classroom">Salle de cours</SelectItem>
              <SelectItem value="lab">Laboratoire</SelectItem>
              <SelectItem value="library">Bibliothèque</SelectItem>
              <SelectItem value="gym">Gymnase</SelectItem>
              <SelectItem value="office">Bureau</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Infrastructures de l'école", filename: "salles" })}
            className="gap-1.5"
          >
            <Printer className="size-3.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <FileSpreadsheet className="size-3.5 text-emerald-500" /> Excel
          </Button>
          {canCreate && (
            <Button
              onClick={() => {
                setEditingRoom(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold"
            >
              <Plus className="size-4" />
              Nouvelle salle
            </Button>
          )}
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Erreur"
          description={error?.message}
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={roomsList}
          isLoading={isLoading}
          emptyMessage="Aucune salle physique configurée. Créez votre première salle."
          pagination
        />
      )}

      <RoomFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRoom(null);
        }}
        room={editingRoom}
        onSubmit={async (values) => {
          if (editingRoom) {
            await updateRoom.mutateAsync({ id: editingRoom.id, values: values as UpdateRoomInput });
          } else {
            await createRoom.mutateAsync(values as CreateRoomInput);
          }
          await refetch();
          setFormOpen(false);
          setEditingRoom(null);
        }}
        isLoading={createRoom.isPending || updateRoom.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer cette salle ?"
        description={`La salle « ${deleteTarget?.name} » sera définitivement supprimée. Les cours programmés dans cette salle perdront leur affectation de salle.`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteRoom.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteRoom.isPending}
      />
    </div>
  );
}
