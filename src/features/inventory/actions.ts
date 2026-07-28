"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createItemSchema,
  updateItemSchema,
  createStockMovementSchema,
  listItemsSchema,
  type CreateItemInput,
  type UpdateItemInput,
  type CreateStockMovementInput,
  type ListItemsInput,
} from "./schemas";
import type { ActionResult, Item, MovementWithRelations, PaginatedResult } from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "inventory", action);
}

async function requireAuth(action: CrudAction) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." as const };
  if (!can(session.user.role, session.user.permissions, action)) {
    return { error: "Permission refusée." as const };
  }
  return { session };
}

async function getDb() {
  return (await createAdminClient()) as any;
}

// ========== ITEMS ==========

export async function listInventoryItemsAction(
  params: ListItemsInput = {},
  establishmentId?: string
): Promise<ActionResult<PaginatedResult<Item>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = listItemsSchema.safeParse(params);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Paramètres invalides." };

  const { search, category, low_stock_only, page, page_size } = validated.data;
  const offset = (page - 1) * page_size;

  try {
    const db = await getDb();

    let query = db
      .from("inventory_items")
      .select("*", { count: "exact" })
      .eq("establishment_id", estId);

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (low_stock_only) {
      query = query.lte("quantity", 5);
    }

    const { data, count, error } = await query
      .order("name", { ascending: true })
      .range(offset, offset + page_size - 1);

    if (error) return { error: error.message };

    return {
      success: true,
      data: {
        data: (data ?? []) as Item[],
        total: count ?? 0,
        page,
        pageSize: page_size,
      },
    };
  } catch {
    return { error: "Erreur lors du chargement de l'inventaire." };
  }
}

export async function createInventoryItemAction(
  values: CreateItemInput,
  establishmentId?: string
): Promise<ActionResult<Item>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = createItemSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = await getDb();
    const { data, error } = await db
      .from("inventory_items")
      .insert({
        ...validated.data,
        establishment_id: estId,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath("/inventory");
    return { success: true, data: data as Item };
  } catch {
    return { error: "Erreur lors de la création de l'article." };
  }
}

export async function updateInventoryItemAction(
  values: UpdateItemInput,
  establishmentId?: string
): Promise<ActionResult<Item>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = updateItemSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  const { id, ...rest } = validated.data;

  try {
    const db = await getDb();
    const { data, error } = await db
      .from("inventory_items")
      .update(rest)
      .eq("id", id)
      .eq("establishment_id", estId)
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath("/inventory");
    return { success: true, data: data as Item };
  } catch {
    return { error: "Erreur lors de la modification de l'article." };
  }
}

export async function deleteInventoryItemAction(
  itemId: string,
  establishmentId?: string
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();
    const { error } = await db
      .from("inventory_items")
      .delete()
      .eq("id", itemId)
      .eq("establishment_id", estId);

    if (error) return { error: error.message };
    revalidatePath("/inventory");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression de l'article." };
  }
}

// ========== MOVEMENTS ==========

export async function listStockMovementsAction(
  itemId?: string,
  establishmentId?: string
): Promise<ActionResult<MovementWithRelations[]>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    let query = db
      .from("stock_movements")
      .select("*, item:inventory_items(id, name, code), recorded_by_user:users!stock_movements_recorded_by_fkey(id, name)")
      .eq("establishment_id", estId)
      .order("created_at", { ascending: false });

    if (itemId) {
      query = query.eq("item_id", itemId);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { success: true, data: (data ?? []) as MovementWithRelations[] };
  } catch {
    return { error: "Erreur lors du chargement des mouvements de stock." };
  }
}

export async function createStockMovementAction(
  values: CreateStockMovementInput,
  establishmentId?: string
): Promise<ActionResult<MovementWithRelations>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = createStockMovementSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = await getDb();
    const userId = authResult.session!.user.id;

    // The Postgres trigger trg_sync_inventory_quantity automatically updates inventory_items.quantity
    const { data, error } = await db
      .from("stock_movements")
      .insert({
        ...validated.data,
        establishment_id: estId,
        recorded_by: userId,
      })
      .select("*, item:inventory_items(id, name, code)")
      .single();

    if (error) return { error: error.message };
    revalidatePath("/inventory");
    return { success: true, data: data as MovementWithRelations };
  } catch {
    return { error: "Erreur lors de l'enregistrement du mouvement de stock." };
  }
}

export async function getInventoryStatsAction(
  establishmentId?: string
): Promise<ActionResult<{
  total_items: number;
  total_units: number;
  low_stock_items: number;
  recent_movements_count: number;
}>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    const [{ count: total_items }, { data: itemsData }, { count: low_stock_items }, { count: recent_movements }] =
      await Promise.all([
        db.from("inventory_items").select("*", { count: "exact", head: true }).eq("establishment_id", estId),
        db.from("inventory_items").select("quantity").eq("establishment_id", estId),
        db.from("inventory_items").select("*", { count: "exact", head: true }).eq("establishment_id", estId).lte("quantity", 5),
        db.from("stock_movements").select("*", { count: "exact", head: true }).eq("establishment_id", estId),
      ]);

    const total_units = (itemsData ?? []).reduce((sum: number, i: any) => sum + (i.quantity ?? 0), 0);

    return {
      success: true,
      data: {
        total_items: total_items ?? 0,
        total_units,
        low_stock_items: low_stock_items ?? 0,
        recent_movements_count: recent_movements ?? 0,
      },
    };
  } catch {
    return { error: "Erreur lors du calcul des statistiques d'inventaire." };
  }
}
