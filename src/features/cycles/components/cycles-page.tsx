"use client";

import { useMemo, useState } from "react";
import { GitBranch, Plus, FileSpreadsheet, Printer, Layers } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useCycles,
  useLevels,
  useCreateCycle,
  useUpdateCycle,
  useDeleteCycle,
  useCreateLevel,
  useUpdateLevel,
  useDeleteLevel,
} from "../hooks/use-cycles";
import { getCycleColumns } from "./cycle-columns";
import { getLevelColumns } from "./level-columns";
import { CycleFormDialog } from "./cycle-form-dialog";
import { LevelFormDialog } from "./level-form-dialog";
import type { CycleWithLevelsCount, LevelWithCycle } from "../types";
import type { CreateCycleInput, UpdateCycleInput, CreateLevelInput, UpdateLevelInput } from "../schemas";

export function CyclesPage() {
  const { can } = usePermissions();
  const canCreate = can("cycles", "create");
  const canEdit = can("cycles", "edit");
  const canDelete = can("cycles", "delete");

  const [tab, setTab] = useState("cycles");
  const [cycleSearch, setCycleSearch] = useState("");
  const [levelSearch, setLevelSearch] = useState("");
  const [levelCycleFilter, setLevelCycleFilter] = useState<string>("all");

  const debouncedCycleSearch = useDebounce(cycleSearch, 300);
  const debouncedLevelSearch = useDebounce(levelSearch, 300);

  const [cycleFormOpen, setCycleFormOpen] = useState(false);
  const [levelFormOpen, setLevelFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CycleWithLevelsCount | null>(null);
  const [editingLevel, setEditingLevel] = useState<LevelWithCycle | null>(null);
  const [deleteCycleTarget, setDeleteCycleTarget] = useState<CycleWithLevelsCount | null>(null);
  const [deleteLevelTarget, setDeleteLevelTarget] = useState<LevelWithCycle | null>(null);

  const cycleFilters = useMemo(
    () => ({
      search: debouncedCycleSearch || undefined,
      page: 1,
      per_page: 50,
      sort_by: "order",
      sort_order: "asc" as const,
    }),
    [debouncedCycleSearch]
  );

  const levelFilters = useMemo(
    () => ({
      search: debouncedLevelSearch || undefined,
      cycle_id: levelCycleFilter === "all" ? undefined : levelCycleFilter,
      page: 1,
      per_page: 50,
      sort_by: "order",
      sort_order: "asc" as const,
    }),
    [debouncedLevelSearch, levelCycleFilter]
  );

  const {
    data: cyclesData,
    isLoading: cyclesLoading,
    isError: cyclesError,
    error: cyclesErr,
    refetch: refetchCycles,
  } = useCycles(cycleFilters);

  const {
    data: levelsData,
    isLoading: levelsLoading,
    isError: levelsError,
    error: levelsErr,
    refetch: refetchLevels,
  } = useLevels(levelFilters);

  const createCycle = useCreateCycle();
  const updateCycle = useUpdateCycle();
  const deleteCycle = useDeleteCycle();
  const createLevel = useCreateLevel();
  const updateLevel = useUpdateLevel();
  const deleteLevel = useDeleteLevel();

  const cycles = cyclesData?.data ?? [];
  const levels = levelsData?.data ?? [];

  const cycleColumns = useMemo(
    () =>
      getCycleColumns({
        onEdit: (row) => {
          setEditingCycle(row);
          setCycleFormOpen(true);
        },
        onDelete: setDeleteCycleTarget,
        canEdit,
        canDelete,
      }),
    [canEdit, canDelete]
  );

  const levelColumns = useMemo(
    () =>
      getLevelColumns({
        onEdit: (row) => {
          setEditingLevel(row);
          setLevelFormOpen(true);
        },
        onDelete: setDeleteLevelTarget,
        canEdit,
        canDelete,
      }),
    [canEdit, canDelete]
  );

  const handleExportCycles = () => {
    exportToCSV(
      cycles.map((c) => ({
        nom: c.name,
        code: c.code,
        ordre: c.order,
        niveaux: c.levels_count ?? 0,
        description: c.description ?? "",
      })),
      "cycles"
    );
  };

  const handleExportLevels = () => {
    exportToCSV(
      levels.map((l) => ({
        nom: l.name,
        code: l.code,
        cycle: l.cycle?.name ?? "",
        ordre: l.order,
      })),
      "niveaux"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cycles & Niveaux"
        description="Configurez la structure académique de votre établissement."
        icon={GitBranch}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <TabsList>
            <TabsTrigger value="cycles" className="gap-2">
              <GitBranch className="size-4" />
              Cycles
              {cyclesData && (
                <span className="text-xs text-muted-foreground">({cyclesData.total})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="levels" className="gap-2">
              <Layers className="size-4" />
              Niveaux
              {levelsData && (
                <span className="text-xs text-muted-foreground">({levelsData.total})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {canCreate && (
            <Button
              onClick={() => {
                if (tab === "cycles") {
                  setEditingCycle(null);
                  setCycleFormOpen(true);
                } else {
                  setEditingLevel(null);
                  setLevelFormOpen(true);
                }
              }}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold sm:self-end"
            >
              <Plus className="size-4" />
              {tab === "cycles" ? "Nouveau cycle" : "Nouveau niveau"}
            </Button>
          )}
        </div>

        <TabsContent value="cycles" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 no-print">
            <Input
              placeholder="Rechercher un cycle…"
              value={cycleSearch}
              onChange={(e) => setCycleSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => exportToPDF({ title: "Cycles scolaires", filename: "cycles" })} className="gap-1.5">
                <Printer className="size-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCycles} className="gap-1.5">
                <FileSpreadsheet className="size-3.5 text-emerald-500" /> Excel
              </Button>
            </div>
          </div>

          {cyclesError ? (
            <ErrorState
              title="Erreur"
              description={cyclesErr?.message}
              onRetry={() => refetchCycles()}
            />
          ) : (
            <DataTable
              columns={cycleColumns}
              data={cycles}
              isLoading={cyclesLoading}
              emptyMessage="Aucun cycle configuré. Commencez par créer un cycle."
              pagination
            />
          )}
        </TabsContent>

        <TabsContent value="levels" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 no-print">
            <Input
              placeholder="Rechercher un niveau…"
              value={levelSearch}
              onChange={(e) => setLevelSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={levelCycleFilter}
              onValueChange={(v) => setLevelCycleFilter(v ?? "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les cycles</SelectItem>
                {cycles.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => exportToPDF({ title: "Niveaux scolaires", filename: "niveaux" })} className="gap-1.5">
                <Printer className="size-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportLevels} className="gap-1.5">
                <FileSpreadsheet className="size-3.5 text-emerald-500" /> Excel
              </Button>
            </div>
          </div>

          {levelsError ? (
            <ErrorState
              title="Erreur"
              description={levelsErr?.message}
              onRetry={() => refetchLevels()}
            />
          ) : (
            <DataTable
              columns={levelColumns}
              data={levels}
              isLoading={levelsLoading}
              emptyMessage="Aucun niveau. Créez d'abord un cycle, puis ajoutez des niveaux."
              pagination
            />
          )}
        </TabsContent>
      </Tabs>

      <CycleFormDialog
        open={cycleFormOpen}
        onOpenChange={(open) => {
          setCycleFormOpen(open);
          if (!open) setEditingCycle(null);
        }}
        cycle={editingCycle}
        onSubmit={async (values) => {
          if (editingCycle) {
            await updateCycle.mutateAsync({ id: editingCycle.id, values: values as UpdateCycleInput });
          } else {
            await createCycle.mutateAsync(values as CreateCycleInput);
          }
          await refetchCycles();
          setCycleFormOpen(false);
          setEditingCycle(null);
        }}
        isLoading={createCycle.isPending || updateCycle.isPending}
      />

      <LevelFormDialog
        open={levelFormOpen}
        onOpenChange={(open) => {
          setLevelFormOpen(open);
          if (!open) setEditingLevel(null);
        }}
        level={editingLevel}
        defaultCycleId={levelCycleFilter !== "all" ? levelCycleFilter : undefined}
        onSubmit={async (values) => {
          if (editingLevel) {
            await updateLevel.mutateAsync({ id: editingLevel.id, values: values as UpdateLevelInput });
          } else {
            await createLevel.mutateAsync(values as CreateLevelInput);
          }
          await refetchLevels();
          setLevelFormOpen(false);
          setEditingLevel(null);
        }}
        isLoading={createLevel.isPending || updateLevel.isPending}
      />

      <ConfirmDialog
        open={!!deleteCycleTarget}
        onOpenChange={(open) => !open && setDeleteCycleTarget(null)}
        title="Supprimer ce cycle ?"
        description={`« ${deleteCycleTarget?.name} » sera supprimé. Cette action est impossible si des niveaux y sont rattachés.`}
        onConfirm={async () => {
          if (deleteCycleTarget) {
            await deleteCycle.mutateAsync(deleteCycleTarget.id);
            setDeleteCycleTarget(null);
          }
        }}
        isLoading={deleteCycle.isPending}
      />

      <ConfirmDialog
        open={!!deleteLevelTarget}
        onOpenChange={(open) => !open && setDeleteLevelTarget(null)}
        title="Supprimer ce niveau ?"
        description={`« ${deleteLevelTarget?.name} » sera supprimé. Impossible si des classes l'utilisent.`}
        onConfirm={async () => {
          if (deleteLevelTarget) {
            await deleteLevel.mutateAsync(deleteLevelTarget.id);
            setDeleteLevelTarget(null);
          }
        }}
        isLoading={deleteLevel.isPending}
      />
    </div>
  );
}
