"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  saveGradesSchema,
  type SaveGradesInput,
} from "./schemas";
import type { ActionResult, GradeWithRelations } from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "grades", action);
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

export async function fetchClassroomGradesAction(
  classroomId: string,
  subjectId: string,
  period: string,
  type: "test" | "exam" | "homework" | "oral" | "practical",
  establishmentId?: string
): Promise<ActionResult<GradeWithRelations[]>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    // 1. Fetch current academic year
    const { data: currentYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", estId)
      .eq("is_current", true)
      .maybeSingle();

    if (!currentYear) return { error: "Aucune année académique active configurée." };

    // 2. Fetch existing grades
    const { data: existingGrades, error: gradesErr } = await db
      .from("grades")
      .select("*, student:students(id, student_number, user:users(name))")
      .eq("establishment_id", estId)
      .eq("classroom_id", classroomId)
      .eq("subject_id", subjectId)
      .eq("period", period)
      .eq("type", type)
      .eq("academic_year_id", currentYear.id);

    if (gradesErr) return { error: gradesErr.message };

    // If grades already exist, return them
    if (existingGrades && existingGrades.length > 0) {
      return { success: true, data: existingGrades as GradeWithRelations[] };
    }

    // 3. If no grades exist, load all students in the classroom to start fresh
    const { data: classStudents, error: studentsErr } = await db
      .from("students")
      .select("id, student_number, user:users(name)")
      .eq("classroom_id", classroomId)
      .eq("status", "active");

    if (studentsErr) return { error: studentsErr.message };

    const initialGrades: GradeWithRelations[] = (classStudents ?? []).map((s: any) => ({
      id: "", // no grade ID yet
      establishment_id: estId,
      student_id: s.id,
      subject_id: subjectId,
      classroom_id: classroomId,
      academic_year_id: currentYear.id,
      period,
      value: 0, // start with 0 or fallback
      max_value: 20,
      coefficient: 1,
      type,
      comment: "",
      graded_by: authResult.session!.user.id,
      created_at: new Date().toISOString(),
      student: {
        id: s.id,
        student_number: s.student_number,
        user: {
          name: s.user?.name || "Sans nom",
        },
      },
    }));

    // Sort by student name
    initialGrades.sort((a, b) => {
      const nameA = a.student?.user?.name || "";
      const nameB = b.student?.user?.name || "";
      return nameA.localeCompare(nameB);
    });

    return { success: true, data: initialGrades };
  } catch {
    return { error: "Erreur lors du chargement de la grille des notes." };
  }
}

export async function saveGradesAction(
  values: SaveGradesInput
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("create"); // or edit
  if (authResult.error) return { error: authResult.error };

  const validated = saveGradesSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  const estId = authResult.session!.user.establishment_id;
  if (!estId) return { error: "Aucun établissement associé." };

  try {
    const db = await getDb();

    // Fetch active academic year
    const { data: currentYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", estId)
      .eq("is_current", true)
      .maybeSingle();

    if (!currentYear) return { error: "Aucune année académique active." };

    const { classroom_id, subject_id, period, type, coefficient, max_value, grades } = validated.data;
    const userId = authResult.session!.user.id;

    // Upsert each grade item
    for (const item of grades) {
      if (item.value < 0 || item.value > max_value) {
        return { error: `La note pour l'élève doit être comprise entre 0 et ${max_value}.` };
      }

      // Check if grade already exists
      const { data: existing } = await db
        .from("grades")
        .select("id")
        .eq("establishment_id", estId)
        .eq("classroom_id", classroom_id)
        .eq("subject_id", subject_id)
        .eq("student_id", item.student_id)
        .eq("period", period)
        .eq("type", type)
        .eq("academic_year_id", currentYear.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { error: updateErr } = await db
          .from("grades")
          .update({
            value: item.value,
            max_value,
            coefficient,
            comment: item.comment || null,
            graded_by: userId,
          })
          .eq("id", existing.id);

        if (updateErr) return { error: updateErr.message };
      } else {
        // Insert
        const { error: insertErr } = await db
          .from("grades")
          .insert({
            establishment_id: estId,
            student_id: item.student_id,
            subject_id,
            classroom_id,
            academic_year_id: currentYear.id,
            period,
            value: item.value,
            max_value,
            coefficient,
            type,
            comment: item.comment || null,
            graded_by: userId,
          });

        if (insertErr) return { error: insertErr.message };
      }
    }

    revalidatePath("/grades");
    return { success: true };
  } catch {
    return { error: "Erreur lors de l'enregistrement des notes." };
  }
}
