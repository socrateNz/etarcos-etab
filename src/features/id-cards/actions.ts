"use server";

import { randomBytes } from "crypto";
import { resolveEstablishmentId, assertEstablishmentOwnership } from "@/lib/auth/active-etab";
import { resolveActiveAcademicYearId } from "@/app/actions/academic-years";
import { auth } from "@/lib/auth/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createIdCardSchema,
  batchCreateIdCardsSchema,
  listIdCardsSchema,
  type CreateIdCardInput,
  type BatchCreateIdCardsInput,
  type ListIdCardsInput,
} from "./schemas";
import type { ActionResult, IdCard, PaginatedResult } from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

const SELECT_WITH_RELATIONS =
  "*, student:students(id, student_number, user:users(id, name, avatar_url, date_of_birth, gender), classroom:classrooms(id, name)), academic_year:academic_years(id, name), establishment:establishments(id, name, logo_url, address, city, phone)";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "id_cards", action);
}

async function requireAuth(action: CrudAction) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." as const };
  if (!can(session.user.role, session.user.permissions, action)) {
    return { error: "Permission refusée." as const };
  }
  return { session };
}

async function getDb(): Promise<SupabaseClient<Database>> {
  return (await createAdminClient()) as unknown as SupabaseClient<Database>;
}

function generateSerialNumber(): string {
  const year = new Date().getFullYear();
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `CARD-${year}-${suffix}`;
}

// Default expiry: 31 August of the year following issuance, unless overridden.
function defaultExpiryDate(issueDate: string): string {
  return `${new Date(issueDate).getFullYear() + 1}-08-31`;
}

export async function listIdCardsAction(
  params: Partial<ListIdCardsInput> = {},
  establishmentId?: string
): Promise<ActionResult<PaginatedResult<IdCard>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = listIdCardsSchema.safeParse(params);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Paramètres invalides." };

  const { search, classroom_id, page, page_size } = validated.data;
  const offset = (page - 1) * page_size;

  try {
    const db = await getDb();

    let query = db
      .from("id_cards")
      .select(
        "*, student:students!inner(id, student_number, classroom_id, user:users(id, name, avatar_url, date_of_birth, gender), classroom:classrooms(id, name)), academic_year:academic_years(id, name), establishment:establishments(id, name, logo_url, address, city, phone)",
        { count: "exact" }
      )
      .eq("establishment_id", estId);

    if (classroom_id) {
      query = query.eq("student.classroom_id", classroom_id);
    }

    if (search) {
      query = query.or(`serial_number.ilike.%${search}%,student.student_number.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order("issue_date", { ascending: false })
      .range(offset, offset + page_size - 1);

    if (error) return { error: error.message };

    return {
      success: true,
      data: {
        data: (data ?? []) as IdCard[],
        total: count ?? 0,
        page,
        pageSize: page_size,
      },
    };
  } catch {
    return { error: "Erreur lors du chargement des cartes scolaires." };
  }
}

export async function createIdCardAction(
  values: CreateIdCardInput,
  establishmentId?: string
): Promise<ActionResult<IdCard>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = createIdCardSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = await getDb();

    // Verify the student actually belongs to this establishment.
    const { data: student } = await db
      .from("students")
      .select("id, establishment_id")
      .eq("id", validated.data.student_id)
      .maybeSingle();

    if (!student || student.establishment_id !== estId) {
      return { error: "Élève introuvable dans cet établissement." };
    }

    let academicYearId = validated.data.academic_year_id;
    if (!academicYearId) {
      const resolved = await resolveActiveAcademicYearId(db, estId);
      if (!resolved) return { error: "Aucune année académique active configurée." };
      academicYearId = resolved;
    }

    const issueDate = validated.data.issue_date || new Date().toISOString().split("T")[0];
    const expiryDate = validated.data.expiry_date || defaultExpiryDate(issueDate);

    // Retry once on the unlikely event of a serial_number collision.
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await db
        .from("id_cards")
        .insert({
          establishment_id: estId,
          student_id: validated.data.student_id,
          academic_year_id: academicYearId,
          serial_number: generateSerialNumber(),
          issue_date: issueDate,
          expiry_date: expiryDate,
        })
        .select(SELECT_WITH_RELATIONS)
        .single();

      if (!error) {
        revalidatePath("/id-cards");
        return { success: true, data: data as IdCard };
      }
      if (!error.message?.includes("serial_number")) {
        return { error: error.message };
      }
    }

    return { error: "Impossible de générer un numéro de série unique, réessayez." };
  } catch {
    return { error: "Erreur lors de la création de la carte scolaire." };
  }
}

export async function createIdCardsForClassroomAction(
  values: BatchCreateIdCardsInput,
  establishmentId?: string
): Promise<ActionResult<{ created: number; alreadyIssued: number }>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = batchCreateIdCardsSchema.safeParse(values);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = await getDb();

    // Verify the classroom actually belongs to this establishment.
    const { data: classroom } = await db
      .from("classrooms")
      .select("id, establishment_id")
      .eq("id", validated.data.classroom_id)
      .maybeSingle();

    if (!classroom || classroom.establishment_id !== estId) {
      return { error: "Classe introuvable dans cet établissement." };
    }

    const academicYearId = await resolveActiveAcademicYearId(db, estId);
    if (!academicYearId) return { error: "Aucune année académique active configurée." };

    const { data: students, error: studentsError } = await db
      .from("students")
      .select("id")
      .eq("establishment_id", estId)
      .eq("classroom_id", validated.data.classroom_id)
      .eq("status", "active");

    if (studentsError) return { error: studentsError.message };
    if (!students || students.length === 0) {
      return { error: "Aucun élève actif dans cette classe." };
    }

    const studentIds = students.map((s) => s.id);

    // Students who already have a card for the current academic year are skipped.
    const { data: existingCards } = await db
      .from("id_cards")
      .select("student_id")
      .eq("academic_year_id", academicYearId)
      .in("student_id", studentIds);

    const alreadyIssuedIds = new Set((existingCards ?? []).map((c) => c.student_id));
    const toCreate = studentIds.filter((id) => !alreadyIssuedIds.has(id));

    if (toCreate.length === 0) {
      return { success: true, data: { created: 0, alreadyIssued: alreadyIssuedIds.size } };
    }

    const issueDate = new Date().toISOString().split("T")[0];
    const expiryDate = defaultExpiryDate(issueDate);

    const { data: inserted, error: insertError } = await db
      .from("id_cards")
      .insert(
        toCreate.map((studentId) => ({
          establishment_id: estId,
          student_id: studentId,
          academic_year_id: academicYearId,
          serial_number: generateSerialNumber(),
          issue_date: issueDate,
          expiry_date: expiryDate,
        }))
      )
      .select("id");

    if (insertError) return { error: insertError.message };

    revalidatePath("/id-cards");
    return {
      success: true,
      data: { created: inserted?.length ?? 0, alreadyIssued: alreadyIssuedIds.size },
    };
  } catch {
    return { error: "Erreur lors de la génération groupée des cartes." };
  }
}

export async function deleteIdCardAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();

    const guard = await assertEstablishmentOwnership(
      db, "id_cards", id, authResult.session!.user.establishment_id,
      "Carte introuvable.", "Vous n'avez pas accès à cette carte."
    );
    if ("error" in guard) return { error: guard.error };

    const { error } = await db.from("id_cards").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/id-cards");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression de la carte." };
  }
}
