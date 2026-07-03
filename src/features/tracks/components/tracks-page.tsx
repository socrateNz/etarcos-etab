"use client";

import { useMemo, useState } from "react";
import { GitFork, Plus, FileSpreadsheet, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  useTracks,
  useCreateTrack,
  useUpdateTrack,
  useDeleteTrack,
} from "../hooks/use-tracks";
import { getTrackColumns } from "./track-columns";
import { TrackFormDialog } from "./track-form-dialog";
import type { Track } from "../types";
import type { CreateTrackInput, UpdateTrackInput } from "../schemas";

export function TracksPage() {
  const { can } = usePermissions();
  const canCreate = can("tracks", "create");
  const canEdit = can("tracks", "edit");
  const canDelete = can("tracks", "delete");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Track | null>(null);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page: 1,
      per_page: 50,
      sort_by: "code",
      sort_order: "asc" as const,
    }),
    [debouncedSearch]
  );

  const {
    data: tracksData,
    isLoading,
    isError,
    error,
    refetch,
  } = useTracks(filters);

  const createTrack = useCreateTrack();
  const updateTrack = useUpdateTrack();
  const deleteTrack = useDeleteTrack();

  const tracks = tracksData?.data ?? [];

  const columns = useMemo(
    () =>
      getTrackColumns({
        onEdit: (row) => {
          setEditingTrack(row);
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
      tracks.map((t) => ({
        nom: t.name,
        code: t.code,
        description: t.description ?? "",
      })),
      "filieres"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Filières & Spécialités"
        description="Gérez les différentes filières et spécialités d'enseignement de votre établissement."
        icon={GitFork}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex flex-wrap gap-2 flex-1 max-w-xs">
          <Input
            placeholder="Rechercher une filière…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF({ title: "Filières d'enseignement", filename: "filieres" })}
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
                setEditingTrack(null);
                setFormOpen(true);
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-white"
            >
              <Plus className="size-4" />
              Nouvelle filière
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
          data={tracks}
          isLoading={isLoading}
          emptyMessage="Aucune filière configurée. Commencez par créer une filière."
          pagination
        />
      )}

      <TrackFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTrack(null);
        }}
        track={editingTrack}
        onSubmit={async (values) => {
          if (editingTrack) {
            await updateTrack.mutateAsync({ id: editingTrack.id, values: values as UpdateTrackInput });
          } else {
            await createTrack.mutateAsync(values as CreateTrackInput);
          }
          setFormOpen(false);
          setEditingTrack(null);
        }}
        isLoading={createTrack.isPending || updateTrack.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer cette filière ?"
        description={`La filière « ${deleteTarget?.name} » sera définitivement supprimée.`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteTrack.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isLoading={deleteTrack.isPending}
      />
    </div>
  );
}
