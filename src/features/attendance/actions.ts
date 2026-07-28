"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  saveAttendanceSchema,
  type SaveAttendanceInput,
} from "./schemas";
import type { ActionResult, AttendanceWithRelations } from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "attendance", action);
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

export async function fetchClassroomAttendanceAction(
  classroomId: string,
  date: string,
  subjectId?: string | null,
  establishmentId?: string
): Promise<ActionResult<AttendanceWithRelations[]>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    // 1. Fetch existing attendance records
    let query = db
      .from("attendances")
      .select("*, student:students(id, student_number, user:users(name))")
      .eq("establishment_id", estId)
      .eq("classroom_id", classroomId)
      .eq("date", date);

    if (subjectId && subjectId !== "none") {
      query = query.eq("subject_id", subjectId);
    } else {
      query = query.is("subject_id", null);
    }

    const { data: existing, error: fetchErr } = await query;
    if (fetchErr) return { error: fetchErr.message };

    // If records already exist, return them
    if (existing && existing.length > 0) {
      return { success: true, data: existing as AttendanceWithRelations[] };
    }

    // 2. If no records exist, fetch active classroom students to register fresh
    const { data: students, error: studentsErr } = await db
      .from("students")
      .select("id, student_number, user:users(name)")
      .eq("classroom_id", classroomId)
      .eq("status", "active");

    if (studentsErr) return { error: studentsErr.message };

    const initialAttendance: AttendanceWithRelations[] = (students ?? []).map((s: any) => ({
      id: "", // not saved yet
      establishment_id: estId,
      student_id: s.id,
      classroom_id: classroomId,
      subject_id: subjectId && subjectId !== "none" ? subjectId : null,
      date,
      status: "present", // default to present
      justification: null,
      recorded_by: authResult.session!.user.id,
      created_at: new Date().toISOString(),
      student: {
        id: s.id,
        student_number: s.student_number,
        user: {
          name: s.user?.name || "Sans nom",
        },
      },
    }));

    // Sort by name
    initialAttendance.sort((a, b) => {
      const nameA = a.student?.user?.name || "";
      const nameB = b.student?.user?.name || "";
      return nameA.localeCompare(nameB);
    });

    return { success: true, data: initialAttendance };
  } catch {
    return { error: "Erreur lors du chargement de la feuille d'appel." };
  }
}

export async function saveAttendanceAction(
  values: SaveAttendanceInput
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = saveAttendanceSchema.safeParse(values);
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
    const { classroom_id, date, subject_id, attendances } = validated.data;
    const userId = authResult.session!.user.id;
    const resolvedSubjId = subject_id && subject_id !== "none" ? subject_id : null;

    for (const item of attendances) {
      // Check if attendance record already exists
      let query = db
        .from("attendances")
        .select("id")
        .eq("establishment_id", estId)
        .eq("classroom_id", classroom_id)
        .eq("student_id", item.student_id)
        .eq("date", date);

      if (resolvedSubjId) {
        query = query.eq("subject_id", resolvedSubjId);
      } else {
        query = query.is("subject_id", null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Update
        const { error: updateErr } = await db
          .from("attendances")
          .update({
            status: item.status,
            justification: item.justification || null,
            recorded_by: userId,
          })
          .eq("id", existing.id);

        if (updateErr) return { error: updateErr.message };
      } else {
        // Insert
        const { error: insertErr } = await db
          .from("attendances")
          .insert({
            establishment_id: estId,
            student_id: item.student_id,
            classroom_id,
            subject_id: resolvedSubjId,
            date,
            status: item.status,
            justification: item.justification || null,
            recorded_by: userId,
          });

        if (insertErr) return { error: insertErr.message };
      }
    }

    revalidatePath("/attendance");
    return { success: true };
  } catch {
    return { error: "Erreur lors de l'enregistrement de l'appel." };
  }
}

// ========== SUMMARIES ==========

/**
 * Résumé des absences/retards d'un élève sur une période donnée
 */
export async function getAttendanceSummaryAction(
  studentId: string,
  dateFrom?: string,
  dateTo?: string,
  establishmentId?: string
): Promise<
  ActionResult<{
    total_absences: number;
    total_late: number;
    total_excused: number;
    total_present: number;
    absence_rate: number;
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

    let query = db
      .from("attendances")
      .select("status")
      .eq("establishment_id", estId)
      .eq("student_id", studentId);

    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo)   query = query.lte("date", dateTo);

    const { data, error } = await query;
    if (error) return { error: error.message };

    const records = (data ?? []) as Array<{ status: string }>;
    const total          = records.length;
    const total_absences = records.filter(r => r.status === "absent").length;
    const total_late     = records.filter(r => r.status === "late").length;
    const total_excused  = records.filter(r => r.status === "excused").length;
    const total_present  = records.filter(r => r.status === "present").length;
    const absence_rate   = total > 0 ? Math.round(((total_absences + total_late) / total) * 100) : 0;

    return {
      success: true,
      data: { total_absences, total_late, total_excused, total_present, absence_rate },
    };
  } catch {
    return { error: "Erreur lors du calcul du résumé des absences." };
  }
}

/**
 * Statistiques d'absences globales pour une classe
 * Retourne la liste des élèves triés par taux d'absence
 */
export async function getAttendanceStatsAction(
  classroomId: string,
  dateFrom?: string,
  dateTo?: string,
  establishmentId?: string
): Promise<
  ActionResult<
    Array<{
      student_id: string;
      student_name: string;
      student_number: string;
      total_absences: number;
      total_late: number;
      total_present: number;
      absence_rate: number;
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

    // 1. Get all students in classroom
    const { data: students, error: studErr } = await db
      .from("students")
      .select("id, student_number, user:users(name)")
      .eq("classroom_id", classroomId)
      .eq("status", "active");

    if (studErr) return { error: studErr.message };

    // 2. Get attendance records for all students in the classroom
    let attQuery = db
      .from("attendances")
      .select("student_id, status")
      .eq("establishment_id", estId)
      .eq("classroom_id", classroomId);

    if (dateFrom) attQuery = attQuery.gte("date", dateFrom);
    if (dateTo)   attQuery = attQuery.lte("date", dateTo);

    const { data: attData, error: attErr } = await attQuery;
    if (attErr) return { error: attErr.message };

    const records = (attData ?? []) as Array<{ student_id: string; status: string }>;

    const result = (students ?? []).map((s: any) => {
      const studentRecords = records.filter(r => r.student_id === s.id);
      const total          = studentRecords.length;
      const total_absences = studentRecords.filter(r => r.status === "absent").length;
      const total_late     = studentRecords.filter(r => r.status === "late").length;
      const total_present  = studentRecords.filter(r => r.status === "present").length;
      const absence_rate   = total > 0 ? Math.round(((total_absences + total_late) / total) * 100) : 0;

      return {
        student_id: s.id,
        student_name: (s.user as any)?.name ?? "Sans nom",
        student_number: s.student_number,
        total_absences,
        total_late,
        total_present,
        absence_rate,
      };
    });

    // Sort by highest absence rate first
    result.sort((a: { absence_rate: number }, b: { absence_rate: number }) => b.absence_rate - a.absence_rate);

    return { success: true, data: result };
  } catch {
    return { error: "Erreur lors du calcul des statistiques d'absences." };
  }
}
