import { cookies } from "next/headers";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import {
  classifyEstablishmentAccess,
  decideEstablishmentScope,
  type EstablishmentScope,
  type StudentScope,
} from "@/lib/auth/establishment-access";

export {
  isUsableId,
  classifyEstablishmentAccess,
  applyEstablishmentScope,
  canSeeStudent,
  filterRowsByStudentScope,
  isStudentScopedRole,
  type EstablishmentScope,
  type StudentScope,
} from "@/lib/auth/establishment-access";

/**
 * Resolves which establishment the current request should be scoped to.
 *
 * This re-checks the session itself (instead of trusting a role passed in by
 * the caller) so tenant isolation can't be silently skipped by a call site
 * that forgets to pass one — which was the case for most read/list actions.
 * For the `owner` role, the candidate establishment is verified against
 * `establishment_owners` before being trusted. See classifyEstablishmentAccess
 * in ./establishment-access.ts for the (unit-tested) decision logic.
 */
export async function resolveEstablishmentId(
  sessionEstablishmentId: string | null,
  explicitId?: string
): Promise<string | null> {
  const session = await auth();

  let cookieEstablishmentId: string | undefined;
  try {
    const cookieStore = await cookies();
    cookieEstablishmentId = cookieStore.get("active_establishment_id")?.value;
  } catch {
    // Not in a request context (e.g. background job) — ignore.
  }

  const decision = classifyEstablishmentAccess(
    session?.user?.role,
    sessionEstablishmentId,
    explicitId,
    cookieEstablishmentId
  );

  if (decision.kind === "denied") return null;
  if (decision.kind === "locked") return decision.id;
  if (decision.kind === "resolved") return decision.id;

  // needs_ownership_check: verify the candidate establishment belongs to this owner.
  const db = (await createAdminClient()) as any;
  const { data: owner } = await db
    .from("owners")
    .select("id")
    .eq("user_id", session!.user!.id)
    .maybeSingle();
  if (!owner) return null;

  const { data: link } = await db
    .from("establishment_owners")
    .select("establishment_id")
    .eq("owner_id", owner.id)
    .eq("establishment_id", decision.id)
    .maybeSingle();

  return link ? decision.id : null;
}

/**
 * Guards a mutate-by-id action (update/delete) against cross-tenant access.
 *
 * Row-level CRUD actions authenticate the caller and check their RBAC
 * permission for the module (`requireAuth`), but that only proves the caller
 * is allowed to, say, "delete a classroom" in general — not that this
 * specific row belongs to them. Without this check, any role with delete/edit
 * rights could mutate another establishment's row by passing its id directly.
 *
 * Fetches the row's `establishment_id` and verifies it via
 * `resolveEstablishmentId` (which enforces the caller's actual tenant scope)
 * before the caller proceeds with the mutation.
 */
export async function assertEstablishmentOwnership(
  db: any,
  table: string,
  id: string,
  sessionEstablishmentId: string | null,
  notFoundError = "Ressource introuvable.",
  forbiddenError = "Vous n'avez pas accès à cette ressource."
): Promise<{ error: string } | { establishmentId: string }> {
  const { data: row } = await db
    .from(table)
    .select("establishment_id")
    .eq("id", id)
    .maybeSingle();

  if (!row) return { error: notFoundError };

  const estId = await resolveEstablishmentId(sessionEstablishmentId, row.establishment_id);
  if (estId !== row.establishment_id) return { error: forbiddenError };

  return { establishmentId: row.establishment_id };
}

/**
 * Périmètre établissement pour une requête de LECTURE (listes, stats).
 * À utiliser à la place de `resolveEstablishmentId` + `if (estId) query.eq(...)`,
 * qui ne filtrait plus rien dès que estId valait null.
 *
 * Usage :
 *   const scope = await resolveEstablishmentScope(session.user.establishment_id, input.establishment_id);
 *   if (scope.kind === "none") return <liste vide>;
 *   query = applyEstablishmentScope(query, scope);
 */
export async function resolveEstablishmentScope(
  sessionEstablishmentId: string | null,
  explicitId?: string
): Promise<EstablishmentScope> {
  const session = await auth();
  const role = session?.user?.role;
  const resolvedId = await resolveEstablishmentId(sessionEstablishmentId, explicitId);

  let ownedIds: string[] = [];
  if (!resolvedId && role === "owner" && session?.user?.id) {
    const db = (await createAdminClient()) as any;
    const { data: owner } = await db
      .from("owners")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (owner) {
      const { data: links } = await db
        .from("establishment_owners")
        .select("establishment_id")
        .eq("owner_id", owner.id);
      ownedIds = (links ?? []).map((l: { establishment_id: string }) => l.establishment_id);
    }
  }

  return decideEstablishmentScope({ role, resolvedId, explicitId, ownedIds });
}

/**
 * Périmètre élèves de l'utilisateur courant.
 * - parent : élèves liés via student_parents ;
 * - élève  : sa propre fiche ;
 * - autres : pas de restriction par élève.
 * Relit la session elle-même : un appelant ne peut pas « oublier » de passer le rôle.
 */
export async function resolveStudentScope(): Promise<StudentScope> {
  const session = await auth();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  if (role !== "parent" && role !== "student") return { kind: "all" };
  if (!userId) return { kind: "ids", ids: [] };

  const db = (await createAdminClient()) as any;

  if (role === "student") {
    const { data } = await db.from("students").select("id").eq("user_id", userId);
    return { kind: "ids", ids: (data ?? []).map((r: { id: string }) => r.id) };
  }

  const { data: parentRows } = await db.from("parents").select("id").eq("user_id", userId);
  const parentIds = (parentRows ?? []).map((r: { id: string }) => r.id);
  if (parentIds.length === 0) return { kind: "ids", ids: [] };

  const { data: links } = await db
    .from("student_parents")
    .select("student_id")
    .in("parent_id", parentIds);
  return {
    kind: "ids",
    ids: [...new Set<string>((links ?? []).map((l: { student_id: string }) => l.student_id))],
  };
}
