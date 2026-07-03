"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createParentSchema,
  updateParentSchema,
  listParentsSchema,
  type CreateParentInput,
  type UpdateParentInput,
  type ListParentsInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  Parent,
  ParentWithRelations,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "parents", action);
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

// ========== PARENTS ==========

export async function listParents(
  input: Partial<ListParentsInput> = {}
): Promise<ActionResult<PaginatedResult<ParentWithRelations>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listParentsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres invalides." };

  const { page, per_page, search, sort_by, sort_order } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("parents")
      .select("*, user:users(*)", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);

    if (search) {
      query = query.or(`profession.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["profession", "created_at"].includes(sort_by)
        ? sort_by
        : "created_at";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const parentsList = (data ?? []) as any[];
    const withRelations: ParentWithRelations[] = await Promise.all(
      parentsList.map(async (p) => {
        // Query linked students
        const { data: links } = await db
          .from("student_parents")
          .select("student:students(id, student_number, user:users(name))")
          .eq("parent_id", p.id);

        const students = (links ?? []).map((l: any) => ({
          id: l.student?.id,
          student_number: l.student?.student_number,
          user: {
            name: l.student?.user?.name || "Sans nom",
          },
        }));

        return { ...p, students };
      })
    );

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: withRelations,
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les parents." };
  }
}

export async function createParentAction(
  values: CreateParentInput
): Promise<ActionResult<Parent>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createParentSchema.safeParse(values);
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

    // Check unique email
    const { data: existingUser } = await db
      .from("users")
      .select("id")
      .eq("email", validated.data.email.toLowerCase())
      .maybeSingle();

    if (existingUser) return { error: "Cet email est déjà utilisé." };

    // 1. Create auth user in Supabase Auth via Admin API
    const password = Math.random().toString(36).slice(-8); // Random default password
    const { data: authUser, error: authError } = await db.auth.admin.createUser({
      email: validated.data.email.toLowerCase(),
      email_confirm: true,
      password,
      user_metadata: { name: validated.data.name },
    });

    if (authError || !authUser.user) {
      return { error: authError?.message || "Erreur lors de la création du compte parent." };
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
      is_active: true,
    });

    if (userError) {
      await db.auth.admin.deleteUser(authUser.user.id);
      return { error: userError.message };
    }

    // 3. Assign Role 'parent'
    const { data: role } = await db
      .from("roles")
      .select("id")
      .eq("name", "parent")
      .maybeSingle();

    if (role) {
      await db.from("user_roles").insert({
        user_id: authUser.user.id,
        role_id: role.id,
        establishment_id: estId,
      });
    }

    // 4. Insert Parent record
    const { data: parent, error: parentError } = await db
      .from("parents")
      .insert({
        establishment_id: estId,
        user_id: authUser.user.id,
        relationship: validated.data.relationship,
        profession: validated.data.profession || null,
        is_emergency_contact: validated.data.is_emergency_contact,
      })
      .select()
      .single();

    if (parentError) {
      await db.from("users").delete().eq("id", authUser.user.id);
      await db.auth.admin.deleteUser(authUser.user.id);
      return { error: parentError.message };
    }

    // 5. Link students
    if (validated.data.student_ids && validated.data.student_ids.length > 0) {
      await db.from("student_parents").insert(
        validated.data.student_ids.map((studentId) => ({
          student_id: studentId,
          parent_id: parent.id,
        }))
      );
    }

    revalidatePath("/parents");
    return { success: true, data: parent as Parent };
  } catch {
    return { error: "Erreur lors de la création du profil parent." };
  }
}

export async function updateParentAction(
  id: string,
  values: UpdateParentInput
): Promise<ActionResult<Parent>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateParentSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();
    const { data: currentParent } = await db
      .from("parents")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!currentParent) return { error: "Parent introuvable." };

    // 1. Update User profile fields
    const userPayload: any = {};
    if (validated.data.name) userPayload.name = validated.data.name;
    if (validated.data.first_name !== undefined) userPayload.first_name = validated.data.first_name;
    if (validated.data.last_name !== undefined) userPayload.last_name = validated.data.last_name;
    if (validated.data.phone !== undefined) userPayload.phone = validated.data.phone;
    if (validated.data.gender !== undefined) userPayload.gender = validated.data.gender;
    if (validated.data.date_of_birth !== undefined) userPayload.date_of_birth = validated.data.date_of_birth;
    if (validated.data.address !== undefined) userPayload.address = validated.data.address;

    if (Object.keys(userPayload).length > 0) {
      const { error: userError } = await db
        .from("users")
        .update(userPayload)
        .eq("id", currentParent.user_id);

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

      if (emailOwner && emailOwner.id !== currentParent.user_id) {
        return { error: "Cet email est déjà utilisé." };
      }

      await db.from("users").update({ email: emailLower }).eq("id", currentParent.user_id);
      await db.auth.admin.updateUserById(currentParent.user_id, { email: emailLower });
    }

    // 3. Update Parent specific fields
    const parentPayload: any = {};
    if (validated.data.relationship) parentPayload.relationship = validated.data.relationship;
    if (validated.data.profession !== undefined) parentPayload.profession = validated.data.profession;
    if (validated.data.is_emergency_contact !== undefined) {
      parentPayload.is_emergency_contact = validated.data.is_emergency_contact;
    }

    const { data: updatedParent, error: parentError } = await db
      .from("parents")
      .update(parentPayload)
      .eq("id", id)
      .select()
      .single();

    if (parentError) return { error: parentError.message };

    // 4. Update student linkages
    if (validated.data.student_ids !== undefined) {
      await db.from("student_parents").delete().eq("parent_id", id);
      if (validated.data.student_ids.length > 0) {
        await db.from("student_parents").insert(
          validated.data.student_ids.map((studentId) => ({
            student_id: studentId,
            parent_id: id,
          }))
        );
      }
    }

    revalidatePath("/parents");
    return { success: true, data: updatedParent as Parent };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteParentAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { data: parent } = await db
      .from("parents")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!parent) return { error: "Parent introuvable." };

    const { error } = await db.auth.admin.deleteUser(parent.user_id);
    if (error) {
      await db.from("parents").delete().eq("id", id);
    }

    revalidatePath("/parents");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}
