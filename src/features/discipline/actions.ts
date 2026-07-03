"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createDisciplineRecordSchema,
  updateDisciplineRecordSchema,
  listDisciplineRecordsSchema,
  type CreateDisciplineRecordInput,
  type UpdateDisciplineRecordInput,
  type ListDisciplineRecordsInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  DisciplineRecord,
  DisciplineRecordWithRelations,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "discipline", action);
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

// ========== ACTIONS ==========

export async function listDisciplineRecords(
  input: Partial<ListDisciplineRecordsInput> = {}
): Promise<ActionResult<PaginatedResult<DisciplineRecordWithRelations>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listDisciplineRecordsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres de recherche invalides." };

  const { page, per_page, search, sort_by, sort_order, student_id, level } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("discipline_records")
      .select("*, student:students(id, student_number, user:users(name), classroom:classrooms(id, name)), recorder:users(id, name)", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (student_id) query = query.eq("student_id", student_id);
    if (level) query = query.eq("level", level);

    if (search) {
      query = query.or(`reason.ilike.%${search}%,decision.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["incident_date", "level", "created_at"].includes(sort_by)
        ? sort_by
        : "incident_date";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: (data ?? []) as DisciplineRecordWithRelations[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les rapports disciplinaires." };
  }
}

export async function createDisciplineRecordAction(
  values: CreateDisciplineRecordInput
): Promise<ActionResult<DisciplineRecord>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createDisciplineRecordSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    validated.data.establishment_id
  );
  if (!estId) return { error: "Aucun établissement associé." };

  try {
    const db = await getDb();

    // Resolve current academic year
    const { data: currentYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", estId)
      .eq("is_current", true)
      .maybeSingle();

    if (!currentYear) return { error: "Aucune année académique active n'est configurée." };

    const { student_id, level, reason, decision, incident_date, duration_days } = validated.data;
    const userId = authResult.session!.user.id;

    const { data, error } = await db
      .from("discipline_records")
      .insert({
        establishment_id: estId,
        student_id,
        academic_year_id: currentYear.id,
        level,
        reason,
        decision: decision || null,
        incident_date,
        duration_days: level === "suspension" ? (duration_days || null) : null,
        recorded_by: userId,
        status: "active",
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/discipline");
    return { success: true, data: data as DisciplineRecord };
  } catch {
    return { error: "Erreur lors de l'enregistrement de l'incident." };
  }
}

export async function updateDisciplineRecordAction(
  id: string,
  values: UpdateDisciplineRecordInput
): Promise<ActionResult<DisciplineRecord>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateDisciplineRecordSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();
    const payload = { ...validated.data };
    delete payload.establishment_id;

    if (payload.decision === "") payload.decision = null;
    if (payload.level && payload.level !== "suspension") {
      payload.duration_days = null;
    }

    const { data, error } = await db
      .from("discipline_records")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/discipline");
    return { success: true, data: data as DisciplineRecord };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteDisciplineRecordAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { error } = await db.from("discipline_records").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/discipline");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}
