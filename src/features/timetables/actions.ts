"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createLessonSchema,
  updateLessonSchema,
  listLessonsSchema,
  type CreateLessonInput,
  type UpdateLessonInput,
  type ListLessonsInput,
} from "./schemas";
import type {
  ActionResult,
  Lesson,
  LessonWithRelations,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "timetables", action);
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

function toMin(timeStr: string): number {
  const parts = timeStr.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

function checkOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return toMin(s1) < toMin(e2) && toMin(e1) > toMin(s2);
}

// ========== ACTIONS ==========

export async function listLessons(
  input: Partial<ListLessonsInput> = {}
): Promise<ActionResult<LessonWithRelations[]>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listLessonsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres de recherche invalides." };

  const { classroom_id, teacher_id, room_id } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("lessons")
      .select("*, classroom:classrooms(id, name), subject:subjects(id, name, code, color), teacher:users(id, name, email), room:rooms(id, name)");

    if (estId) query = query.eq("establishment_id", estId);
    if (classroom_id) query = query.eq("classroom_id", classroom_id);
    if (teacher_id) query = query.eq("teacher_id", teacher_id);
    if (room_id) query = query.eq("room_id", room_id);

    // Resolve academic year if not explicitly passed
    let academicYearId = parsed.data.academic_year_id;
    if (!academicYearId && estId) {
      const { data: currentYear } = await db
        .from("academic_years")
        .select("id")
        .eq("establishment_id", estId)
        .eq("is_current", true)
        .maybeSingle();

      if (currentYear) {
        academicYearId = currentYear.id;
      }
    }

    if (academicYearId) {
      query = query.eq("academic_year_id", academicYearId);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };

    return { success: true, data: (data ?? []) as LessonWithRelations[] };
  } catch {
    return { error: "Impossible de charger les leçons." };
  }
}

export async function createLessonAction(
  values: CreateLessonInput
): Promise<ActionResult<Lesson>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createLessonSchema.safeParse(values);
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

    // Resolve current academic year
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

    const { classroom_id, subject_id, teacher_id, room_id, day_of_week, start_time, end_time } = validated.data;

    // 1. Conflict detection query
    const { data: conflicts } = await db
      .from("lessons")
      .select("id, classroom_id, teacher_id, room_id, start_time, end_time, classroom:classrooms(name), subject:subjects(name)")
      .eq("establishment_id", estId)
      .eq("academic_year_id", academicYearId)
      .eq("day_of_week", day_of_week);

    for (const c of (conflicts ?? [])) {
      if (checkOverlap(c.start_time, c.end_time, start_time, end_time)) {
        if (c.classroom_id === classroom_id) {
          return { error: `La classe a déjà un cours de « ${c.subject?.name || "Cours"} » programmé à cette heure.` };
        }
        if (c.teacher_id === teacher_id) {
          return { error: `Cet enseignant dispense déjà un cours sur ce créneau horaire.` };
        }
        if (room_id && c.room_id === room_id) {
          return { error: `La salle de classe sélectionnée est occupée par un autre cours sur ce créneau.` };
        }
      }
    }

    // 2. Insert lesson
    const { data, error } = await db
      .from("lessons")
      .insert({
        establishment_id: estId,
        classroom_id,
        subject_id,
        teacher_id,
        room_id: room_id || null,
        academic_year_id: academicYearId,
        day_of_week,
        start_time,
        end_time,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/timetables");
    return { success: true, data: data as Lesson };
  } catch {
    return { error: "Erreur lors de la programmation du cours." };
  }
}

export async function updateLessonAction(
  id: string,
  values: UpdateLessonInput
): Promise<ActionResult<Lesson>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateLessonSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();

    const { data: currentLesson } = await db
      .from("lessons")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!currentLesson) return { error: "Cours introuvable." };

    const payload = { ...validated.data };
    delete payload.establishment_id;
    delete payload.academic_year_id;

    // Merge changes
    const merged = {
      classroom_id: payload.classroom_id || currentLesson.classroom_id,
      subject_id: payload.subject_id || currentLesson.subject_id,
      teacher_id: payload.teacher_id || currentLesson.teacher_id,
      room_id: payload.room_id === undefined ? currentLesson.room_id : (payload.room_id || null),
      day_of_week: payload.day_of_week || currentLesson.day_of_week,
      start_time: payload.start_time || currentLesson.start_time,
      end_time: payload.end_time || currentLesson.end_time,
    };

    // 1. Conflict detection query excluding current lesson
    const { data: conflicts } = await db
      .from("lessons")
      .select("id, classroom_id, teacher_id, room_id, start_time, end_time, classroom:classrooms(name), subject:subjects(name)")
      .eq("establishment_id", currentLesson.establishment_id)
      .eq("academic_year_id", currentLesson.academic_year_id)
      .eq("day_of_week", merged.day_of_week)
      .neq("id", id);

    for (const c of (conflicts ?? [])) {
      if (checkOverlap(c.start_time, c.end_time, merged.start_time, merged.end_time)) {
        if (c.classroom_id === merged.classroom_id) {
          return { error: `La classe a déjà un cours de « ${c.subject?.name || "Cours"} » programmé à cette heure.` };
        }
        if (c.teacher_id === merged.teacher_id) {
          return { error: `Cet enseignant dispense déjà un cours sur ce créneau horaire.` };
        }
        if (merged.room_id && c.room_id === merged.room_id) {
          return { error: `La salle de classe sélectionnée est occupée par un autre cours sur ce créneau.` };
        }
      }
    }

    // 2. Update lesson
    const { data, error } = await db
      .from("lessons")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/timetables");
    return { success: true, data: data as Lesson };
  } catch {
    return { error: "Erreur lors de la mise à jour du cours." };
  }
}

export async function deleteLessonAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { error } = await db.from("lessons").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/timetables");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression du cours." };
  }
}
