"use client";

import { useState } from "react";
import { Package, Plus, Search, ArrowDownUp, AlertTriangle, Layers, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  useInventoryItems,
  useInventoryStats,
  useStockMovements,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useCreateStockMovement,
} from "../hooks/use-inventory";
import { ItemFormDialog } from "./item-form-dialog";
import { MovementFormDialog } from "./movement-form-dialog";
import type { Item, MovementWithRelations } from "../types";
import type { CreateItemInput, UpdateItemInput, CreateStockMovementInput } from "../schemas";

export function InventoryPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("items");
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item?: Item }>({ open: false });
  const [movementDialog, setMovementDialog] = useState<{ open: boolean; item?: Item }>({ open: false });
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data: stats, isLoading: statsLoading } = useInventoryStats();
  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useInventoryItems({
    search: search || undefined,
    low_stock_only: lowStockOnly || undefined,
  });
  const { data: movements, isLoading: movementsLoading } = useStockMovements();

  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const createMovement = useCreateStockMovement();

  const items = itemsData?.data ?? [];

  const handleSaveItem = async (values: CreateItemInput | UpdateItemInput) => {
    if ("id" in values && values.id) {
      const result = await updateItem.mutateAsync(values as UpdateItemInput);
      if (!result.error) setItemDialog({ open: false });
    } else {
      const result = await createItem.mutateAsync(values as CreateItemInput);
      if (!result.error) setItemDialog({ open: false });
    }
  };

  const handleCreateMovement = async (values: CreateStockMovementInput) => {
    const result = await createMovement.mutateAsync(values);
    if (!result.error) setMovementDialog({ open: false });
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;
    await deleteItem.mutateAsync(deleteItemId);
    setDeleteItemId(null);
  };

  const getMovementBadge = (type: string, quantity: number) => {
    switch (type) {
      case "purchase":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><TrendingUp className="h-3 w-3 mr-1" /> Achat (+{quantity})</Badge>;
      case "return":
        return <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20"><TrendingUp className="h-3 w-3 mr-1" /> Retour (+{quantity})</Badge>;
      case "usage":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><TrendingDown className="h-3 w-3 mr-1" /> Consommation ({quantity})</Badge>;
      case "loss":
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20"><TrendingDown className="h-3 w-3 mr-1" /> Perte ({quantity})</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventaire & Matériel"
        description="Gestion du stock, des équipements et des mouvements de matériel"
        icon={Package}
        actions={
          <Button onClick={() => setItemDialog({ open: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Articles référencés", value: stats?.total_items, icon: Package, color: "text-brand-500", onClick: undefined, active: false },
          { label: "Unités en stock", value: stats?.total_units, icon: Layers, color: "text-emerald-500", onClick: undefined, active: false },
          { label: "Stock faible (≤ 5)", value: stats?.low_stock_items, icon: AlertTriangle, color: "text-rose-500", onClick: () => { setTab("items"); setLowStockOnly(!lowStockOnly); }, active: lowStockOnly },
          { label: "Mouvements enregistrés", value: stats?.recent_movements_count, icon: ArrowDownUp, color: "text-cyan-500", onClick: undefined, active: false },
        ].map((card) => (
          <Card
            key={card.label}
            onClick={card.onClick}
            className={`transition-all ${card.onClick ? "cursor-pointer hover:border-rose-500/50" : ""} ${card.active ? "border-rose-500 bg-rose-500/5" : ""}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  {statsLoading ? (
                    <Skeleton className="h-6 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{card.value ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="items">Articles en Stock</TabsTrigger>
          <TabsTrigger value="movements">Mouvements de Stock</TabsTrigger>
        </TabsList>

        {/* ===== ARTICLES ===== */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, code, catégorie..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant={lowStockOnly ? "destructive" : "outline"}
              size="sm"
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className="text-xs gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {lowStockOnly ? "Tout afficher" : "Stock faible (≤ 5)"}
            </Button>
          </div>

          {itemsError ? (
            <ErrorState message="Impossible de charger l'inventaire." />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Quantité en stock</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead>Emplacement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        {search ? "Aucun article trouvé." : "Inventaire vide. Enregistrez votre premier matériel."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} className={item.quantity <= 5 ? "bg-rose-500/5" : ""}>
                        <TableCell className="font-mono text-xs font-semibold">{item.code}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {item.category ? (
                            <Badge variant="outline">{item.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          <Badge
                            variant={item.quantity > 5 ? "default" : "destructive"}
                            className={item.quantity > 5
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20"}
                          >
                            {item.quantity <= 5 && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                        <TableCell className="text-sm">{item.location ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setMovementDialog({ open: true, item })}
                            >
                              <ArrowDownUp className="h-3 w-3 mr-1" />
                              Mouvement
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7"
                              onClick={() => setItemDialog({ open: true, item })}
                            >
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteItemId(item.id)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ===== MOUVEMENTS ===== */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Mouvement</TableHead>
                  <TableHead>Motif / Remarques</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (movements ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      Aucun mouvement de stock enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  (movements ?? []).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">{formatDate(m.created_at)}</TableCell>
                      <TableCell className="font-medium">
                        {(m.item as any)?.name ?? "—"} <span className="font-mono text-xs text-muted-foreground">({(m.item as any)?.code})</span>
                      </TableCell>
                      <TableCell>{getMovementBadge(m.type, m.quantity)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.description ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ItemFormDialog
        open={itemDialog.open}
        item={itemDialog.item}
        onClose={() => setItemDialog({ open: false })}
        onSubmit={handleSaveItem}
        isLoading={createItem.isPending || updateItem.isPending}
      />

      <MovementFormDialog
        open={movementDialog.open}
        item={movementDialog.item}
        onClose={() => setMovementDialog({ open: false })}
        onSubmit={handleCreateMovement}
        isLoading={createMovement.isPending}
      />

      <ConfirmDialog
        open={!!deleteItemId}
        onOpenChange={(v) => !v && setDeleteItemId(null)}
        title="Supprimer cet article ?"
        description="Cette action est irréversible. L'article sera définitivement retiré de l'inventaire."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDeleteItem}
        isLoading={deleteItem.isPending}
      />
    </div>
  );
}
