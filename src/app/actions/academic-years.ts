"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveEstablishmentId } from "@/lib/auth/active-etab";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

export interface AcademicYearItem {
  id: string;
  establishment_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

async function getDb() {
  return (await createAdminClient()) as any;
}

export async function listAcademicYearsAction(
  establishmentId?: string
): Promise<ActionResult<AcademicYearItem[]>> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  const estId = await resolveEstablishmentId(
    session.user.establishment_id,
    establishmentId
  );

  if (!estId && session.user.role !== "super_admin") {
    return { error: "Établissement requis." };
  }

  try {
    const db = await getDb();
    let query = db
      .from("academic_years")
      .select("*")
      .order("start_date", { ascending: false });

    if (estId) query = query.eq("establishment_id", estId);

    const { data, error } = await query;
    if (error) return { error: error.message };

    return { success: true, data: (data ?? []) as AcademicYearItem[] };
  } catch {
    return { error: "Impossible de charger les années académiques." };
  }
}

export async function createAcademicYearAction(input: {
  name: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  establishment_id?: string;
}): Promise<ActionResult<AcademicYearItem>> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  const estId = await resolveEstablishmentId(
    session.user.establishment_id,
    input.establishment_id
  );

  if (!estId) {
    return { error: "Aucun établissement associé." };
  }

  if (!input.name.trim() || !input.start_date || !input.end_date) {
    return { error: "Veuillez remplir le nom, la date de début et la date de fin." };
  }

  try {
    const db = await getDb();
    const isCurrent = input.is_current ?? true;

    // If making this current, set all existing to is_current = false
    if (isCurrent) {
      await db
        .from("academic_years")
        .update({ is_current: false })
        .eq("establishment_id", estId);
    }

    const { data, error } = await db
      .from("academic_years")
      .insert({
        establishment_id: estId,
        name: input.name.trim(),
        start_date: input.start_date,
        end_date: input.end_date,
        is_current: isCurrent,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/settings");
    revalidatePath("/classes");
    revalidatePath("/cycles");
    return { success: true, data: data as AcademicYearItem };
  } catch {
    return { error: "Erreur lors de la création de l'année académique." };
  }
}

export async function setCurrentAcademicYearAction(
  id: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  try {
    const db = await getDb();
    const { data: target } = await db
      .from("academic_years")
      .select("establishment_id")
      .eq("id", id)
      .maybeSingle();

    if (!target) return { error: "Année académique introuvable." };

    await db
      .from("academic_years")
      .update({ is_current: false })
      .eq("establishment_id", target.establishment_id);

    const { error } = await db
      .from("academic_years")
      .update({ is_current: true })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/settings");
    revalidatePath("/classes");
    return { success: true };
  } catch {
    return { error: "Erreur lors du changement de l'année académique courante." };
  }
}

export async function autoCreateDefaultAcademicYearAction(): Promise<
  ActionResult<AcademicYearItem>
> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  const estId = await resolveEstablishmentId(session.user.establishment_id);
  if (!estId) return { error: "Aucun établissement associé." };

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const name = `${currentYear}-${nextYear}`;
  const start_date = `${currentYear}-09-01`;
  const end_date = `${nextYear}-06-30`;

  return createAcademicYearAction({
    name,
    start_date,
    end_date,
    is_current: true,
    establishment_id: estId,
  });
}

export async function resolveActiveAcademicYearId(
  db: any,
  establishmentId?: string | null
): Promise<string | null> {
  if (establishmentId) {
    const { data: estYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", establishmentId)
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (estYear) return estYear.id;
  }

  const { data: anyCurrentYear } = await db
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (anyCurrentYear) return anyCurrentYear.id;

  if (establishmentId) {
    const { data: anyEstYear } = await db
      .from("academic_years")
      .select("id")
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (anyEstYear) return anyEstYear.id;
  }

  const { data: latestYear } = await db
    .from("academic_years")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return latestYear?.id ?? null;
}
