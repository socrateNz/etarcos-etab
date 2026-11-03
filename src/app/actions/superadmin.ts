"use server";

import { auth } from "@/lib/auth/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { createAdminClient } from "@/lib/supabase/server";
import { generateTemporaryPassword } from "@/lib/auth/password";
import { sendWelcomeEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== "super_admin") {
    throw new Error("Accès refusé. Réservé aux super-administrateurs.");
  }
  return session;
}

async function getDb(): Promise<SupabaseClient<Database>> {
  return (await createAdminClient()) as unknown as SupabaseClient<Database>;
}

// ========== OWNERS ==========

export async function listOwnersAction() {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const { data, error } = await db
      .from("owners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function createOwnerAction(values: { name: string; email: string; phone?: string }) {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const emailLower = values.email.toLowerCase();

    // Check if user already exists
    const { data: existingUser } = await db
      .from("users")
      .select("id")
      .eq("email", emailLower)
      .maybeSingle();

    if (existingUser) return { error: "Cet email est déjà utilisé." };

    // 1. Create in Supabase Auth
    const password = generateTemporaryPassword();
    const { data: authUser, error: authError } = await db.auth.admin.createUser({
      email: emailLower,
      email_confirm: true,
      password,
      user_metadata: { name: values.name, requires_password_change: true },
    });

    if (authError || !authUser?.user) {
      return { error: authError?.message || "Erreur d'authentification Supabase." };
    }

    const userId = authUser.user.id;
    const defaultEstId = "00000000-0000-0000-0000-000000000000";

    // 2. Insert User profile
    const { error: userError } = await db.from("users").insert({
      id: userId,
      email: emailLower,
      name: values.name,
      establishment_id: defaultEstId,
      is_active: true,
      email_verified: false,
    });

    if (userError) {
      await db.auth.admin.deleteUser(userId);
      return { error: userError.message };
    }

    // 3. Insert Owner profile
    const { data: ownerProfile, error: ownerError } = await db
      .from("owners")
      .insert({
        user_id: userId,
        name: values.name,
        email: emailLower,
        phone: values.phone || null,
        status: "active",
      })
      .select()
      .single();

    if (ownerError) {
      await db.auth.admin.deleteUser(userId);
      await db.from("users").delete().eq("id", userId);
      return { error: ownerError.message };
    }

    await sendWelcomeEmail({ email: emailLower, name: values.name, tempPassword: password });

    revalidatePath("/owners");
    return { success: true, data: { ...ownerProfile, password } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function deleteOwnerAction(id: string) {
  await requireSuperAdmin();
  try {
    const db = await getDb();

    // Get owner user_id
    const { data: owner } = await db
      .from("owners")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (owner?.user_id) {
      // Delete auth user
      await db.auth.admin.deleteUser(owner.user_id);
      // Delete user profile
      await db.from("users").delete().eq("id", owner.user_id);
    }

    // Delete owner profile
    const { error } = await db.from("owners").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/owners");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

// ========== USERS ==========

export async function listUsersAction() {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const { data, error } = await db
      .from("users")
      .select("*, establishment:establishments(name)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function updateUserStatusAction(id: string, status: string) {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    // The `users` table has no `status` column — "active"/"suspended" is a
    // derived label (see listUsersScopedAction) backed by `is_active`.
    const { error } = await db
      .from("users")
      .update({ is_active: status === "active", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/users");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function deleteUserAction(id: string) {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const { error } = await db.from("users").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/users");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

// ========== ESTABLISHMENT PLANS (ABONNEMENTS) ==========

export async function listEstablishmentPlans() {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const { data, error } = await db
      .from("establishments")
      .select("id, name, slug, status, plan, logo_url, created_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

const ESTABLISHMENT_PLANS = ["free", "starter", "professional", "enterprise"] as const;

export async function updateEstablishmentPlan(id: string, plan: string) {
  await requireSuperAdmin();
  if (!(ESTABLISHMENT_PLANS as readonly string[]).includes(plan)) {
    return { error: "Formule inconnue." };
  }
  try {
    const db = await getDb();
    const { error } = await db
      .from("establishments")
      .update({ plan: plan as Database["public"]["Enums"]["establishment_plan"], updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

// ========== SYSTEM NOTIFICATIONS ==========

export async function listNotificationsAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Non authentifié." };
    }

    const db = await getDb();
    let query = db.from("notifications").select("*, user:users(name)");

    if (session.user.role !== "super_admin") {
      query = query.eq("user_id", session.user.id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { data: data ?? [] };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function createSystemNotificationAction(values: {
  title: string;
  message: string;
  type: string;
}) {
  const session = await requireSuperAdmin();
  try {
    const db = await getDb();

    // Fetch all user IDs to dispatch notification
    const { data: users, error: usersErr } = await db.from("users").select("id");
    if (usersErr) throw new Error(usersErr.message);

    const notificationPayloads = (users ?? []).map((u: any) => ({
      user_id: u.id,
      title: values.title,
      message: values.message,
      type: values.type,
      is_read: false,
    }));

    if (notificationPayloads.length > 0) {
      const { error } = await db.from("notifications").insert(notificationPayloads);
      if (error) throw new Error(error.message);
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function listAuditLogsAction() {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const { data, error } = await db
      .from("audit_logs")
      .select("*, user:users(name), establishment:establishments(name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

// ========== OWNER ASSOCIATIONS ==========

export async function listOwnerLinksAction(ownerId: string) {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const { data, error } = await db
      .from("establishment_owners")
      .select("*, establishment:establishments(id, name, slug)")
      .eq("owner_id", ownerId);

    if (error) throw new Error(error.message);
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function associateOwnerAction(
  ownerId: string,
  establishmentId: string,
  role: string
) {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const { data, error } = await db
      .from("establishment_owners")
      .upsert({
        owner_id: ownerId,
        establishment_id: establishmentId,
        role: role as Database["public"]["Enums"]["owner_role"],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/owners");
    return { success: true, data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function dissociateOwnerAction(ownerId: string, establishmentId: string) {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const { error } = await db
      .from("establishment_owners")
      .delete()
      .eq("owner_id", ownerId)
      .eq("establishment_id", establishmentId);

    if (error) throw new Error(error.message);
    revalidatePath("/owners");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

/** Effectifs réels par type de profil, sur toute la plateforme. */
export async function getPlatformProfileCountsAction() {
  await requireSuperAdmin();
  try {
    const db = await getDb();
    const count = async (table: "students" | "staff_members" | "parents" | "owners") => {
      const { count: c, error } = await db.from(table).select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return c ?? 0;
    };
    const [students, staff, parents, owners] = await Promise.all([
      count("students"),
      count("staff_members"),
      count("parents"),
      count("owners"),
    ]);
    return { data: { students, staff, parents, owners } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}
