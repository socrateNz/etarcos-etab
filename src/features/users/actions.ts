"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { generateTemporaryPassword } from "@/lib/auth/password";
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { SystemRole } from "@/types/auth";
import { hasPermission } from "@/types/permissions";
import { listEstablishments } from "@/features/establishments/actions";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "users", action);
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

export interface CreateUserInput {
  name: string;
  email: string;
  role: SystemRole;
  establishment_id: string;
  phone?: string;
  position?: string;
}

export async function listOwnerEstablishmentsAction() {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  try {
    const res = await listEstablishments({ per_page: 100 });
    if ("error" in res && res.error) return { error: res.error };

    const items = res.data?.data ?? [];
    return {
      data: items.map((e: any) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
      })),
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function listUsersScopedAction() {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };
  const session = authResult.session!;

  try {
    if (session.user.role === "super_admin") {
      await repairUserRolesAction();
    }
    const db = await getDb();
    let query = db
      .from("users")
      .select("*, establishment:establishments(id, name), user_roles(role:roles(name))");

    if (session.user.role === "owner") {
      const etabRes = await listOwnerEstablishmentsAction();
      const etabIds = (etabRes.data ?? []).map((e: any) => e.id);
      if (etabIds.length > 0) {
        query = query.in("establishment_id", etabIds);
      } else {
        return { data: [] };
      }
    } else if (session.user.role !== "super_admin") {
      if (session.user.establishment_id) {
        query = query.eq("establishment_id", session.user.establishment_id);
      } else {
        return { data: [] };
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const formatted = (data ?? []).map((u: any) => {
      const assignedRole = u.user_roles?.[0]?.role?.name || u.role || "user";
      return {
        ...u,
        role: assignedRole,
        status: u.is_active ? "active" : "suspended",
      };
    });

    return { data: formatted };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createUserScopedAction(values: CreateUserInput) {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };
  const session = authResult.session!;

  const emailLower = values.email.trim().toLowerCase();

  try {
    const db = await getDb();

    // 1. Verify owner owns the target establishment if role is owner
    if (session.user.role === "owner") {
      const { data: ownerProfile } = await db
        .from("owners")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const { data: link } = ownerProfile
        ? await db
            .from("establishment_owners")
            .select("establishment_id")
            .eq("owner_id", ownerProfile.id)
            .eq("establishment_id", values.establishment_id)
            .maybeSingle()
        : { data: null };

      if (!link) {
        return { error: "L'établissement sélectionné ne vous appartient pas." };
      }
    } else if (session.user.role !== "super_admin") {
      values.establishment_id = session.user.establishment_id!;
    }

    // 2. ENFORCE SINGLE DIRECTOR PER ESTABLISHMENT RULE
    if (values.role === "director") {
      const { data: existingDirectorRoles } = await db
        .from("user_roles")
        .select("user_id, role:roles!inner(name), user:users!inner(establishment_id, is_active)")
        .eq("role.name", "director")
        .eq("user.establishment_id", values.establishment_id)
        .eq("user.is_active", true);

      if (existingDirectorRoles && existingDirectorRoles.length > 0) {
        return {
          error: "Cet établissement possède déjà un Directeur d'Établissement. Un seul directeur est autorisé par établissement.",
        };
      }
    }

    // 3. Check if email exists
    const { data: existingUser } = await db
      .from("users")
      .select("id")
      .eq("email", emailLower)
      .maybeSingle();

    if (existingUser) return { error: "Cet email est déjà utilisé." };

    // 4. Create user in Supabase Auth
    const password = generateTemporaryPassword();
    const { data: authUser, error: authError } = await db.auth.admin.createUser({
      email: emailLower,
      email_confirm: true,
      password,
      user_metadata: { name: values.name, requires_password_change: true },
    });

    if (authError || !authUser?.user) {
      return { error: authError?.message || "Erreur de création d'utilisateur dans le service d'authentification." };
    }

    const userId = authUser.user.id;

    // 5. Insert User profile
    const { error: userError } = await db.from("users").insert({
      id: userId,
      email: emailLower,
      name: values.name,
      establishment_id: values.establishment_id,
      is_active: true,
      email_verified: false,
      requires_password_change: true,
    });

    if (userError) {
      await db.auth.admin.deleteUser(userId);
      return { error: userError.message };
    }

    // 6. Assign Role in DB (Ensure role exists in roles table)
    let { data: roleObj } = await db
      .from("roles")
      .select("id")
      .or(`slug.eq.${values.role},name.eq.${values.role}`)
      .maybeSingle();

    if (!roleObj) {
      const { data: newRole } = await db
        .from("roles")
        .insert({
          name: values.role === "director" ? "Directeur d'Établissement" : values.role.charAt(0).toUpperCase() + values.role.slice(1),
          slug: values.role,
          is_system: true,
        })
        .select("id")
        .single();
      roleObj = newRole;
    }

    if (roleObj) {
      await db.from("user_roles").insert({
        user_id: userId,
        role_id: roleObj.id,
        establishment_id: values.establishment_id,
      });
    }

    // 7. If staff role, create staff_members record
    const staffRoles = ["director", "censor", "accountant", "teacher", "secretary", "librarian", "lab_manager"];
    if (staffRoles.includes(values.role)) {
      const empNumber = "EMP-" + Math.floor(10000 + Math.random() * 90000);
      await db.from("staff_members").insert({
        user_id: userId,
        establishment_id: values.establishment_id,
        employee_number: empNumber,
        position: values.position || values.role,
        status: "active",
      });
    }

    await sendWelcomeEmail({ email: emailLower, name: values.name, tempPassword: password });

    revalidatePath("/users");
    revalidatePath("/staff");
    return { success: true, data: { userId, password } };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function resetUserPasswordAction(targetUserId: string) {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };
  const session = authResult.session!;

  try {
    const db = await getDb();

    // 1. Get user email & profile
    const { data: targetUser } = await db
      .from("users")
      .select("id, email, name, establishment_id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (!targetUser) return { error: "Utilisateur non trouvé." };

    // Tenant scoping: directors are locked to their own establishment; owners
    // may only act on establishments they're linked to via establishment_owners.
    if (session.user.role === "director") {
      if (targetUser.establishment_id !== session.user.establishment_id) {
        return { error: "Cet utilisateur n'appartient pas à votre établissement." };
      }
    } else if (session.user.role === "owner") {
      const { data: ownerProfile } = await db
        .from("owners")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const { data: link } = ownerProfile
        ? await db
            .from("establishment_owners")
            .select("establishment_id")
            .eq("owner_id", ownerProfile.id)
            .eq("establishment_id", targetUser.establishment_id)
            .maybeSingle()
        : { data: null };

      if (!link) {
        return { error: "Cet utilisateur n'appartient pas à l'un de vos établissements." };
      }
    }

    // 2. Generate random temporary password
    const newTempPassword = generateTemporaryPassword();

    // 3. Update Supabase Auth user password
    const { error: authError } = await db.auth.admin.updateUserById(targetUserId, {
      password: newTempPassword,
      user_metadata: { requires_password_change: true },
    });

    if (authError) throw new Error(authError.message);

    // 4. Update users table requires_password_change flag
    await db
      .from("users")
      .update({
        requires_password_change: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId);

    await sendPasswordResetEmail({ email: targetUser.email, name: targetUser.name, tempPassword: newTempPassword });

    revalidatePath("/users");
    revalidatePath("/staff");

    return {
      success: true,
      data: {
        email: targetUser.email,
        name: targetUser.name,
        tempPassword: newTempPassword,
      },
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function completePasswordChangeAction(newPassword: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non authentifié." };

  try {
    const db = await getDb();

    const { error: authError } = await db.auth.admin.updateUserById(session.user.id, {
      password: newPassword,
      user_metadata: { requires_password_change: false },
    });

    if (authError) throw new Error(authError.message);

    await db
      .from("users")
      .update({
        requires_password_change: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function repairUserRolesAction() {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };
  if (session.user.role !== "super_admin") {
    return { error: "Réservé aux super-administrateurs." };
  }

  try {
    const db = await getDb();

    // 1. Get all staff_members with their user_id, position, establishment_id
    const { data: staffMembers } = await db
      .from("staff_members")
      .select("user_id, position, establishment_id");

    let repairedCount = 0;

    for (const sm of staffMembers ?? []) {
      if (!sm.user_id) continue;

      // Check if user already has a user_roles record
      const { data: existingUr } = await db
        .from("user_roles")
        .select("id")
        .eq("user_id", sm.user_id)
        .maybeSingle();

      if (!existingUr) {
        // Determine role from position
        let roleName = "teacher";
        const pos = (sm.position || "").toLowerCase();
        if (pos.includes("direct") || pos.includes("dir")) roleName = "director";
        else if (pos.includes("cens") || pos.includes("survei")) roleName = "censor";
        else if (pos.includes("compt") || pos.includes("financ") || pos.includes("account")) roleName = "accountant";
        else if (pos.includes("secr")) roleName = "secretary";
        else if (pos.includes("biblio") || pos.includes("lib")) roleName = "librarian";

        // Find role ID by slug or name
        let { data: roleObj } = await db
          .from("roles")
          .select("id")
          .or(`slug.eq.${roleName},name.eq.${roleName}`)
          .maybeSingle();

        if (!roleObj) {
          const { data: newRole } = await db
            .from("roles")
            .insert({
              name: roleName === "director" ? "Directeur d'Établissement" : roleName.charAt(0).toUpperCase() + roleName.slice(1),
              slug: roleName,
              is_system: true,
            })
            .select("id")
            .single();
          roleObj = newRole;
        }

        if (roleObj) {
          await db.from("user_roles").insert({
            user_id: sm.user_id,
            role_id: roleObj.id,
            establishment_id: sm.establishment_id,
          });
          repairedCount++;
        }
      }
    }

    revalidatePath("/users");
    revalidatePath("/staff");

    return { success: true, repairedCount };
  } catch (err: any) {
    return { error: err.message };
  }
}
