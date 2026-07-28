"use server";

import { resolveEstablishmentId } from "@/lib/auth/active-etab";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createBookSchema,
  updateBookSchema,
  createLoanSchema,
  returnLoanSchema,
  listBooksSchema,
  type CreateBookInput,
  type UpdateBookInput,
  type CreateLoanInput,
  type ReturnLoanInput,
  type ListBooksInput,
} from "./schemas";
import type { ActionResult, BookWithLoans, LoanWithRelations, PaginatedResult } from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "library", action);
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

// ========== BOOKS ==========

export async function listBooksAction(
  params: ListBooksInput = {},
  establishmentId?: string
): Promise<ActionResult<PaginatedResult<BookWithLoans>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = listBooksSchema.safeParse(params);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Paramètres invalides." };

  const { search, category, available_only, page, page_size } = validated.data;
  const offset = (page - 1) * page_size;

  try {
    const db = await getDb();

    let query = db
      .from("library_books")
      .select("*", { count: "exact" })
      .eq("establishment_id", estId);

    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (available_only) {
      query = query.gt("available_qty", 0);
    }

    const { data, count, error } = await query
      .order("title", { ascending: true })
      .range(offset, offset + page_size - 1);

    if (error) return { error: error.message };

    return {
      success: true,
      data: {
        data: (data ?? []) as BookWithLoans[],
        total: count ?? 0,
        page,
        pageSize: page_size,
      },
    };
  } catch {
    return { error: "Erreur lors du chargement des livres." };
  }
}

export async function createBookAction(
  values: CreateBookInput,
  establishmentId?: string
): Promise<ActionResult<BookWithLoans>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = createBookSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = await getDb();
    const { data, error } = await db
      .from("library_books")
      .insert({
        ...validated.data,
        establishment_id: estId,
        available_qty: validated.data.quantity,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath("/library");
    return { success: true, data: data as BookWithLoans };
  } catch {
    return { error: "Erreur lors de la création du livre." };
  }
}

export async function updateBookAction(
  values: UpdateBookInput,
  establishmentId?: string
): Promise<ActionResult<BookWithLoans>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = updateBookSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  const { id, ...rest } = validated.data;

  try {
    const db = await getDb();
    const { data, error } = await db
      .from("library_books")
      .update(rest)
      .eq("id", id)
      .eq("establishment_id", estId)
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath("/library");
    return { success: true, data: data as BookWithLoans };
  } catch {
    return { error: "Erreur lors de la modification du livre." };
  }
}

export async function deleteBookAction(
  bookId: string,
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

    // Prevent deletion if active loans exist
    const { count } = await db
      .from("library_loans")
      .select("*", { count: "exact", head: true })
      .eq("book_id", bookId)
      .is("return_date", null);

    if (count && count > 0) {
      return { error: "Impossible de supprimer ce livre : des prêts en cours existent." };
    }

    const { error } = await db
      .from("library_books")
      .delete()
      .eq("id", bookId)
      .eq("establishment_id", estId);

    if (error) return { error: error.message };
    revalidatePath("/library");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression du livre." };
  }
}

// ========== LOANS ==========

export async function listLoansAction(
  establishmentId?: string,
  activeOnly?: boolean
): Promise<ActionResult<LoanWithRelations[]>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();

    let query = db
      .from("library_loans")
      .select("*, book:library_books(id, title, author), borrower:users(id, name)")
      .eq("establishment_id", estId)
      .order("loan_date", { ascending: false });

    if (activeOnly) {
      query = query.is("return_date", null);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { success: true, data: (data ?? []) as LoanWithRelations[] };
  } catch {
    return { error: "Erreur lors du chargement des prêts." };
  }
}

export async function createLoanAction(
  values: CreateLoanInput,
  establishmentId?: string
): Promise<ActionResult<LoanWithRelations>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = createLoanSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = await getDb();

    // Check availability (trigger will also enforce this, but early check for better UX)
    const { data: book } = await db
      .from("library_books")
      .select("available_qty, title")
      .eq("id", validated.data.book_id)
      .single();

    if (!book || book.available_qty <= 0) {
      return { error: `Aucun exemplaire disponible pour "${book?.title ?? "ce livre"}".` };
    }

    const { data, error } = await db
      .from("library_loans")
      .insert({
        ...validated.data,
        establishment_id: estId,
        loan_date: new Date().toISOString().split("T")[0],
      })
      .select("*, book:library_books(id, title, author), borrower:users(id, name)")
      .single();

    if (error) return { error: error.message };
    revalidatePath("/library");
    return { success: true, data: data as LoanWithRelations };
  } catch {
    return { error: "Erreur lors de la création du prêt." };
  }
}

export async function returnLoanAction(
  values: ReturnLoanInput,
  establishmentId?: string
): Promise<ActionResult<void>> {
  const authResult = await requireAuth("edit");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = returnLoanSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = await getDb();
    const { error } = await db
      .from("library_loans")
      .update({
        return_date: validated.data.return_date,
        notes: validated.data.notes ?? null,
      })
      .eq("id", validated.data.loan_id)
      .eq("establishment_id", estId)
      .is("return_date", null); // safety: only update open loans

    if (error) return { error: error.message };
    revalidatePath("/library");
    return { success: true };
  } catch {
    return { error: "Erreur lors du retour du livre." };
  }
}

export async function getLibraryStatsAction(
  establishmentId?: string
): Promise<ActionResult<{
  total_books: number;
  total_copies: number;
  available_copies: number;
  active_loans: number;
  overdue_loans: number;
}>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  try {
    const db = await getDb();
    const today = new Date().toISOString().split("T")[0];

    const [{ count: total_books }, { data: booksData }, { count: active_loans }, { count: overdue_loans }] =
      await Promise.all([
        db.from("library_books").select("*", { count: "exact", head: true }).eq("establishment_id", estId),
        db.from("library_books").select("quantity, available_qty").eq("establishment_id", estId),
        db.from("library_loans").select("*", { count: "exact", head: true }).eq("establishment_id", estId).is("return_date", null),
        db.from("library_loans").select("*", { count: "exact", head: true }).eq("establishment_id", estId).is("return_date", null).lt("due_date", today),
      ]);

    const books = (booksData ?? []) as Array<{ quantity: number; available_qty: number }>;
    const total_copies = books.reduce((sum, b) => sum + (b.quantity ?? 0), 0);
    const available_copies = books.reduce((sum, b) => sum + (b.available_qty ?? 0), 0);

    return {
      success: true,
      data: {
        total_books: total_books ?? 0,
        total_copies,
        available_copies,
        active_loans: active_loans ?? 0,
        overdue_loans: overdue_loans ?? 0,
      },
    };
  } catch {
    return { error: "Erreur lors du calcul des statistiques bibliothèque." };
  }
}
