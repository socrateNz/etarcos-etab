"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createFeeCategorySchema,
  createPaymentSchema,
  updatePaymentSchema,
  listPaymentsSchema,
  type CreateFeeCategoryInput,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type ListPaymentsInput,
} from "./schemas";
import type {
  ActionResult,
  PaginatedResult,
  FeeCategory,
  Payment,
  PaymentWithRelations,
} from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "payments", action);
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

// ========== FEE CATEGORIES ==========

export async function listFeeCategories(
  establishmentId?: string
): Promise<ActionResult<FeeCategory[]>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();
    const { data, error } = await db
      .from("fee_categories")
      .select("*, level:levels(id, name)")
      .eq("establishment_id", estId)
      .order("created_at", { ascending: false });

    if (error) return { error: error.message };
    return { success: true, data: data as FeeCategory[] };
  } catch {
    return { error: "Impossible de charger les grilles tarifaires." };
  }
}

export async function createFeeCategoryAction(
  values: CreateFeeCategoryInput
): Promise<ActionResult<FeeCategory>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createFeeCategorySchema.safeParse(values);
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

    // Fetch active academic year
    const { data: currentYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", estId)
      .eq("is_current", true)
      .maybeSingle();

    if (!currentYear) return { error: "Aucune année académique active." };

    const { name, description, amount, level_id, is_mandatory } = validated.data;

    const { data, error } = await db
      .from("fee_categories")
      .insert({
        establishment_id: estId,
        name,
        description: description || null,
        amount,
        academic_year_id: currentYear.id,
        level_id: level_id || null,
        is_mandatory,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/payments");
    return { success: true, data: data as FeeCategory };
  } catch {
    return { error: "Erreur lors de la création de la catégorie de frais." };
  }
}

export async function deleteFeeCategoryAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { error } = await db.from("fee_categories").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/payments");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression de la catégorie de frais." };
  }
}

// ========== PAYMENTS ==========

export async function listPayments(
  input: Partial<ListPaymentsInput> = {}
): Promise<ActionResult<PaginatedResult<PaymentWithRelations>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const parsed = listPaymentsSchema.safeParse(input);
  if (!parsed.success) return { error: "Paramètres de recherche invalides." };

  const { page, per_page, search, sort_by, sort_order, student_id, status } = parsed.data;
  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    parsed.data.establishment_id
  );

  try {
    const db = await getDb();
    let query = db
      .from("payments")
      .select("*, student:students(id, student_number, user:users(name), classroom:classrooms(id, name)), fee_category:fee_categories(id, name), creator:users(id, name)", { count: "exact" });

    if (estId) query = query.eq("establishment_id", estId);
    if (student_id) query = query.eq("student_id", student_id);
    if (status) query = query.eq("status", status);

    if (search) {
      query = query.or(`receipt_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const sortColumn =
      sort_by && ["payment_date", "amount_paid", "created_at"].includes(sort_by)
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
        data: (data ?? []) as PaymentWithRelations[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch {
    return { error: "Impossible de charger l'historique des règlements." };
  }
}

export async function createPaymentAction(
  values: CreatePaymentInput
): Promise<ActionResult<Payment>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const validated = createPaymentSchema.safeParse(values);
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

    // 1. Fetch active academic year
    const { data: currentYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", estId)
      .eq("is_current", true)
      .maybeSingle();

    if (!currentYear) return { error: "Aucune année académique active." };

    // 2. Fetch fee category to get the base total amount
    const { data: feeCategory } = await db
      .from("fee_categories")
      .select("amount")
      .eq("id", validated.data.fee_category_id)
      .maybeSingle();

    if (!feeCategory) return { error: "Catégorie de frais introuvable." };

    const totalAmount = Number(feeCategory.amount);
    const amountPaid = validated.data.amount_paid;
    const balance = totalAmount - amountPaid;

    let status: "paid" | "partial" | "pending" = "partial";
    if (balance <= 0) {
      status = "paid";
    }

    // 3. Generate a receipt number
    const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;

    const { student_id, fee_category_id, payment_method, notes, due_date } = validated.data;
    const userId = authResult.session!.user.id;

    const { data, error } = await db
      .from("payments")
      .insert({
        establishment_id: estId,
        student_id,
        fee_category_id,
        academic_year_id: currentYear.id,
        amount: totalAmount,
        amount_paid: amountPaid,
        status,
        payment_date: new Date().toISOString().split("T")[0],
        due_date: due_date || new Date().toISOString().split("T")[0],
        receipt_number: receiptNumber,
        payment_method,
        notes: notes || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/payments");
    return { success: true, data: data as Payment };
  } catch {
    return { error: "Erreur lors de l'enregistrement de la transaction." };
  }
}

export async function updatePaymentAction(
  id: string,
  values: UpdatePaymentInput
): Promise<ActionResult<Payment>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const validated = updatePaymentSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const db = await getDb();
    const { amount_paid, payment_method, status, notes } = validated.data;

    const { data, error } = await db
      .from("payments")
      .update({
        amount_paid,
        payment_method,
        status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/payments");
    return { success: true, data: data as Payment };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function deletePaymentAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();
    const { error } = await db.from("payments").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/payments");
    return { success: true };
  } catch {
    return { error: "Erreur lors de l'annulation du versement." };
  }
}
