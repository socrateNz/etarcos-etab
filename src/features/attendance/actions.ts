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
  // For delete: allow roles that can create/edit attendance even if JWT hasn't refreshed yet
  if (action === "delete") {
    const canEditOrCreate =
      hasPermission(permissions, "attendance", "edit") ||
      hasPermission(permissions, "attendance", "create") ||
      role === "director" || role === "censor" || role === "teacher" || role === "owner";
    return canEditOrCreate;
  }
  return hasPermission(permissions, "attendance", action);
}

/** Returns true if the role bypasses scheduling restrictions (non-teachers) */
function isAdmin(role: SystemRole): boolean {
  return role === "super_admin" || role === "owner" || role === "director" || role === "censor";
}

/** Convert HH:MM or HH:MM:SS to total minutes */
function toMin(t: string): number {
  const parts = t.split(":");
  return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
}

/**
 * Checks that the teacher has a scheduled lesson for the classroom on the
 * given date's day-of-week. Optionally validates the current time is within
 * the lesson window (±15 min tolerance).
 * Returns an error string if not allowed, or null if OK.
 */
async function validateTeacherSchedule(
  db: any,
  estId: string,
  teacherId: string,
  classroomId: string,
  date: string,      // YYYY-MM-DD
  subjectId?: string | null,
  checkTime = false
): Promise<string | null> {
  // day_of_week: 1=Mon … 7=Sun (ISO weekday)
  const dayOfWeek = new Date(date).getDay(); // 0=Sun … 6=Sat
  const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek; // convert to 1=Mon…7=Sun

  let query = db
    .from("lessons")
    .select("id, start_time, end_time, subject_id")
    .eq("establishment_id", estId)
    .eq("classroom_id", classroomId)
    .eq("teacher_id", teacherId)
    .eq("day_of_week", isoDay);

  if (subjectId && subjectId !== "none") {
    query = query.eq("subject_id", subjectId);
  }

  const { data: lessons } = await query;

  if (!lessons || lessons.length === 0) {
    return "Vous n'avez aucun cours prévu dans cette classe à cette date. Vous ne pouvez pas faire l'appel.";
  }

  if (checkTime) {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const TOLERANCE = 15; // minutes before/after allowed

    const hasValidSlot = lessons.some((l: any) => {
      const start = toMin(l.start_time) - TOLERANCE;
      const end = toMin(l.end_time) + TOLERANCE;
      return nowMin >= start && nowMin <= end;
    });

    if (!hasValidSlot) {
      const slots = lessons
        .map((l: any) => `${l.start_time.substring(0, 5)}–${l.end_time.substring(0, 5)}`)
        .join(", ");
      return `L'appel n'est autorisé que pendant les créneaux prévus : ${slots}. Revenez à l'heure du cours.`;
    }
  }

  return null; // OK
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
 * Supprime TOUS les enregistrements de pr\u00e9sence pour une classe, une date et une mati\u00e8re donn\u00e9es.
 */
export async function deleteAttendanceSessionAction(
  classroomId: string,
  date: string,
  subjectId?: string | null,
  establishmentId?: string
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "\u00c9tablissement requis." };

  try {
    const db = await getDb();

    let query = db
      .from("attendances")
      .delete()
      .eq("establishment_id", estId)
      .eq("classroom_id", classroomId)
      .eq("date", date);

    if (subjectId && subjectId !== "none") {
      query = query.eq("subject_id", subjectId);
    } else {
      query = query.is("subject_id", null);
    }

    const { error } = await query;
    if (error) return { error: error.message };

    revalidatePath("/attendance");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression de la feuille d'appel." };
  }
}

/**
 * Supprime l'enregistrement de pr\u00e9sence d'un seul \u00e9l\u00e8ve (par ID de record).
 */
