"use server";

import { resolveEstablishmentId, assertEstablishmentOwnership } from "@/lib/auth/active-etab";
import { computeWeightedAverage, averageToMention, averageToAppreciation, type GradeForAverage } from "./calculations";
import { resolveActiveAcademicYearId } from "@/app/actions/academic-years";
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

// ========== ACTIONS ==========

/**
 * Charge la matrice des notes pour une classe, matière, période et type donnés.
 * Retourne la liste des élèves avec leur note (si elle existe).
 */
export async function getGradesMatrixAction(
  classroomId: string,
  subjectId: string,
  period: string,
  type: string,
  establishmentId?: string
): Promise<
  ActionResult<{
    coefficient: number;
    max_value: number;
    students: Array<{
      student_id: string;
      student_number: string;
      student_name: string;
      grade_id: string | null;
      score: number | null;
      comment: string | null;
    }>;
  }>
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

    // 1. Fetch active academic year
    const activeYearId = await resolveActiveAcademicYearId(db, estId);
    if (!activeYearId) return { error: "Aucune année académique active configurée." };

    // 2. Fetch default coefficient for subject
    const { data: subject } = await db
      .from("subjects")
      .select("coefficient")
      .eq("id", subjectId)
      .maybeSingle();

    const coefficient = subject?.coefficient ?? 1;

    // 3. Fetch active students in classroom
    const { data: students, error: studErr } = await db
      .from("students")
      .select("id, student_number, user:users(name)")
      .eq("classroom_id", classroomId)
      .eq("status", "active")
      .order("student_number");

    if (studErr) return { error: studErr.message };

    // 4. Fetch existing grades for this tuple
    const { data: existingGrades } = await db
      .from("grades")
      .select("*")
      .eq("establishment_id", estId)
      .eq("classroom_id", classroomId)
      .eq("subject_id", subjectId)
      .eq("academic_year_id", activeYearId)
      .eq("period", period)
      .eq("type", type);

    const gradeByStudent = new Map<string, any>();
    let max_value = 20;
    (existingGrades ?? []).forEach((g: any) => {
      gradeByStudent.set(g.student_id, g);
      if (g.max_value) max_value = g.max_value;
    });

    const studentList = (students ?? []).map((s: any) => {
      const g = gradeByStudent.get(s.id);
      return {
        student_id: s.id,
        student_number: s.student_number,
        student_name: s.user?.name ?? "Sans nom",
        grade_id: g?.id ?? null,
        score: g?.score ?? g?.value ?? null,
        comment: g?.comment ?? null,
      };
    });

    return {
      success: true,
      data: {
        coefficient,
        max_value,
        students: studentList,
      },
    };
  } catch {
    return { error: "Impossible de charger la grille de notes." };
  }
}

export async function fetchClassroomGradesAction(
  classroomId: string,
  subjectId: string,
  period: string,
  type: string,
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

    const activeYearId = await resolveActiveAcademicYearId(db, estId);

    // 1. Fetch ALL students in this classroom
    const { data: students, error: studErr } = await db
      .from("students")
      .select("id, student_number, user:users(name)")
      .eq("classroom_id", classroomId)
      .order("student_number");

    if (studErr) return { error: studErr.message };

    // 2. Fetch existing grades for this tuple
    const { data: existingGrades } = await db
      .from("grades")
      .select("*, student:students(id, student_number, user:users(name))")
      .eq("classroom_id", classroomId)
      .eq("subject_id", subjectId)
      .eq("period", period)
      .eq("type", type);

    const gradeByStudent = new Map<string, GradeWithRelations>();
    (existingGrades ?? []).forEach((g: any) => {
      gradeByStudent.set(g.student_id, g as GradeWithRelations);
    });

    // 3. Combine to return ALL students in classroom (graded or draft)
    const result: GradeWithRelations[] = (students ?? []).map((s: any) => {
      const existingGrade = gradeByStudent.get(s.id);
      if (existingGrade) return existingGrade;

      // Draft entries use null value so they are NOT accidentally saved with 0
      return {
        id: `draft_${s.id}`,
        establishment_id: estId,
        student_id: s.id,
        subject_id: subjectId,
        classroom_id: classroomId,
        academic_year_id: activeYearId ?? "",
        period,
        value: null,
        max_value: 20,
        coefficient: 1,
        type: type as any,
        comment: null,
        graded_by: "",
        created_at: new Date().toISOString(),
        student: {
          id: s.id,
          student_number: s.student_number,
          user: s.user,
        },
      } as any;
    });

    return { success: true, data: result };
  } catch {
    return { error: "Impossible de charger les élèves de la classe." };
  }
}

