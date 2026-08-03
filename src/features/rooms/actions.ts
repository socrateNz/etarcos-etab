"use server";

import { resolveEstablishmentId, assertEstablishmentOwnership } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createRoomSchema,
  updateRoomSchema,
  listRoomsSchema,
  type CreateRoomInput,
  type UpdateRoomInput,
  type ListRoomsInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  Room,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "rooms", action);
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

// ========== ROOMS ==========

export async function listRooms(
  input: Partial<ListRoomsInput> = {}
): Promise<ActionResult<PaginatedResult<Room>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listRoomsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order, type, is_available } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db.from("rooms").select("*", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (type) query = query.eq("type", type);
    if (is_available !== undefined) query = query.eq("is_available", is_available);

    if (search) {
      query = query.or(`name.ilike.%${search}%,building.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["name", "capacity", "floor", "building", "created_at"].includes(sort_by)
        ? sort_by
        : "name";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: (data ?? []) as Room[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les salles." };
  }
}

export async function listRoomsOptions(
  establishmentId?: string
): Promise<ActionResult<Pick<Room, "id" | "name" | "capacity">[]>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId && authResult.session!.user.role !== "super_admin") {
    return { error: "Établissement requis." };
  }

  try {
    const db = await getDb();
    let query = db.from("rooms").select("id, name, capacity").eq("is_available", true).order("name");
    if (estId) query = query.eq("establishment_id", estId);

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { success: true, data: data ?? [] };
  } catch {
    return { error: "Impossible de charger les salles." };
  }
}

export async function createRoomAction(
  values: CreateRoomInput
): Promise<ActionResult<Room>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createRoomSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    validated.data.establishment_id
  );
  if (!estId) {
    return { error: "Aucun établissement associé à votre compte." };
  }

  try {
    const db = await getDb();
    const { data: existing } = await db
      .from("rooms")
      .select("id")
      .eq("establishment_id", estId)
      .eq("name", validated.data.name)
      .maybeSingle();

    if (existing) return { error: "Une salle avec ce nom existe déjà." };

    const { data, error } = await db
      .from("rooms")
      .insert({
        establishment_id: estId,
        name: validated.data.name,
        type: validated.data.type,
        capacity: validated.data.capacity,
        floor: validated.data.floor ?? null,
        building: validated.data.building || null,
        is_available: validated.data.is_available,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/rooms");
    return { success: true, data: data as Room };
  } catch {
    return { error: "Erreur lors de la création de la salle." };
  }
}

export async function updateRoomAction(
  id: string,
  values: UpdateRoomInput
): Promise<ActionResult<Room>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateRoomSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();

    const guard = await assertEstablishmentOwnership(
      db, "rooms", id, authResult.session!.user.establishment_id,
      "Salle introuvable.", "Vous n'avez pas accès à cette salle."
    );
    if ("error" in guard) return { error: guard.error };

    const payload = { ...validated.data };
    delete payload.establishment_id;

    // Check unique name constraint on update if changed
    if (payload.name) {
      const { data: currentRoom } = await db
        .from("rooms")
        .select("establishment_id, name")
        .eq("id", id)
        .maybeSingle();

      if (currentRoom && currentRoom.name !== payload.name) {
        const { data: existing } = await db
          .from("rooms")
          .select("id")
          .eq("establishment_id", currentRoom.establishment_id)
          .eq("name", payload.name)
          .maybeSingle();

        if (existing) return { error: "Une salle avec ce nom existe déjà." };
      }
    }

    const { data, error } = await db
      .from("rooms")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/rooms");
    return { success: true, data: data as Room };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteRoomAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();

    const { data: existing } = await db
      .from("rooms")
      .select("establishment_id")
      .eq("id", id)
      .maybeSingle();
    if (!existing) return { error: "Salle introuvable." };

    const estId = await resolveEstablishmentId(
      authResult.session!.user.establishment_id,
      existing.establishment_id
    );
    if (estId !== existing.establishment_id) {
      return { error: "Vous n'avez pas accès à cette salle." };
    }

    const { error } = await db.from("rooms").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/rooms");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}

export async function createRoomsBatchAction(
  items: {
    name: string;
    type?: "classroom" | "lab" | "library" | "gym" | "office" | "other";
    capacity?: number;
    building?: string;
    floor?: number;
  }[]
): Promise<ActionResult<Room[]>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  if (!items || items.length === 0) {
    return { error: "Veuillez spécifier au moins une salle." };
  }

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id
  );
  if (!estId) {
    return { error: "Aucun établissement associé à votre compte." };
  }

  try {
    const db = await getDb();
    const payload = items.map((item) => ({
      establishment_id: estId,
      name: item.name.trim(),
      type: item.type ?? "classroom",
      capacity: item.capacity ?? 40,
      building: item.building || null,
      floor: item.floor ?? 0,
      is_available: true,
    }));

    const { data, error } = await db
      .from("rooms")
      .insert(payload)
      .select();

    if (error) return { error: error.message };

    revalidatePath("/rooms");
    return { success: true, data: data as Room[] };
  } catch {
    return { error: "Erreur lors de la création groupée des salles." };
  }
}