export async function deleteAttendanceRecordAction(
  recordId: string
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();

    const { data: existing } = await db
      .from("attendances")
      .select("establishment_id")
      .eq("id", recordId)
      .maybeSingle();
    if (!existing) return { error: "Pr\u00e9sence introuvable." };

    const estId = await resolveEstablishmentId(
      authResult.session!.user.establishment_id,
      existing.establishment_id
    );
    if (estId !== existing.establishment_id) {
      return { error: "Vous n'avez pas acc\u00e8s \u00e0 cette pr\u00e9sence." };
    }

    const { error } = await db.from("attendances").delete().eq("id", recordId);
    if (error) return { error: error.message };

    revalidatePath("/attendance");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression de la pr\u00e9sence." };
  }
}


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

  // Refuse future dates
  const today = new Date().toISOString().split("T")[0];
  if (date > today) return { error: "Impossible de faire l'appel pour une date future." };

  const session = authResult.session!;

  // Restrict teachers to their scheduled classroom/day only (no time-window check on load)
  if (!isAdmin(session.user.role as SystemRole)) {
    const db = await getDb();
    const scheduleErr = await validateTeacherSchedule(
      db, estId, session.user.id, classroomId, date, subjectId, false
    );
    if (scheduleErr) return { error: scheduleErr };
  }

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
      recorded_by: session.user.id,
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

  // Refuse future dates
  const today = new Date().toISOString().split("T")[0];
  if (validated.data.date > today) return { error: "Impossible d'enregistrer l'appel pour une date future." };

  const session = authResult.session!;

  try {
    const db = await getDb();
    const { classroom_id, date, subject_id, attendances } = validated.data;
    const userId = session.user.id;
    const resolvedSubjId = subject_id && subject_id !== "none" ? subject_id : null;

    // Enforce timetable restriction for teachers (with time-window check on save)
    if (!isAdmin(session.user.role as SystemRole)) {
      const scheduleErr = await validateTeacherSchedule(
        db, estId, userId, classroom_id, date, resolvedSubjId, true
      );
      if (scheduleErr) return { error: scheduleErr };
    }

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

/**
 * Retourne les cours programmés pour l'enseignant connecté
 * à la date donnée (ou aujourd'hui par défaut).
 * Les admins reçoivent toutes les leçons de l'établissement.
 */
export async function getTeacherTodayLessonsAction(
  date?: string
): Promise<ActionResult<{
  isAdmin: boolean;
  lessons: Array<{
    lesson_id: string;
    classroom_id: string;
    classroom_name: string;
    subject_id: string;
    subject_name: string;
    start_time: string;
    end_time: string;
  }>;
}>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const session = authResult.session!;
  const estId = await resolveEstablishmentId(session.user.establishment_id);
  if (!estId) return { error: "Établissement requis." };

  const targetDate = date ?? new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date(targetDate).getDay();
  const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  try {
    const db = await getDb();

    const adminUser = isAdmin(session.user.role as SystemRole);

    let query = db
      .from("lessons")
      .select("id, classroom_id, subject_id, start_time, end_time, classroom:classrooms(name), subject:subjects(name)")
      .eq("establishment_id", estId)
      .eq("day_of_week", isoDay)
      .order("start_time");

    if (!adminUser) {
      query = query.eq("teacher_id", session.user.id);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };

    const lessons = (data ?? []).map((l: any) => ({
      lesson_id: l.id,
      classroom_id: l.classroom_id,
      classroom_name: l.classroom?.name ?? "Classe inconnue",
      subject_id: l.subject_id,
      subject_name: l.subject?.name ?? "Matière inconnue",
      start_time: l.start_time.substring(0, 5),
      end_time: l.end_time.substring(0, 5),
    }));

    return { success: true, data: { isAdmin: adminUser, lessons } };
  } catch {
    return { error: "Impossible de charger les cours du jour." };
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

export interface AttendanceLogRecord {
  id: string;
  date: string;
  student_id: string;
  student_name: string;
  student_number: string;
  classroom_id: string;
  classroom_name: string;
  subject_id: string | null;
  subject_name: string;
  status: "present" | "absent" | "late" | "excused";
  justification: string | null;
}

/**
 * Recherche et consultation de l'historique détaillé des présences
 */
export async function getAttendanceLogsAction(input: {
  classroomId?: string;
  studentId?: string;
  subjectId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  establishmentId?: string;
}): Promise<ActionResult<AttendanceLogRecord[]>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    input.establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();
    const session = authResult.session!;

    let query = db
      .from("attendances")
      .select(`
        id,
        date,
        status,
        justification,
        student_id,
        classroom_id,
        subject_id,
        student:students(id, student_number, user:users(name)),
        classroom:classrooms(id, name),
        subject:subjects(id, name, code)
      `)
      .eq("establishment_id", estId)
      .order("date", { ascending: false });

    // Restrict teachers to their own recorded attendance logs
    if (!isAdmin(session.user.role as SystemRole)) {
      query = query.eq("recorded_by", session.user.id);
    }

    if (input.classroomId && input.classroomId !== "all") {
      query = query.eq("classroom_id", input.classroomId);
    }
    if (input.studentId && input.studentId !== "all") {
      query = query.eq("student_id", input.studentId);
    }
    if (input.subjectId && input.subjectId !== "none" && input.subjectId !== "all") {
      query = query.eq("subject_id", input.subjectId);
    }
    if (input.status && input.status !== "all") {
      query = query.eq("status", input.status);
    }
    if (input.dateFrom) {
      query = query.gte("date", input.dateFrom);
    }
    if (input.dateTo) {
      query = query.lte("date", input.dateTo);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };

    const logs: AttendanceLogRecord[] = (data ?? []).map((row: any) => ({
      id: row.id,
      date: row.date,
      student_id: row.student_id,
      student_name: row.student?.user?.name ?? "Sans nom",
      student_number: row.student?.student_number ?? "—",
      classroom_id: row.classroom_id,
      classroom_name: row.classroom?.name ?? "Classe inconnue",
      subject_id: row.subject_id,
      subject_name: row.subject ? `${row.subject.name} (${row.subject.code})` : "Présence Générale",
      status: row.status,
      justification: row.justification,
    }));

    return { success: true, data: logs };
  } catch {
    return { error: "Erreur lors de la récupération du journal de présence." };
  }
}

