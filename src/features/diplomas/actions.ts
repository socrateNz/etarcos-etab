"use server";

import { randomBytes } from "crypto";
import { resolveEstablishmentId, assertEstablishmentOwnership } from "@/lib/auth/active-etab";
import { resolveActiveAcademicYearId } from "@/app/actions/academic-years";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import {
  createDiplomaSchema,
  listDiplomasSchema,
  type CreateDiplomaInput,
  type ListDiplomasInput,
} from "./schemas";
import type { ActionResult, Diploma, PaginatedResult } from "./types";

type CrudAction = "view" | "create" | "edit" | "delete";

function can(role: SystemRole, permissions: string[], action: CrudAction) {
  if (role === "super_admin") return true;
  return hasPermission(permissions, "diplomas", action);
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

function generateSerialNumber(): string {
  const year = new Date().getFullYear();
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `DIP-${year}-${suffix}`;
}

export async function listDiplomasAction(
  params: Partial<ListDiplomasInput> = {},
  establishmentId?: string
): Promise<ActionResult<PaginatedResult<Diploma>>> {
  const authResult = await requireAuth("view");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = listDiplomasSchema.safeParse(params);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Paramètres invalides." };

  const { search, page, page_size } = validated.data;
  const offset = (page - 1) * page_size;

  try {
    const db = await getDb();

    let query = db
      .from("diplomas")
      .select(
        "*, student:students(id, student_number, user:users(id, name), classroom:classrooms(id, name)), academic_year:academic_years(id, name)",
        { count: "exact" }
      )
      .eq("establishment_id", estId);

    if (search) {
      query = query.or(`name.ilike.%${search}%,serial_number.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order("issue_date", { ascending: false })
      .range(offset, offset + page_size - 1);

    if (error) return { error: error.message };

    return {
      success: true,
      data: {
        data: (data ?? []) as Diploma[],
        total: count ?? 0,
        page,
        pageSize: page_size,
      },
    };
  } catch {
    return { error: "Erreur lors du chargement des diplômes." };
  }
}

export async function createDiplomaAction(
  values: CreateDiplomaInput,
  establishmentId?: string
): Promise<ActionResult<Diploma>> {
  const authResult = await requireAuth("create");
  if (authResult.error) return { error: authResult.error };

  const estId = await resolveEstablishmentId(
    authResult.session!.user.establishment_id,
    establishmentId
  );
  if (!estId) return { error: "Établissement requis." };

  const validated = createDiplomaSchema.safeParse(values);
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

    // Retry once on the unlikely event of a serial_number collision.
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await db
        .from("diplomas")
        .insert({
          establishment_id: estId,
          student_id: validated.data.student_id,
          academic_year_id: academicYearId,
          name: validated.data.name,
          serial_number: generateSerialNumber(),
          issue_date: validated.data.issue_date || new Date().toISOString().split("T")[0],
        })
        .select(
          "*, student:students(id, student_number, user:users(id, name), classroom:classrooms(id, name)), academic_year:academic_years(id, name)"
        )
        .single();

      if (!error) {
        revalidatePath("/diplomas");
        return { success: true, data: data as Diploma };
      }
      if (!error.message?.includes("serial_number")) {
        return { error: error.message };
      }
    }

    return { error: "Impossible de générer un numéro de série unique, réessayez." };
  } catch {
    return { error: "Erreur lors de la création du diplôme." };
  }
}

export async function deleteDiplomaAction(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth("delete");
  if (authResult.error) return { error: authResult.error };

  try {
    const db = await getDb();

    const guard = await assertEstablishmentOwnership(
      db, "diplomas", id, authResult.session!.user.establishment_id,
      "Diplôme introuvable.", "Vous n'avez pas accès à ce diplôme."
    );
    if ("error" in guard) return { error: guard.error };

    const { error } = await db.from("diplomas").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/diplomas");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression du diplôme." };
  }
}
