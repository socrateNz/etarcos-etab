"use server";

import { resolveEstablishmentId, assertEstablishmentOwnership } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ListExpensesInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  Expense,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "expenses", action);
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

export async function listExpenses(
  input: Partial<ListExpensesInput> = {}
): Promise<ActionResult<PaginatedResult<Expense>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listExpensesSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres de recherche invalides." };

  const { page, per_page, search, sort_by, sort_order, category } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("expenses")
      .select("*, creator:users(id, name)", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (category) query = query.eq("category", category);

    if (search) {
      query = query.or(`category.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["expense_date", "amount", "created_at"].includes(sort_by)
        ? sort_by
        : "expense_date";
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    const from = (page - 1) * per_page;
    const { data, error, count } = await query.range(from, from + per_page - 1);
    if (error) return { error: error.message };

    const total = count ?? 0;
    return {
      success: true,
      data: {
        data: (data ?? []) as Expense[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger les dépenses." };
  }
}

export async function createExpenseAction(
  values: CreateExpenseInput
): Promise<ActionResult<Expense>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createExpenseSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    validated.data.establishment_id
  );
  if (!estId) return { error: "Aucun établissement associé." };

  try {
    const db = await getDb();
    const { category, description, amount, expense_date, receipt_url } = validated.data;
    const userId = authResult.session!.user.id;

    const { data, error } = await db
      .from("expenses")
      .insert({
        establishment_id: estId,
        category,
        description,
        amount,
        expense_date,
        receipt_url: receipt_url || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/expenses");
    return { success: true, data: data as Expense };
  } catch {
    return { error: "Erreur lors de l'enregistrement de la dépense." };
  }
}

export async function updateExpenseAction(
  id: string,
  values: UpdateExpenseInput
): Promise<ActionResult<Expense>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updateExpenseSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();

    const guard = await assertEstablishmentOwnership(
      db, "expenses", id, authResult.session!.user.establishment_id,
      "Dépense introuvable.", "Vous n'avez pas accès à cette dépense."
    );
    if ("error" in guard) return { error: guard.error };

    const payload = { ...validated.data };
    delete payload.establishment_id;

    if (payload.receipt_url === "") payload.receipt_url = null;

    const { data, error } = await db
      .from("expenses")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/expenses");
    return { success: true, data: data as Expense };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();

    const guard = await assertEstablishmentOwnership(
      db, "expenses", id, authResult.session!.user.establishment_id,
      "Dépense introuvable.", "Vous n'avez pas accès à cette dépense."
    );
    if ("error" in guard) return { error: guard.error };

    const { error } = await db.from("expenses").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/expenses");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression de la dépense." };
  }
}
