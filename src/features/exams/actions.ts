"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createExamSchema,
  updateExamSchema,
  listExamsSchema,
  type CreateExamInput,
  type UpdateExamInput,
  type ListExamsInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  Exam,
  ExamWithRelations,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "exams", action);
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

// ========== EXAMS ==========

export async function listExams(
  input: Partial<ListExamsInput> = {}
): Promise<ActionResult<PaginatedResult<ExamWithRelations>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listExamsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order, classroom_id, subject_id } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("exams")
      .select("*, classroom:classrooms(id, name), subject:subjects(id, name, code), room:rooms(id, name)", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (classroom_id) query = query.eq("classroom_id", classroom_id);
    if (subject_id) query = query.eq("subject_id", subject_id);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const sortColumn =
      sort_by && ["name", "exam_date", "created_at"].includes(sort_by)
        ? sort_by
        : "exam_date";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: (data ?? []) as ExamWithRelations[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les examens." };
  }
}

export async function createExamAction(
  values: CreateExamInput
): Promise<ActionResult<Exam>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createExamSchema.safeParse(values);
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

    // Resolve academic year
    let academicYearId = validated.data.academic_year_id;
    if (!academicYearId) {
      const { data: currentYear } = await db
        .from("academic_years")
        .select("id")
        .eq("establishment_id", estId)
        .eq("is_current", true)
        .maybeSingle();

      if (!currentYear) {
        return { error: "Aucune année académique active n'est configurée." };
      }
      academicYearId = currentYear.id;
    }

    const { name, classroom_id, subject_id, exam_date, start_time, end_time, room_id, max_score, coefficient } = validated.data;

    const { data, error } = await db
      .from("exams")
      .insert({
        establishment_id: estId,
        name,
        classroom_id: classroom_id || null,
        subject_id,
        academic_year_id: academicYearId,
        exam_date,
        start_time: start_time || null,
        end_time: end_time || null,
        room_id: room_id || null,
        max_score,
        coefficient,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/exams");
    return { success: true, data: data as Exam };
  } catch {
    return { error: "Erreur lors de la création de la session d'examen." };
  }
}

export async function updateExamAction(
  id: string,
  values: UpdateExamInput
): Promise<ActionResult<Exam>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateExamSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();
    const payload = { ...validated.data };
    delete payload.establishment_id;
    delete payload.academic_year_id;

    if (payload.classroom_id === "") payload.classroom_id = null;
    if (payload.room_id === "") payload.room_id = null;
    if (payload.start_time === "") payload.start_time = null;
    if (payload.end_time === "") payload.end_time = null;

    const { data, error } = await db
      .from("exams")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/exams");
    return { success: true, data: data as Exam };
  } catch {
    return { error: "Erreur lors de la mise à jour de l'examen." };
  }
}

export async function deleteExamAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { error } = await db.from("exams").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/exams");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression de l'examen." };
  }
}