/**
 * Enregistre en masse les notes d'une évaluation pour toute une classe.
 */
export async function saveGradesBatchAction(
  values: SaveGradesInput
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = saveGradesSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    (validated.data as any).establishment_id
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    // Fetch active academic year
    const activeYearId = await resolveActiveAcademicYearId(db, estId);
    if (!activeYearId) return { error: "Aucune année académique active." };

    const { classroom_id, subject_id, period, type, coefficient, max_value, grades } = validated.data;
    const userId = authResult.session!.user.id;

    // Filter valid non-null grades
    const validGrades = (grades as any[]).filter((g: any) => (g.value !== null && g.value !== undefined) || (g.score !== null && g.score !== undefined));

    for (const g of validGrades) {
      const gradeVal = Number(g.value ?? g.score);
      if (isNaN(gradeVal)) continue;

      // Check if a grade record ALREADY EXISTS in DB for this student, classroom, subject, period, type
      const { data: existing } = await db
        .from("grades")
        .select("id")
        .eq("classroom_id", classroom_id)
        .eq("subject_id", subject_id)
        .eq("student_id", g.student_id)
        .eq("period", period)
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const targetId = (g.grade_id && !g.grade_id.startsWith("draft_")) ? g.grade_id : existing?.id;

      if (targetId) {
        // Update existing grade
        const { error: updateErr } = await db
          .from("grades")
          .update({
            value: gradeVal,
            coefficient,
            max_value,
            comment: g.comment || null,
          })
          .eq("id", targetId);

        if (updateErr) {
          return { error: updateErr.message };
        }
      } else {
        const gradePayload: any = {
          establishment_id: estId,
          classroom_id,
          subject_id,
          student_id: g.student_id,
          academic_year_id: activeYearId,
          graded_by: userId,
          period,
          type,
          value: gradeVal,
          coefficient,
          max_value,
          comment: g.comment || null,
        };

        const { error: insertErr } = await db.from("grades").insert(gradePayload);
        if (insertErr) {
          // Retry without graded_by if foreign key fails
          const { error: retryErr } = await db.from("grades").insert({
            ...gradePayload,
            graded_by: null,
          });
          if (retryErr) return { error: retryErr.message };
        }
      }
    }

    revalidatePath("/grades");
    revalidatePath("/report-cards");
    return { success: true };
  } catch (e: any) {
    return { error: e?.message || "Erreur lors de la sauvegarde des notes." };
  }
}

export const saveGradesAction = saveGradesBatchAction;

/**
 * Calcule la moyenne générale par classe pour le tableau de bord des notes
 */
