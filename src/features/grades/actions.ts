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

// ========== AVERAGES ==========

/**
 * Calcule la moyenne pondérée d'un élève pour une période donnée
 * en appelant la fonction Postgres calculate_student_average()
 */
export async function getStudentAverageAction(
  studentId: string,
  period: string,
  establishmentId?: string
): Promise<ActionResult<{ average: number | null; mention: string | null }>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    const { data: currentYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", estId)
      .eq("is_current", true)
      .maybeSingle();

    if (!currentYear) return { error: "Aucune année académique active." };

    const { data, error } = await db.rpc("calculate_student_average", {
      p_student_id: studentId,
      p_academic_year_id: currentYear.id,
      p_period: period,
    });

    if (error) return { error: error.message };

    const average = data as number | null;
    let mention: string | null = null;
    if (average !== null) {
      if (average >= 16) mention = "Très Bien";
      else if (average >= 14) mention = "Bien";
      else if (average >= 12) mention = "Assez Bien";
      else if (average >= 10) mention = "Passable";
      else mention = "Insuffisant";
    }

    return { success: true, data: { average, mention } };
  } catch {
    return { error: "Erreur lors du calcul de la moyenne." };
  }
}

/**
 * Retourne la liste des élèves d'une classe avec leur moyenne pour une période
 */
export async function getClassroomAveragesAction(
  classroomId: string,
  period: string,
  establishmentId?: string
): Promise<
  ActionResult<
    Array<{
      student_id: string;
      student_number: string;
      student_name: string;
      average: number | null;
      mention: string | null;
      rank: number | null;
    }>
  >
> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    const { data: currentYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", estId)
      .eq("is_current", true)
      .maybeSingle();

    if (!currentYear) return { error: "Aucune année académique active." };

    // Fetch students in classroom
    const { data: students, error: studErr } = await db
      .from("students")
      .select("id, student_number, user:users(name)")
      .eq("classroom_id", classroomId)
      .eq("status", "active");

    if (studErr) return { error: studErr.message };

    // Compute average for each student via Postgres function
    const results: Array<{
      student_id: string;
      student_number: string;
      student_name: string;
      average: number | null;
      mention: string | null;
      rank: number | null;
    }> = [];

    for (const s of students ?? []) {
      const { data: avg } = await db.rpc("calculate_student_average", {
        p_student_id: s.id,
        p_academic_year_id: currentYear.id,
        p_period: period,
      });

      const average = avg as number | null;
      let mention: string | null = null;
      if (average !== null) {
        if (average >= 16) mention = "Très Bien";
        else if (average >= 14) mention = "Bien";
        else if (average >= 12) mention = "Assez Bien";
        else if (average >= 10) mention = "Passable";
        else mention = "Insuffisant";
      }

      results.push({
        student_id: s.id,
        student_number: s.student_number,
        student_name: (s.user as any)?.name ?? "Sans nom",
        average,
        mention,
        rank: null, // will be computed after sorting
      });
    }

    // Rank by descending average (null last)
    results.sort((a, b) => {
      if (a.average === null && b.average === null) return 0;
      if (a.average === null) return 1;
      if (b.average === null) return -1;
      return b.average - a.average;
    });

    results.forEach((r, i) => {
      r.rank = r.average !== null ? i + 1 : null;
    });

    return { success: true, data: results };
  } catch {
    return { error: "Erreur lors du calcul des moyennes de la classe." };
  }
}

/**
 * Supprime une note individuelle
 */
export async function deleteGradeAction(
  gradeId: string
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { error } = await db.from("grades").delete().eq("id", gradeId);
    if (error) return { error: error.message };
    revalidatePath("/grades");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression de la note." };
  }
}

export interface StudentSubjectReport {
  subject_id: string;
  subject: string;
  coef: number;
  average: number | null;
  classMin: number | null;
  classMax: number | null;
  appreciation: string;
}

export async function getStudentReportCardDetailsAction(
  studentId: string,
  classroomId: string,
  period: string,
  establishmentId?: string
): Promise<ActionResult<StudentSubjectReport[]>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    const { data: currentYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", estId)
      .eq("is_current", true)
      .maybeSingle();

    if (!currentYear) return { error: "Aucune année académique active." };

    const { data: subjectsData } = await db
      .from("subjects")
      .select("id, name, coefficient")
      .eq("establishment_id", estId)
      .order("name");

    const subjects = subjectsData ?? [];

    const { data: classroomGrades } = await db
      .from("grades")
      .select("student_id, subject_id, grade_value, coefficient")
      .eq("establishment_id", estId)
      .eq("classroom_id", classroomId)
      .eq("period", period)
      .eq("academic_year_id", currentYear.id);

    const grades = classroomGrades ?? [];

    const defaultSubjects = [
      { id: "math", name: "Mathématiques", coefficient: 4 },
      { id: "pc", name: "Physique-Chimie", coefficient: 3 },
      { id: "fr", name: "Français", coefficient: 3 },
      { id: "ang", name: "Anglais", coefficient: 2 },
      { id: "hg", name: "Histoire-Géographie", coefficient: 2 },
      { id: "svt", name: "SVT", coefficient: 2 },
      { id: "eps", name: "EPS", coefficient: 1 },
    ];

    const subjectsToProcess = subjects.length > 0 ? subjects : defaultSubjects;

    const reportMatrix: StudentSubjectReport[] = subjectsToProcess.map((sub: any) => {
      const subGrades = grades.filter((g: any) => g.subject_id === sub.id);

      const studentAvgMap: Record<string, { totalPoints: number; totalCoef: number }> = {};
      subGrades.forEach((g: any) => {
        const coef = g.coefficient || sub.coefficient || 1;
        if (!studentAvgMap[g.student_id]) {
          studentAvgMap[g.student_id] = { totalPoints: 0, totalCoef: 0 };
        }
        studentAvgMap[g.student_id].totalPoints += Number(g.grade_value) * coef;
        studentAvgMap[g.student_id].totalCoef += coef;
      });

      const averagesList: number[] = Object.values(studentAvgMap)
        .map((calc) => (calc.totalCoef > 0 ? Math.round((calc.totalPoints / calc.totalCoef) * 10) / 10 : null))
        .filter((val): val is number => val !== null);

      const targetStudentCalc = studentAvgMap[studentId];
      const targetStudentAvg = targetStudentCalc && targetStudentCalc.totalCoef > 0
        ? Math.round((targetStudentCalc.totalPoints / targetStudentCalc.totalCoef) * 10) / 10
        : null;

      const classMin = averagesList.length > 0 ? Math.min(...averagesList) : null;
      const classMax = averagesList.length > 0 ? Math.max(...averagesList) : null;

      let appreciation = "Sans évaluation";
      if (targetStudentAvg !== null) {
        if (targetStudentAvg >= 16) appreciation = "Très bon travail. Régulier.";
        else if (targetStudentAvg >= 14) appreciation = "Bon travail. Poursuivez ainsi.";
        else if (targetStudentAvg >= 12) appreciation = "Ensemble satisfaisant.";
        else if (targetStudentAvg >= 10) appreciation = "Résultats passables. Des efforts requis.";
        else appreciation = "Résultats insuffisants. Travail à renforcer.";
      }

      return {
        subject_id: sub.id,
        subject: sub.name,
        coef: sub.coefficient || 1,
        average: targetStudentAvg,
        classMin,
        classMax,
        appreciation,
      };
    });

    return { success: true, data: reportMatrix };
  } catch {
    return { error: "Erreur lors du chargement des détails du bulletin." };
  }
}
