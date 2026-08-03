"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { generateTemporaryPassword } from "@/lib/auth/password";
import { sendWelcomeEmail } from "@/lib/email";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createStaffSchema,
  updateStaffSchema,
  listStaffSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
  type ListStaffInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  StaffMember,
  StaffMemberWithUser,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "staff", action);
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

// ========== STAFF MEMBERS ==========

import { listOwnerEstablishmentsAction } from "@/features/users/actions";

export async function listStaff(
  input: Partial<ListStaffInput> = {}
): Promise<ActionResult<PaginatedResult<StaffMemberWithUser>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listStaffSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order, position, department } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("staff_members")
      .select("*, user:users(*)", { count: "exact" });

    if (authResult.session!.user.role === "owner") {
      const etabRes = await listOwnerEstablishmentsAction();
      const etabIds = (etabRes.data ?? []).map((e: any) => e.id);
      if (etabIds.length > 0) {
        if (estId) {
          query = query.eq("establishment_id", estId);
        } else {
          query = query.in("establishment_id", etabIds);
        }
      } else {
        return { success: true, data: { data: [], total: 0, page: 1, per_page: 50, total_pages: 0 } };
      }
    } else if (estId) {
      query = query.eq("establishment_id", estId);
    }

    if (position) query = query.eq("position", position);
    if (department) query = query.eq("department", department);

    if (search) {
      // In Supabase we can search on joined fields using inner join syntax or or constraints
      query = query.or(`employee_number.ilike.%${search}%,position.ilike.%${search}%,department.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["employee_number", "position", "department", "hire_date", "created_at"].includes(sort_by)
        ? sort_by
        : "created_at";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const list = (data ?? []) as StaffMemberWithUser[];

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: list,
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger le personnel." };
  }
}

export async function createStaffAction(
  values: CreateStaffInput
): Promise<ActionResult<StaffMember>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createStaffSchema.safeParse(values);
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

    // Determine target role from position
    let roleName = "teacher";
    const pos = validated.data.position.toLowerCase();
    if (pos.includes("direct") || pos.includes("dir")) roleName = "director";
    else if (pos.includes("cens") || pos.includes("survei")) roleName = "censor";
    else if (pos.includes("compt") || pos.includes("financ") || pos.includes("account")) roleName = "accountant";
    else if (pos.includes("secr")) roleName = "secretary";
    else if (pos.includes("biblio") || pos.includes("lib")) roleName = "librarian";
    else if (pos.includes("lab")) roleName = "lab_manager";

    // SINGLE DIRECTOR PER ESTABLISHMENT RULE CHECK
    if (roleName === "director") {
      const { data: existingDirectorRoles } = await db
        .from("user_roles")
        .select("user_id, role:roles!inner(slug, name), user:users!inner(establishment_id, is_active)")
        .or("role.slug.eq.director,role.name.eq.director")
        .eq("user.establishment_id", estId)
        .eq("user.is_active", true);

      if (existingDirectorRoles && existingDirectorRoles.length > 0) {
        return {
          error: "Cet établissement possède déjà un Directeur d'Établissement. Un seul directeur est autorisé par établissement.",
        };
      }
    }

    // Check unique employee number
    const { data: existingEmp } = await db
      .from("staff_members")
      .select("id")
      .eq("establishment_id", estId)
      .eq("employee_number", validated.data.employee_number)
      .maybeSingle();

    if (existingEmp) return { error: "Ce numéro d'employé existe déjà." };

    // Check unique email in user profiles
    const { data: existingUser } = await db
      .from("users")
      .select("id")
      .eq("email", validated.data.email.toLowerCase())
      .maybeSingle();

    if (existingUser) return { error: "Cet email est déjà utilisé." };

    // 1. Create user in Supabase Auth via Admin API
    const password = (validated.data.password && validated.data.password.trim().length >= 6)
      ? validated.data.password.trim()
      : generateTemporaryPassword();

    const { data: authUser, error: authError } = await db.auth.admin.createUser({
      email: validated.data.email.toLowerCase(),
      email_confirm: true,
      password,
      user_metadata: { name: validated.data.name },
    });

    if (authError || !authUser.user) {
      return { error: authError?.message || "Erreur lors de la création du compte authentifié." };
    }

    // 2. Insert User profile
    const { error: userError } = await db.from("users").insert({
      id: authUser.user.id,
      email: validated.data.email.toLowerCase(),
      name: validated.data.name,
      first_name: validated.data.first_name || null,
      last_name: validated.data.last_name || null,
      phone: validated.data.phone || null,
      gender: validated.data.gender || null,
      date_of_birth: validated.data.date_of_birth || null,
      address: validated.data.address || null,
      establishment_id: estId,
      is_active: validated.data.status === "active",
      requires_password_change: true,
    });

    if (userError) {
      await db.auth.admin.deleteUser(authUser.user.id);
      return { error: userError.message };
    }

    // 3. Assign Role in DB (Ensure role exists in roles table)
    let { data: role } = await db
      .from("roles")
      .select("id")
      .or(`slug.eq.${roleName},name.eq.${roleName}`)
      .maybeSingle();

    if (!role) {
      const { data: newRole } = await db
        .from("roles")
        .insert({
          name: roleName === "director" ? "Directeur d'Établissement" : roleName.charAt(0).toUpperCase() + roleName.slice(1),
          slug: roleName,
          is_system: true,
        })
        .select("id")
        .single();
      role = newRole;
    }

    if (role) {
      await db.from("user_roles").insert({
        user_id: authUser.user.id,
        role_id: role.id,
        establishment_id: estId,
      });
    }

    // 4. Insert Staff Member
    const { data: staff, error: staffError } = await db
      .from("staff_members")
      .insert({
        establishment_id: estId,
        user_id: authUser.user.id,
        employee_number: validated.data.employee_number,
        department: validated.data.department || null,
        position: validated.data.position,
        hire_date: validated.data.hire_date,
        salary: validated.data.salary || null,
        contract_type: validated.data.contract_type,
        status: validated.data.status,
      })
      .select()
      .single();

    if (staffError) {
      // Clean up user profile and auth
      await db.from("users").delete().eq("id", authUser.user.id);
      await db.auth.admin.deleteUser(authUser.user.id);
      return { error: staffError.message };
    }

    await sendWelcomeEmail({ email: validated.data.email.toLowerCase(), name: validated.data.name, tempPassword: password });

    revalidatePath("/hr");
    return { success: true, data: { ...staff, tempPassword: password } as any };
  } catch {
    return { error: "Erreur lors de la création du membre du personnel." };
  }
}

export async function updateStaffAction(
  id: string,
  values: UpdateStaffInput
): Promise<ActionResult<StaffMember>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateStaffSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();
    const { data: currentStaff } = await db
      .from("staff_members")
      .select("user_id, establishment_id, employee_number")
      .eq("id", id)
      .maybeSingle();

    if (!currentStaff) return { error: "Membre du personnel introuvable." };

    const estId = await resolveEstablishmentId(
      authResult.session!.user.establishment_id,
      currentStaff.establishment_id
    );
    if (estId !== currentStaff.establishment_id) {
      return { error: "Vous n'avez pas accès à ce membre du personnel." };
    }

    // Check unique employee number if changed
    if (validated.data.employee_number && validated.data.employee_number !== currentStaff.employee_number) {
      const { data: existingEmp } = await db
        .from("staff_members")
        .select("id")
        .eq("establishment_id", currentStaff.establishment_id)
        .eq("employee_number", validated.data.employee_number)
        .maybeSingle();

      if (existingEmp) return { error: "Ce numéro d'employé existe déjà." };
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
        .eq("id", currentStaff.user_id);

      if (userError) return { error: userError.message };
    }

    // 2. Update Auth email if changed
    if (validated.data.email) {
      const emailLower = validated.data.email.toLowerCase();
      // Check if email is used elsewhere
      const { data: emailOwner } = await db
        .from("users")
        .select("id")
        .eq("email", emailLower)
        .maybeSingle();

      if (emailOwner && emailOwner.id !== currentStaff.user_id) {
        return { error: "Cet email est déjà utilisé." };
      }

      // Update in auth.users and public.users
      await db.from("users").update({ email: emailLower }).eq("id", currentStaff.user_id);
      await db.auth.admin.updateUserById(currentStaff.user_id, { email: emailLower });
    }

    // 3. Update Staff specific fields
    const staffPayload: any = {};
    if (validated.data.employee_number) staffPayload.employee_number = validated.data.employee_number;
    if (validated.data.department !== undefined) staffPayload.department = validated.data.department;
    if (validated.data.position) staffPayload.position = validated.data.position;
    if (validated.data.hire_date) staffPayload.hire_date = validated.data.hire_date;
    if (validated.data.salary !== undefined) staffPayload.salary = validated.data.salary;
    if (validated.data.contract_type) staffPayload.contract_type = validated.data.contract_type;
    if (validated.data.status) staffPayload.status = validated.data.status;

    const { data: updatedStaff, error: staffError } = await db
      .from("staff_members")
      .update(staffPayload)
      .eq("id", id)
      .select()
      .single();

    if (staffError) return { error: staffError.message };

    revalidatePath("/hr");
    return { success: true, data: updatedStaff as StaffMember };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteStaffAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { data: staff } = await db
      .from("staff_members")
      .select("user_id, establishment_id")
      .eq("id", id)
      .maybeSingle();

    if (!staff) return { error: "Membre du personnel introuvable." };

    const estId = await resolveEstablishmentId(
      authResult.session!.user.establishment_id,
      staff.establishment_id
    );
    if (estId !== staff.establishment_id) {
      return { error: "Vous n'avez pas accès à ce membre du personnel." };
    }

    // Deleting the auth user automatically deletes the users profile row and cascades to staff_members table
    const { error } = await db.auth.admin.deleteUser(staff.user_id);
    if (error) {
      // Fallback: delete directly from staff_members
      await db.from("staff_members").delete().eq("id", id);
    }

    revalidatePath("/hr");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}
