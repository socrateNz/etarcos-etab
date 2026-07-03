"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createCycleSchema,
  updateCycleSchema,
  createLevelSchema,
  updateLevelSchema,
  listCyclesSchema,
  listLevelsSchema,
  type CreateCycleInput,
  type UpdateCycleInput,
  type CreateLevelInput,
  type UpdateLevelInput,
  type ListCyclesInput,
  type ListLevelsInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  CycleWithLevelsCount,
  LevelWithCycle,
} from "./types";
import type { Cycle, Level } from "@/types/database";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "cycles", action);
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

// ========== CYCLES ==========

export async function listCycles(
  input: Partial<ListCyclesInput> = {}
): Promise<ActionResult<PaginatedResult<CycleWithLevelsCount>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listCyclesSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db.from("cycles").select("*", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["name", "code", "order", "created_at"].includes(sort_by)
        ? sort_by
        : "order";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const cycles = (data ?? []) as Cycle[];
    const withCounts: CycleWithLevelsCount[] = await Promise.all(
      cycles.map(async (cycle) => {
        const { count: levelsCount } = await db
          .from("levels")
          .select("id", { count: "exact", head: true })
          .eq("cycle_id", cycle.id);
        return { ...cycle, levels_count: levelsCount ?? 0 };
      })
    );

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: withCounts,
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les cycles." };
  }
}

export async function listCyclesOptions(
  establishmentId?: string
): Promise<ActionResult<Pick<Cycle, "id" | "name" | "code">[]>> {
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
    let query = db.from("cycles").select("id, name, code").order("order");
    if (estId) query = query.eq("establishment_id", estId);

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { success: true, data: data ?? [] };
  } catch {
    return { error: "Impossible de charger les cycles." };
  }
}

export async function createCycleAction(
  values: CreateCycleInput
): Promise<ActionResult<Cycle>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createCycleSchema.safeParse(values);
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
      .from("cycles")
      .select("id")
      .eq("establishment_id", estId)
      .eq("code", validated.data.code)
      .maybeSingle();

    if (existing) return { error: "Ce code cycle existe déjà." };

    const { data, error } = await db
      .from("cycles")
      .insert({
        establishment_id: estId,
        name: validated.data.name,
        code: validated.data.code.toUpperCase(),
        description: validated.data.description || null,
        order: validated.data.order,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/cycles");
    return { success: true, data: data as Cycle };
  } catch {
    return { error: "Erreur lors de la création du cycle." };
  }
}

export async function updateCycleAction(
  id: string,
  values: UpdateCycleInput
): Promise<ActionResult<Cycle>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateCycleSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();
    const payload = { ...validated.data };
    if (payload.code) payload.code = payload.code.toUpperCase();
    delete payload.establishment_id;

    const { data, error } = await db
      .from("cycles")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/cycles");
    return { success: true, data: data as Cycle };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteCycleAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { count } = await db
      .from("levels")
      .select("id", { count: "exact", head: true })
      .eq("cycle_id", id);

    if (count && count > 0) {
      return {
        error: "Impossible de supprimer : des niveaux sont rattachés à ce cycle.",
      };
    }

    const { error } = await db.from("cycles").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/cycles");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}

// ========== LEVELS ==========

export async function listLevels(
  input: Partial<ListLevelsInput> = {}
): Promise<ActionResult<PaginatedResult<LevelWithCycle>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listLevelsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order, cycle_id } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("levels")
      .select("*, cycle:cycles(id, name, code)", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (cycle_id) query = query.eq("cycle_id", cycle_id);
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["name", "code", "order", "created_at"].includes(sort_by)
        ? sort_by
        : "order";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: (data ?? []) as LevelWithCycle[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les niveaux." };
  }
}

export async function createLevelAction(
  values: CreateLevelInput
): Promise<ActionResult<Level>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createLevelSchema.safeParse(values);
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
    const { data: cycle } = await db
      .from("cycles")
      .select("id, establishment_id")
      .eq("id", validated.data.cycle_id)
      .maybeSingle();

    if (!cycle || cycle.establishment_id !== estId) {
      return { error: "Cycle invalide pour cet établissement." };
    }

    const { data: existing } = await db
      .from("levels")
      .select("id")
      .eq("establishment_id", estId)
      .eq("code", validated.data.code)
      .maybeSingle();

    if (existing) return { error: "Ce code niveau existe déjà." };

    const { data, error } = await db
      .from("levels")
      .insert({
        establishment_id: estId,
        cycle_id: validated.data.cycle_id,
        name: validated.data.name,
        code: validated.data.code.toUpperCase(),
        order: validated.data.order,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/cycles");
    return { success: true, data: data as Level };
  } catch {
    return { error: "Erreur lors de la création du niveau." };
  }
}

export async function updateLevelAction(
  id: string,
  values: UpdateLevelInput
): Promise<ActionResult<Level>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateLevelSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();
    const payload = { ...validated.data };
    if (payload.code) payload.code = payload.code.toUpperCase();
    delete payload.establishment_id;

    const { data, error } = await db
      .from("levels")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/cycles");
    return { success: true, data: data as Level };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteLevelAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { count } = await db
      .from("classrooms")
      .select("id", { count: "exact", head: true })
      .eq("level_id", id);

    if (count && count > 0) {
      return {
        error: "Impossible de supprimer : des classes utilisent ce niveau.",
      };
    }

    const { error } = await db.from("levels").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/cycles");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}