export async function getClassroomOverallAveragesAction(
  classroomId: string,
  period: string,
  establishmentId?: string
): Promise<ActionResult<{ classroomAverage: number | null; totalStudents: number }>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    const activeYearId = await resolveActiveAcademicYearId(db, estId);
    if (!activeYearId) return { error: "Aucune année académique active." };

    const { data: grades, error: gradesErr } = await db
      .from("grades")
      .select("value, max_value, coefficient")
      .eq("establishment_id", estId)
      .eq("classroom_id", classroomId)
      .eq("academic_year_id", activeYearId)
      .eq("period", period);

    if (gradesErr) return { error: gradesErr.message };

    const { count: studentCount } = await db
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("classroom_id", classroomId)
      .eq("status", "active");

    const classroomAverage = computeWeightedAverage(grades ?? []);

    return {
      success: true,
      data: { classroomAverage, totalStudents: studentCount ?? 0 },
    };
  } catch {
    return { error: "Impossible de calculer la moyenne de la classe." };
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

  try {
    const db = await getDb();

    const activeYearId = await resolveActiveAcademicYearId(db, estId);
    if (!activeYearId) return { error: "Aucune année académique active." };

    // Fetch students in classroom
    const { data: students, error: studErr } = await db
      .from("students")
      .select("id, student_number, user:users(name)")
      .eq("classroom_id", classroomId);

    if (studErr) return { error: studErr.message };

    // Fetch all grades for students in this classroom
    const studentIds = (students ?? []).map((s: any) => s.id);
    if (studentIds.length === 0) {
      return { success: true, data: [] };
    }

    let gradesQuery = db
      .from("grades")
      .select("student_id, value, max_value, coefficient, period")
      .eq("classroom_id", classroomId)
      .in("student_id", studentIds);

    if (period && period !== "AN") {
      gradesQuery = gradesQuery.eq("period", period);
    }

    const { data: gradesData, error: gradesErr } = await gradesQuery;
    if (gradesErr) return { error: gradesErr.message };

    const gradesByStudent = new Map<string, GradeForAverage[]>();
    (gradesData ?? []).forEach((g: any) => {
      const list = gradesByStudent.get(g.student_id) ?? [];
      list.push({ value: g.value, max_value: g.max_value, coefficient: g.coefficient });
      gradesByStudent.set(g.student_id, list);
    });

    const results: Array<{
      student_id: string;
      student_number: string;
      student_name: string;
      average: number | null;
      mention: string | null;
      rank: number | null;
    }> = [];

    for (const s of students ?? []) {
      const studentGrades = gradesByStudent.get(s.id) ?? [];
      const average = computeWeightedAverage(studentGrades);
      const mention = averageToMention(average);

      results.push({
        student_id: s.id,
        student_number: s.student_number,
        student_name: (s.user as any)?.name ?? "Sans nom",
        average,
        mention,
        rank: null,
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

    const guard = await assertEstablishmentOwnership(
      db, "grades", gradeId, authResult.session!.user.establishment_id,
      "Note introuvable.", "Vous n'avez pas accès à cette note."
    );
    if ("error" in guard) return { error: guard.error };

    const { error } = await db.from("grades").delete().eq("id", gradeId);
    if (error) return { error: error.message };
    revalidatePath("/grades");
    revalidatePath("/report-cards");
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

  try {
    const db = await getDb();

    const activeYearId = await resolveActiveAcademicYearId(db, estId);
    if (!activeYearId) return { error: "Aucune année académique active." };

    // 1. Fetch all students in this classroom (for classMin/classMax)
    const { data: classroomStudents } = await db
      .from("students")
      .select("id")
      .eq("classroom_id", classroomId);

    const studentIds = (classroomStudents ?? []).map((s: any) => s.id);
    if (!studentIds.includes(studentId)) studentIds.push(studentId);

    // 2. Fetch all grades for this classroom & period
    let gradesQuery = db
      .from("grades")
      .select("student_id, subject_id, value, max_value, coefficient, period")
      .eq("classroom_id", classroomId)
      .in("student_id", studentIds);

    if (period && period !== "AN") {
      gradesQuery = gradesQuery.eq("period", period);
    }

    const { data: classroomGrades, error: gradesErr } = await gradesQuery;
    if (gradesErr) return { error: gradesErr.message };

    const grades = classroomGrades ?? [];

    // 3. Get unique subject IDs from the actual grades
    const subjectIdsInGrades = [...new Set(grades.map((g: any) => g.subject_id))];

    if (subjectIdsInGrades.length === 0) {
      // No grades recorded yet for this classroom/period
      return { success: true, data: [] };
    }

    // 4. Fetch subject details for those subjects only
    const { data: subjectsData } = await db
      .from("subjects")
      .select("id, name, coefficient")
      .in("id", subjectIdsInGrades)
      .order("name");

    const subjects = subjectsData ?? [];

    // 5. Build the report per subject
    const report: StudentSubjectReport[] = subjects.map((sub: any) => {
      const subGrades = grades.filter((g: any) => g.subject_id === sub.id);
      const studentSubGrades = subGrades.filter((g: any) => g.student_id === studentId);

      // Weighted average for this student in this subject
      const studentAvg = computeWeightedAverage(studentSubGrades as GradeForAverage[]);

      // Per-student averages in this subject (for classMin / classMax)
      const averagesByStudent = new Map<string, number[]>();
      subGrades.forEach((g: any) => {
        const val = g.value;
        if (val !== null && val !== undefined && !isNaN(Number(val))) {
          const list = averagesByStudent.get(g.student_id) ?? [];
          list.push((Number(val) / (g.max_value || 20)) * 20);
          averagesByStudent.set(g.student_id, list);
        }
      });

      const studentAverages: number[] = [];
      averagesByStudent.forEach((scores) => {
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          studentAverages.push(Number(avg.toFixed(2)));
        }
      });

      const classMin = studentAverages.length > 0 ? Math.min(...studentAverages) : null;
      const classMax = studentAverages.length > 0 ? Math.max(...studentAverages) : null;

      const appreciation = averageToAppreciation(studentAvg);

      return {
        subject_id: sub.id,
        subject: sub.name,
        coef: sub.coefficient ?? 1,
        average: studentAvg,
        classMin,
        classMax,
        appreciation,
      };
    });

    return { success: true, data: report };
  } catch {
    return { error: "Erreur lors du chargement du bulletin détaillé." };
  }
}
