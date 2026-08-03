"use server";

import { resolveEstablishmentId, assertEstablishmentOwnership } from "@/lib/auth/active-etab";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createDocumentSchema,
  listDocumentsSchema,
  type CreateDocumentInput,
  type ListDocumentsInput,
} from "./schemas";
import type { ActionResult, DocumentRecord, PaginatedResult } from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "documents", action);
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

export async function listDocumentsAction(
  params: Partial<ListDocumentsInput> = {},
  establishmentId?: string
): Promise<ActionResult<PaginatedResult<DocumentRecord>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = listDocumentsSchema.safeParse(params);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Paramètres invalides." };

  const { search, category, page, page_size } = validated.data;
  const offset = (page - 1) * page_size;

  try {
    const db = await getDb();

    let query = db
      .from("documents")
      .select("*, owner:users(id, name)", { count: "exact" })
      .eq("establishment_id", estId);

    if (search) query = query.ilike("title", `%${search}%`);
    if (category) query = query.eq("category", category);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + page_size - 1);

    if (error) return { error: error.message };

    return {
      success: true,
      data: {
        data: (data ?? []) as DocumentRecord[],
        total: count ?? 0,
        page,
        pageSize: page_size,
      },
    };
  } catch {
    return { error: "Erreur lors du chargement des documents." };
  }
}

export async function createDocumentAction(
  values: CreateDocumentInput,
  establishmentId?: string
): Promise<ActionResult<DocumentRecord>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = createDocumentSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = await getDb();
    const userId = authResult.session!.user.id;

    const { data, error } = await db
      .from("documents")
      .insert({
        ...validated.data,
        establishment_id: estId,
        owner_id: userId,
      })
      .select("*, owner:users(id, name)")
      .single();

    if (error) return { error: error.message };
    revalidatePath("/documents");
    return { success: true, data: data as DocumentRecord };
  } catch {
    return { error: "Erreur lors de l'enregistrement du document." };
  }
}

export async function deleteDocumentAction(
  id: string
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();

    const guard = await assertEstablishmentOwnership(
      db, "documents", id, authResult.session!.user.establishment_id,
      "Document introuvable.", "Vous n'avez pas accès à ce document."
    );
    if ("error" in guard) return { error: guard.error };

    const { error } = await db.from("documents").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/documents");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression du document." };
  }
}
