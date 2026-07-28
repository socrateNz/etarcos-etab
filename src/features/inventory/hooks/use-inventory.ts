"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOwnerStore } from "@/store/owner-store";
import {
  listInventoryItemsAction,
  createInventoryItemAction,
  updateInventoryItemAction,
  deleteInventoryItemAction,
  listStockMovementsAction,
  createStockMovementAction,
  getInventoryStatsAction,
} from "../actions";
import type { CreateItemInput, UpdateItemInput, CreateStockMovementInput, ListItemsInput } from "../schemas";

export const inventoryKeys = {
  all: ["inventory-module"] as const,
  items: (params?: Partial<ListItemsInput>, estId?: string) =>
    [...inventoryKeys.all, "items", params, estId] as const,
  movements: (itemId?: string, estId?: string) =>
    [...inventoryKeys.all, "movements", itemId, estId] as const,
  stats: (estId?: string) => [...inventoryKeys.all, "stats", estId] as const,
};

export function useInventoryStats(establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: inventoryKeys.stats(estId),
    queryFn: async () => {
      const result = await getInventoryStatsAction(estId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useInventoryItems(params: Partial<ListItemsInput> = {}, establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: inventoryKeys.items(params, estId),
    queryFn: async () => {
      const result = await listInventoryItemsAction(params, estId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: CreateItemInput) =>
      createInventoryItemAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success("Article ajouté à l'inventaire avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: UpdateItemInput) =>
      updateInventoryItemAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success("Article modifié avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (itemId: string) =>
      deleteInventoryItemAction(itemId, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success("Article supprimé de l'inventaire.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStockMovements(itemId?: string, establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: inventoryKeys.movements(itemId, estId),
    queryFn: async () => {
      const result = await listStockMovementsAction(itemId, estId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: CreateStockMovementInput) =>
      createStockMovementAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success("Mouvement de stock enregistré avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
