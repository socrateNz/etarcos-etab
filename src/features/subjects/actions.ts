"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createSubjectSchema,
  updateSubjectSchema,
  listSubjectsSchema,
  type CreateSubjectInput,
  type UpdateSubjectInput,
  type ListSubjectsInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  Subject,
  SubjectWithTrack,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "subjects", action);
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

// ========== SUBJECTS ==========

export async function listSubjects(
  input: Partial<ListSubjectsInput> = {}
): Promise<ActionResult<PaginatedResult<SubjectWithTrack>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listSubjectsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order, track_id } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("subjects")
      .select("*, track:tracks(id, name, code)", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (track_id) query = query.eq("track_id", track_id);
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["name", "code", "coefficient", "created_at"].includes(sort_by)
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
        data: (data ?? []) as SubjectWithTrack[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les matières." };
  }
}

export async function listSubjectsOptions(
  establishmentId?: string
): Promise<ActionResult<Pick<Subject, "id" | "name" | "code">[]>> {
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
    let query = db.from("subjects").select("id, name, code").order("name");
    if (estId) query = query.eq("establishment_id", estId);

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { success: true, data: data ?? [] };
  } catch {
    return { error: "Impossible de charger les matières." };
  }
}

export async function createSubjectAction(
  values: CreateSubjectInput
): Promise<ActionResult<Subject>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createSubjectSchema.safeParse(values);
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
      .from("subjects")
      .select("id")
      .eq("establishment_id", estId)
      .eq("code", validated.data.code.toUpperCase())
      .maybeSingle();

    if (existing) return { error: "Ce code de matière existe déjà." };

    const { data, error } = await db
      .from("subjects")
      .insert({
        establishment_id: estId,
        name: validated.data.name,
        code: validated.data.code.toUpperCase(),
        coefficient: validated.data.coefficient,
        color: validated.data.color || null,
        description: validated.data.description || null,
        track_id: validated.data.track_id || null,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/subjects");
    return { success: true, data: data as Subject };
  } catch {
    return { error: "Erreur lors de la création de la matière." };
  }
}

export async function updateSubjectAction(
  id: string,
  values: UpdateSubjectInput
): Promise<ActionResult<Subject>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateSubjectSchema.safeParse(values);
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
      const { data: currentSubject } = await db
        .from("subjects")
        .select("establishment_id, code")
        .eq("id", id)
        .maybeSingle();

      if (currentSubject && currentSubject.code !== payload.code) {
        const { data: existing } = await db
          .from("subjects")
          .select("id")
          .eq("establishment_id", currentSubject.establishment_id)
          .eq("code", payload.code)
          .maybeSingle();

        if (existing) return { error: "Ce code de matière existe déjà." };
      }
    }

    const { data, error } = await db
      .from("subjects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/subjects");
    return { success: true, data: data as Subject };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteSubjectAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { error } = await db.from("subjects").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/subjects");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}
