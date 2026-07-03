"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createStudentSchema,
  updateStudentSchema,
  listStudentsSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
  type ListStudentsInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  Student,
  StudentWithRelations,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "students", action);
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

// ========== STUDENTS ==========

export async function listStudents(
  input: Partial<ListStudentsInput> = {}
): Promise<ActionResult<PaginatedResult<StudentWithRelations>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listStudentsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order, classroom_id, track_id, status } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("students")
      .select("*, user:users(*), classroom:classrooms(id, name), track:tracks(id, name, code)", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (classroom_id) query = query.eq("classroom_id", classroom_id);
    if (track_id) query = query.eq("track_id", track_id);
    if (status) query = query.eq("status", status);

    if (search) {
      query = query.or(`student_number.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["student_number", "enrollment_date", "created_at"].includes(sort_by)
        ? sort_by
        : "created_at";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: (data ?? []) as StudentWithRelations[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les élèves." };
  }
}

export async function createStudentAction(
  values: CreateStudentInput
): Promise<ActionResult<Student>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createStudentSchema.safeParse(values);
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

    // Check unique student number
    const { data: existingNum } = await db
      .from("students")
      .select("id")
      .eq("establishment_id", estId)
      .eq("student_number", validated.data.student_number)
      .maybeSingle();

    if (existingNum) return { error: "Ce numéro matricule élève existe déjà." };

    // Resolve email (default to username-based if not provided)
    const email = validated.data.email || `${validated.data.student_number.toLowerCase()}@etarcos-etab.com`;

    // Check if email already used in user profiles
    const { data: existingUser } = await db
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) return { error: "Cet email est déjà utilisé par un autre profil." };

    // Resolve academic year if not provided
    let academicYearId = validated.data.academic_year_id;
    if (!academicYearId) {
      const { data: currentYear } = await db
        .from("academic_years")
        .select("id")
        .eq("establishment_id", estId)
        .eq("is_current", true)
        .maybeSingle();

      if (!currentYear) {
        return { error: "Aucune année académique active configurée pour cet établissement." };
      }
      academicYearId = currentYear.id;
    }

    // 1. Create auth user in Supabase Auth via Admin API
    const password = Math.random().toString(36).slice(-8); // Random password
    const { data: authUser, error: authError } = await db.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
      password,
      user_metadata: { name: validated.data.name },
    });

    if (authError || !authUser.user) {
      return { error: authError?.message || "Erreur lors de la création du compte élève." };
    }

    // 2. Insert User profile
    const { error: userError } = await db.from("users").insert({
      id: authUser.user.id,
      email: email.toLowerCase(),
      name: validated.data.name,
      first_name: validated.data.first_name || null,
      last_name: validated.data.last_name || null,
      phone: validated.data.phone || null,
      gender: validated.data.gender || null,
      date_of_birth: validated.data.date_of_birth || null,
      address: validated.data.address || null,
      establishment_id: estId,
      is_active: validated.data.status === "active",
    });

    if (userError) {
      await db.auth.admin.deleteUser(authUser.user.id);
      return { error: userError.message };
    }

    // 3. Assign Role 'student'
    const { data: role } = await db
      .from("roles")
      .select("id")
      .eq("name", "student")
      .maybeSingle();

    if (role) {
      await db.from("user_roles").insert({
        user_id: authUser.user.id,
        role_id: role.id,
        establishment_id: estId,
      });
    }

    // 4. Insert Student record
    const { data: student, error: studentError } = await db
      .from("students")
      .insert({
        establishment_id: estId,
        user_id: authUser.user.id,
        student_number: validated.data.student_number,
        classroom_id: validated.data.classroom_id || null,
        track_id: validated.data.track_id || null,
        academic_year_id: academicYearId,
        enrollment_date: validated.data.enrollment_date || new Date().toISOString().split("T")[0],
        scholarship_type: validated.data.scholarship_type,
        status: validated.data.status,
      })
      .select()
      .single();

    if (studentError) {
      await db.from("users").delete().eq("id", authUser.user.id);
      await db.auth.admin.deleteUser(authUser.user.id);
      return { error: studentError.message };
    }

    revalidatePath("/students");
    return { success: true, data: student as Student };
  } catch {
    return { error: "Erreur lors de la création de l'élève." };
  }
}

export async function updateStudentAction(
  id: string,
  values: UpdateStudentInput
): Promise<ActionResult<Student>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateStudentSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();
    const { data: currentStudent } = await db
      .from("students")
      .select("user_id, establishment_id, student_number")
      .eq("id", id)
      .maybeSingle();

    if (!currentStudent) return { error: "Élève introuvable." };

    // Check unique student number if changed
    if (validated.data.student_number && validated.data.student_number !== currentStudent.student_number) {
      const { data: existingNum } = await db
        .from("students")
        .select("id")
        .eq("establishment_id", currentStudent.establishment_id)
        .eq("student_number", validated.data.student_number)
        .maybeSingle();

      if (existingNum) return { error: "Ce numéro matricule existe déjà." };
    }

    // 1. Update User profile fields
    const userPayload: any = {};
    if (validated.data.name) userPayload.name = validated.data.name;
    if (validated.data.first_name !== undefined) userPayload.first_name = validated.data.first_name;
    if (validated.data.last_name !== undefined) userPayload.last_name = validated.data.last_name;
    if (validated.data.phone !== undefined) userPayload.phone = validated.data.phone;
    if (validated.data.gender !== undefined) userPayload.gender = validated.data.gender;
    if (validated.data.date_of_birth !== undefined) userPayload.date_of_birth = validated.data.date_of_birth;
    if (validated.data.address !== undefined) userPayload.address = validated.data.address;
    if (validated.data.status) userPayload.is_active = validated.data.status === "active";

    if (Object.keys(userPayload).length > 0) {
      const { error: userError } = await db
        .from("users")
        .update(userPayload)
        .eq("id", currentStudent.user_id);

      if (userError) return { error: userError.message };
    }

    // 2. Update Auth email if provided and changed
    if (validated.data.email) {
      const emailLower = validated.data.email.toLowerCase();
      const { data: emailOwner } = await db
        .from("users")
        .select("id")
        .eq("email", emailLower)
        .maybeSingle();

      if (emailOwner && emailOwner.id !== currentStudent.user_id) {
        return { error: "Cet email est déjà utilisé." };
      }

      await db.from("users").update({ email: emailLower }).eq("id", currentStudent.user_id);
      await db.auth.admin.updateUserById(currentStudent.user_id, { email: emailLower });
    }

    // 3. Update Student fields
    const studentPayload: any = {};
    if (validated.data.student_number) studentPayload.student_number = validated.data.student_number;
    if (validated.data.classroom_id !== undefined) studentPayload.classroom_id = validated.data.classroom_id;
    if (validated.data.track_id !== undefined) studentPayload.track_id = validated.data.track_id;
    if (validated.data.enrollment_date) studentPayload.enrollment_date = validated.data.enrollment_date;
    if (validated.data.scholarship_type) studentPayload.scholarship_type = validated.data.scholarship_type;
    if (validated.data.status) studentPayload.status = validated.data.status;

    const { data: updatedStudent, error: studentError } = await db
      .from("students")
      .update(studentPayload)
      .eq("id", id)
      .select()
      .single();

    if (studentError) return { error: studentError.message };

    revalidatePath("/students");
    return { success: true, data: updatedStudent as Student };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteStudentAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { data: student } = await db
      .from("students")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!student) return { error: "Élève introuvable." };

    const { error } = await db.auth.admin.deleteUser(student.user_id);
    if (error) {
      await db.from("students").delete().eq("id", id);
    }

    revalidatePath("/students");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}
