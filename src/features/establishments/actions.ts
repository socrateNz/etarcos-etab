"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createEstablishmentSchema,
  updateEstablishmentFormSchema,
  listEstablishmentsSchema,
  type CreateEstablishmentInput,
  type UpdateEstablishmentFormInput,
  type ListEstablishmentsInput,
} from "./schemas";
import type { ActionResult, EstablishmentsListResult, EstablishmentListItem } from "./types";
import type { Establishment } from "@/types/database";

function can(role: SystemRole, permissions: string[], action: "view" | "create" | "edit" | "delete") {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "establishments", action);
}

async function requireAuth(action: "view" | "create" | "edit" | "delete") {
  const session = await auth();
  if (!session?.user) {
    return { error: "Non autorisé." as const };
  }
  if (!can(session.user.role, session.user.permissions, action)) {
    return { error: "Permission refusée." as const };
  }
  return { session };
}

/**
 * Liste paginée des établissements (Super Admin : tous ; Propriétaire : les siens).
 */
export async function listEstablishments(
  input: Partial<ListEstablishmentsInput> = {}
): Promise<ActionResult<EstablishmentsListResult>> {
  const authResult = await requireAuth("view");
  if ("error" in authResult && authResult.error) {
    return { error: authResult.error };
  }
  const { session } = authResult;

  const parsed = listEstablishmentsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Paramètres de recherche invalides." };
  }

  const { page, per_page, search, sort_by, sort_order, status, plan } = parsed.data;

  try {
    const isSuperAdmin = session!.user.role === "super_admin";
    const db = (await createAdminClient()) as any;

    let establishmentIds: string[] | undefined;

    if (!isSuperAdmin) {
      const { data: owner } = await db
        .from("owners")
        .select("id")
        .eq("user_id", session!.user.id)
        .maybeSingle();

      if (!owner) {
        return {
          success: true,
          data: { data: [], total: 0, page, per_page, total_pages: 0 },
        };
      }

      const { data: links } = await db
        .from("establishment_owners")
        .select("establishment_id")
        .eq("owner_id", owner.id);

      const ids = links?.map((l: { establishment_id: string }) => l.establishment_id) ?? [];
      establishmentIds = ids;
      if (ids.length === 0) {
        return {
          success: true,
          data: { data: [], total: 0, page, per_page, total_pages: 0 },
        };
      }
    }

    let query = db.from("establishments").select("*", { count: "exact" });

    if (establishmentIds) {
      query = query.in("id", establishmentIds);
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,slug.ilike.%${search}%,city.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    if (status) query = query.eq("status", status);
    if (plan) query = query.eq("plan", plan);

    const sortColumn = sort_by && ["name", "created_at", "status", "plan", "city"].includes(sort_by)
      ? sort_by
      : "created_at";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    query = query.range(from, from + per_page - 1);

    const { data, error, count } = await query;
    if (error) return { error: error.message };

    const total = count ?? 0;
    const total_pages = Math.ceil(total / per_page);

    return {
      success: true,
      data: {
        data: (data ?? []) as EstablishmentListItem[],
        total,
        page,
        per_page,
        total_pages,
      },
    };
  } catch {
    return { error: "Impossible de récupérer les établissements." };
  }
}

export async function getEstablishmentById(
  id: string
): Promise<ActionResult<Establishment>> {
  const authResult = await requireAuth("view");
  if ("error" in authResult && authResult.error) {
    return { error: authResult.error };
  }

  try {
    const isSuperAdmin = authResult.session!.user.role === "super_admin";
    const db = (await createAdminClient()) as any;

    const { data, error } = await db
      .from("establishments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Établissement introuvable." };

    if (!isSuperAdmin) {
      const allowed = await ownerCanAccessEstablishment(
        authResult.session!.user.id,
        id,
        db
      );
      if (!allowed) return { error: "Accès refusé à cet établissement." };
    }

    return { success: true, data: data as Establishment };
  } catch {
    return { error: "Erreur lors de la récupération de l'établissement." };
  }
}

