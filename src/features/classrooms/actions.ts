"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createClassroomSchema,
  updateClassroomSchema,
  listClassroomsSchema,
  type CreateClassroomInput,
  type UpdateClassroomInput,
  type ListClassroomsInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  ClassroomWithRelations,
} from "./types";
import type { Classroom, User, AcademicYear } from "@/types/database";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "classes", action);
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

// ========== CLASSROOMS ==========

export async function listClassrooms(
  input: Partial<ListClassroomsInput> = {}
): Promise<ActionResult<PaginatedResult<ClassroomWithRelations>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listClassroomsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order, level_id, track_id, academic_year_id } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("classrooms")
      .select("*, level:levels(id, name, code), track:tracks(id, name, code), main_teacher:users(id, name, email)", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (level_id) query = query.eq("level_id", level_id);
    if (track_id) query = query.eq("track_id", track_id);
    if (academic_year_id) {
      query = query.eq("academic_year_id", academic_year_id);
    } else if (estId) {
      // By default, query for the active current academic year if none provided
      const { data: currentYear } = await db
        .from("academic_years")
        .select("id")
        .eq("establishment_id", estId)
        .eq("is_current", true)
        .maybeSingle();
      if (currentYear) query = query.eq("academic_year_id", currentYear.id);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["name", "code", "capacity", "created_at"].includes(sort_by)
        ? sort_by
        : "name";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const classrooms = (data ?? []) as any[];
    const withCounts: ClassroomWithRelations[] = await Promise.all(
      classrooms.map(async (cls) => {
        const { count: studentCount } = await db
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("classroom_id", cls.id);
        return { ...cls, student_count: studentCount ?? 0 };
      })
    );

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: withCounts,
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les classes." };
  }
}

export async function createClassroomAction(
  values: CreateClassroomInput
): Promise<ActionResult<Classroom>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createClassroomSchema.safeParse(values);
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
    let academicYearId = validated.data.academic_year_id;
    if (!academicYearId) {
      const { data: currentYear } = await db
        .from("academic_years")
        .select("id")
        .eq("establishment_id", estId)
        .eq("is_current", true)
        .maybeSingle();

      if (!currentYear) {
        return { error: "Aucune année académique active n'est configurée pour cet établissement." };
      }
      academicYearId = currentYear.id;
    }

    const { data: existing } = await db
      .from("classrooms")
      .select("id")
      .eq("establishment_id", estId)
      .eq("academic_year_id", academicYearId)
      .eq("code", validated.data.code.toUpperCase())
      .maybeSingle();

    if (existing) return { error: "Ce code de classe existe déjà pour cette année académique." };

    const { data, error } = await db
      .from("classrooms")
      .insert({
        establishment_id: estId,
        level_id: validated.data.level_id,
        track_id: validated.data.track_id || null,
        academic_year_id: academicYearId,
        name: validated.data.name,
        code: validated.data.code.toUpperCase(),
        capacity: validated.data.capacity,
        main_teacher_id: validated.data.main_teacher_id || null,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/classes");
    return { success: true, data: data as Classroom };
  } catch {
    return { error: "Erreur lors de la création de la classe." };
  }
}

export async function updateClassroomAction(
  id: string,
  values: UpdateClassroomInput
): Promise<ActionResult<Classroom>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateClassroomSchema.safeParse(values);
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
      const { data: currentCls } = await db
        .from("classrooms")
        .select("establishment_id, academic_year_id, code")
        .eq("id", id)
        .maybeSingle();

      if (currentCls && currentCls.code !== payload.code) {
        const { data: existing } = await db
          .from("classrooms")
          .select("id")
          .eq("establishment_id", currentCls.establishment_id)
          .eq("academic_year_id", currentCls.academic_year_id)
          .eq("code", payload.code)
          .maybeSingle();

        if (existing) return { error: "Ce code de classe existe déjà pour cette année académique." };
      }
    }

    const { data, error } = await db
      .from("classrooms")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/classes");
    return { success: true, data: data as Classroom };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteClassroomAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { count } = await db
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("classroom_id", id);

    if (count && count > 0) {
      return { error: "Impossible de supprimer la classe : des élèves y sont inscrits." };
    }

    const { error } = await db.from("classrooms").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/classes");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}

// ========== DROPDOWNS HELPERS ==========

export async function listTeachersOptions(
  establishmentId?: string
): Promise<ActionResult<Pick<User, "id" | "name" | "email">[]>> {
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
    let query = db
      .from("users")
      .select("id, name, email")
      .order("name");

    if (estId) query = query.eq("establishment_id", estId);

    const { data, error } = await query;

    if (error) return { error: error.message };
    return { success: true, data: data ?? [] };
  } catch {
    return { error: "Impossible de charger les enseignants." };
  }
}

export async function listAcademicYearsOptions(
  establishmentId?: string
): Promise<ActionResult<Pick<AcademicYear, "id" | "name" | "is_current">[]>> {
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
    let query = db
      .from("academic_years")
      .select("id, name, is_current")
      .order("name", { ascending: false });

    if (estId) query = query.eq("establishment_id", estId);

    const { data, error } = await query;

    if (error) return { error: error.message };
    return { success: true, data: data ?? [] };
  } catch {
    return { error: "Impossible de charger les années académiques." };
  }
}
