"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createTrackSchema,
  updateTrackSchema,
  listTracksSchema,
  type CreateTrackInput,
  type UpdateTrackInput,
  type ListTracksInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  Track,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "tracks", action);
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

// ========== TRACKS (FILIÈRES) ==========

export async function listTracks(
  input: Partial<ListTracksInput> = {}
): Promise<ActionResult<PaginatedResult<Track>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listTracksSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db.from("tracks").select("*", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["name", "code", "created_at"].includes(sort_by)
        ? sort_by
        : "created_at";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: (data ?? []) as Track[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les filières." };
  }
}

export async function listTracksOptions(
  establishmentId?: string
): Promise<ActionResult<Pick<Track, "id" | "name" | "code">[]>> {
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
    let query = db.from("tracks").select("id, name, code").order("name");
    if (estId) query = query.eq("establishment_id", estId);

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { success: true, data: data ?? [] };
  } catch {
    return { error: "Impossible de charger les filières." };
  }
}

export async function createTrackAction(
  values: CreateTrackInput
): Promise<ActionResult<Track>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createTrackSchema.safeParse(values);
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
      .from("tracks")
      .select("id")
      .eq("establishment_id", estId)
      .eq("code", validated.data.code.toUpperCase())
      .maybeSingle();

    if (existing) return { error: "Ce code de filière existe déjà." };

    const { data, error } = await db
      .from("tracks")
      .insert({
        establishment_id: estId,
        name: validated.data.name,
        code: validated.data.code.toUpperCase(),
        description: validated.data.description || null,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/tracks");
    return { success: true, data: data as Track };
  } catch {
    return { error: "Erreur lors de la création de la filière." };
  }
}

export async function updateTrackAction(
  id: string,
  values: UpdateTrackInput
): Promise<ActionResult<Track>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateTrackSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();
    const payload = { ...validated.data };
    if (payload.code) payload.code = payload.code.toUpperCase();
    delete payload.establishment_id;

    // Check unique code constraint on update if code is changing
    if (payload.code) {
      const { data: currentTrack } = await db
        .from("tracks")
        .select("establishment_id, code")
        .eq("id", id)
        .maybeSingle();

      if (currentTrack && currentTrack.code !== payload.code) {
        const { data: existing } = await db
          .from("tracks")
          .select("id")
          .eq("establishment_id", currentTrack.establishment_id)
          .eq("code", payload.code)
          .maybeSingle();

        if (existing) return { error: "Ce code de filière existe déjà." };
      }
    }

    const { data, error } = await db
      .from("tracks")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/tracks");
    return { success: true, data: data as Track };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteTrackAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { error } = await db.from("tracks").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/tracks");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}