export async function createEstablishmentAction(
  values: CreateEstablishmentInput
): Promise<ActionResult<Establishment>> {
  const authResult = await requireAuth("create");
  if ("error" in authResult && authResult.error) {
    return { error: authResult.error };
  }
  const { session } = authResult;

  const validated = createEstablishmentSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  const { name, address, city, country, phone, email, website, plan } = validated.data;
  const slug = validated.data.slug || slugify(name);

  try {
    const db = (await createAdminClient()) as any;

    const { data: existingSlug } = await db
      .from("establishments")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      return { error: "Ce slug est déjà utilisé." };
    }

    const { data: establishment, error: insertError } = await db
      .from("establishments")
      .insert({
        name,
        slug,
        address: address || null,
        city: city || null,
        country,
        phone: phone || null,
        email: email || null,
        website: website || null,
        status: "active",
        plan,
      })
      .select()
      .single();

    if (insertError || !establishment) {
      return { error: insertError?.message ?? "Erreur lors de la création." };
    }

    if (session!.user.role === "owner") {
      const { data: owner } = await db
        .from("owners")
        .select("id")
        .eq("user_id", session!.user.id)
        .maybeSingle();

      if (owner) {
        await db.from("establishment_owners").insert({
          establishment_id: establishment.id,
          owner_id: owner.id,
          role: "primary",
        });

        await db
          .from("users")
          .update({ establishment_id: establishment.id })
          .eq("id", session!.user.id);
      }
    }

    revalidatePath("/establishments");
    revalidatePath("/dashboard");

    return { success: true, data: establishment as Establishment };
  } catch {
    return { error: "Une erreur inattendue est survenue." };
  }
}

export async function updateEstablishmentAction(
  id: string,
  values: UpdateEstablishmentFormInput
): Promise<ActionResult<Establishment>> {
  const authResult = await requireAuth("edit");
  if ("error" in authResult && authResult.error) {
    return { error: authResult.error };
  }

  const validated = updateEstablishmentFormSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  const isSuperAdmin = authResult.session!.user.role === "super_admin";

  if (!isSuperAdmin) {
    const allowed = await ownerCanAccessEstablishment(
      authResult.session!.user.id,
      id,
      await createAdminClient()
    );
    if (!allowed) return { error: "Accès refusé." };
  }

  try {
    const db = (await createAdminClient()) as any;
    const payload = { ...validated.data };

    if (payload.slug) {
      const { data: conflict } = await db
        .from("establishments")
        .select("id")
        .eq("slug", payload.slug)
        .neq("id", id)
        .maybeSingle();
      if (conflict) return { error: "Ce slug est déjà utilisé." };
    }

    const { data, error } = await db
      .from("establishments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/establishments");
    revalidatePath("/dashboard");

    return { success: true, data: data as Establishment };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteEstablishmentAction(
  id: string
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if ("error" in authResult && authResult.error) {
    return { error: authResult.error };
  }

  const isSuperAdmin = authResult.session!.user.role === "super_admin";

  if (!isSuperAdmin) {
    return { error: "Seul un super administrateur peut supprimer un établissement." };
  }

  try {
    const db = (await createAdminClient()) as any;
    const { error } = await db.from("establishments").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/establishments");
    revalidatePath("/dashboard");

    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}

async function ownerCanAccessEstablishment(
  userId: string,
  establishmentId: string,
  db: Awaited<ReturnType<typeof createAdminClient>>
) {
  const client = db as any;
  const { data: owner } = await client
    .from("owners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!owner) return false;

  const { data: link } = await client
    .from("establishment_owners")
    .select("establishment_id")
    .eq("owner_id", owner.id)
    .eq("establishment_id", establishmentId)
    .maybeSingle();

  return !!link;
}