/**
 * Retourne les classes et matières spécifiques auxquelles l'enseignant est affecté (via leçons ou classe principale).
 * Si l'utilisateur est admin/directeur/censeur, isRestricted vaut false.
 */
export async function getTeacherAssignedOptionsAction(): Promise<
  ActionResult<{
    isRestricted: boolean;
    classrooms: Array<{ id: string; name: string }>;
    subjects: Array<{ id: string; name: string; code: string }>;
  }>
> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const session = authResult.session!;
  const estId = await resolveEstablishmentId(session.user.establishment_id);
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();
    const isUserAdmin = isAdmin(session.user.role as SystemRole);

    if (isUserAdmin) {
      return {
        success: true,
        data: {
          isRestricted: false,
          classrooms: [],
          subjects: [],
        },
      };
    }

    const teacherId = session.user.id;

    // 1. Fetch lessons for teacher
    const { data: lessons } = await db
      .from("lessons")
      .select("classroom_id, subject_id")
      .eq("establishment_id", estId)
      .eq("teacher_id", teacherId);

    // 2. Fetch main_teacher classrooms
    const { data: mainClassrooms } = await db
      .from("classrooms")
      .select("id")
      .eq("establishment_id", estId)
      .eq("main_teacher_id", teacherId);

    const classroomIds = new Set<string>();
    const subjectIds = new Set<string>();

    (lessons ?? []).forEach((l: any) => {
      if (l.classroom_id) classroomIds.add(l.classroom_id);
      if (l.subject_id) subjectIds.add(l.subject_id);
    });

    (mainClassrooms ?? []).forEach((c: any) => {
      if (c.id) classroomIds.add(c.id);
    });

    let assignedClassrooms: Array<{ id: string; name: string }> = [];
    if (classroomIds.size > 0) {
      const { data: cls } = await db
        .from("classrooms")
        .select("id, name")
        .in("id", Array.from(classroomIds))
        .order("name");
      assignedClassrooms = cls ?? [];
    }

    let assignedSubjects: Array<{ id: string; name: string; code: string }> = [];
    if (subjectIds.size > 0) {
      const { data: subs } = await db
        .from("subjects")
        .select("id, name, code")
        .in("id", Array.from(subjectIds))
        .order("name");
      assignedSubjects = subs ?? [];
    }

    return {
      success: true,
      data: {
        isRestricted: true,
        classrooms: assignedClassrooms,
        subjects: assignedSubjects,
      },
    };
  } catch {
    return { error: "Erreur lors de la récupération des affectations de l'enseignant." };
  }
}

