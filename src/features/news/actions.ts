"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createNewsPostSchema,
  updateNewsPostSchema,
  listNewsPostsSchema,
  type CreateNewsPostInput,
  type UpdateNewsPostInput,
  type ListNewsPostsInput,
} from "./schemas";
import type { ActionResult, NewsPostWithAuthor, PaginatedResult } from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "news", action);
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

export async function listNewsPostsAction(
  params: Partial<ListNewsPostsInput> = {},
  establishmentId?: string
): Promise<ActionResult<PaginatedResult<NewsPostWithAuthor>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = listNewsPostsSchema.safeParse(params);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Paramètres invalides." };

  const { search, published_only, page, page_size } = validated.data;
  const offset = (page - 1) * page_size;

  try {
    const db = await getDb();

    let query = db
      .from("news_posts")
      .select("*, author:users(id, name)", { count: "exact" })
      .eq("establishment_id", estId);

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    if (published_only) {
      query = query.eq("is_published", true);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + page_size - 1);

    if (error) return { error: error.message };

    return {
      success: true,
      data: {
        data: (data ?? []) as NewsPostWithAuthor[],
        total: count ?? 0,
        page,
        pageSize: page_size,
      },
    };
  } catch {
    return { error: "Erreur lors du chargement des actualités." };
  }
}

export async function createNewsPostAction(
  values: CreateNewsPostInput,
  establishmentId?: string
): Promise<ActionResult<NewsPostWithAuthor>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = createNewsPostSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = await getDb();
    const userId = authResult.session!.user.id;

    const { data, error } = await db
      .from("news_posts")
      .insert({
        ...validated.data,
        establishment_id: estId,
        author_id: userId,
        published_at: validated.data.is_published ? new Date().toISOString() : null,
      })
      .select("*, author:users(id, name)")
      .single();

    if (error) return { error: error.message };
    revalidatePath("/news");
    return { success: true, data: data as NewsPostWithAuthor };
  } catch {
    return { error: "Erreur lors de la création de l'annonce." };
  }
}

export async function updateNewsPostAction(
  values: UpdateNewsPostInput,
  establishmentId?: string
): Promise<ActionResult<NewsPostWithAuthor>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = updateNewsPostSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  const { id, ...rest } = validated.data;

  try {
    const db = await getDb();
    const updates: any = { ...rest };
    if (rest.is_published !== undefined) {
      updates.published_at = rest.is_published ? new Date().toISOString() : null;
    }

    const { data, error } = await db
      .from("news_posts")
      .update(updates)
      .eq("id", id)
      .eq("establishment_id", estId)
      .select("*, author:users(id, name)")
      .single();

    if (error) return { error: error.message };
    revalidatePath("/news");
    return { success: true, data: data as NewsPostWithAuthor };
  } catch {
    return { error: "Erreur lors de la modification de l'annonce." };
  }
}

export async function deleteNewsPostAction(
  postId: string,
  establishmentId?: string
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();
    const { error } = await db
      .from("news_posts")
      .delete()
      .eq("id", postId)
      .eq("establishment_id", estId);

    if (error) return { error: error.message };
    revalidatePath("/news");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression de l'annonce." };
  }
}
