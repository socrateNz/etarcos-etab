const RESERVED_IDS = new Set(["global", "compare", "undefined"]);

export function isUsableId(id?: string | null): id is string {
  return !!id && !RESERVED_IDS.has(id);
}

export type EstablishmentAccessDecision =
  | { kind: "denied" }
  | { kind: "locked"; id: string | null }
  | { kind: "resolved"; id: string }
  | { kind: "needs_ownership_check"; id: string };

/**
 * Pure decision logic for which establishment a request should be scoped to.
 * Deliberately free of I/O (no session/cookie/DB lookups) so it can be unit
 * tested directly — see establishment-access.test.ts.
 *
 * - No role: denied (caller isn't authenticated).
 * - Locked roles (everything but super_admin/owner): always their own
 *   session establishment; an explicit id or cookie is never an override.
 * - super_admin: resolved immediately — free to target any establishment.
 * - owner: candidate must still be checked against establishment_owners by
 *   the caller before being trusted (`needs_ownership_check`).
 */
export function classifyEstablishmentAccess(
  role: string | undefined,
  sessionEstablishmentId: string | null,
  explicitId: string | undefined,
  cookieEstablishmentId: string | undefined
): EstablishmentAccessDecision {
  if (!role) return { kind: "denied" };

  if (role !== "super_admin" && role !== "owner") {
    return { kind: "locked", id: sessionEstablishmentId };
  }

  let candidate: string | null = isUsableId(explicitId) ? explicitId : null;
  if (!candidate && isUsableId(cookieEstablishmentId)) candidate = cookieEstablishmentId;
  if (!candidate) candidate = sessionEstablishmentId;
  if (!candidate) return { kind: "locked", id: null };

  if (role === "super_admin") return { kind: "resolved", id: candidate };
  return { kind: "needs_ownership_check", id: candidate };
}

// ============================================================================
// Périmètre de lecture (listes) : un ou plusieurs établissements, ou rien.
// ============================================================================

/**
 * Ensemble d'établissements qu'une requête de lecture a le droit de voir.
 * - `all`  : aucun filtre (super_admin en vue globale uniquement) ;
 * - `ids`  : filtrer sur ces établissements (jamais vide) ;
 * - `none` : rien n'est accessible — l'appelant renvoie une liste vide.
 *
 * Remplace le pattern `if (estId) query = query.eq(...)`, qui retombait sur
 * « aucun filtre = toutes les écoles » dès que estId valait null (accès
 * propriétaire refusé, établissement actif non choisi, compte sans
 * établissement...).
 */
export type EstablishmentScope =
  | { kind: "all" }
  | { kind: "ids"; ids: string[] }
  | { kind: "none" };

export function decideEstablishmentScope(params: {
  role: string | undefined;
  /** Résultat de resolveEstablishmentId (déjà vérifié pour les propriétaires). */
  resolvedId: string | null;
  /** L'appelant a-t-il demandé un établissement précis ? */
  explicitId?: string;
  /** Établissements possédés (rôle owner uniquement). */
  ownedIds?: string[];
}): EstablishmentScope {
  const { role, resolvedId, explicitId, ownedIds = [] } = params;
  if (!role) return { kind: "none" };

  if (resolvedId) return { kind: "ids", ids: [resolvedId] };

  if (role === "super_admin") return { kind: "all" };

  if (role === "owner") {
    // Un établissement précis a été demandé mais refusé : on ne l'élargit pas.
    if (isUsableId(explicitId)) return { kind: "none" };
    // Pas d'établissement actif : tous ceux de ce propriétaire, et eux seuls.
    return ownedIds.length > 0 ? { kind: "ids", ids: ownedIds } : { kind: "none" };
  }

  return { kind: "none" };
}

/** Applique un périmètre à une requête PostgREST (no-op pour `all`). */
export function applyEstablishmentScope<Q>(
  query: Q,
  scope: Exclude<EstablishmentScope, { kind: "none" }>,
  column = "establishment_id"
): Q {
  if (scope.kind === "all") return query;
  const q = query as unknown as {
    eq(c: string, v: string): Q;
    in(c: string, v: string[]): Q;
  };
  return scope.ids.length === 1 ? q.eq(column, scope.ids[0]) : q.in(column, scope.ids);
}

// ============================================================================
// Périmètre élèves : parents et élèves ne voient que « leurs » élèves.
// ============================================================================

/** Rôles dont l'accès aux données est limité à des élèves précis. */
export const STUDENT_SCOPED_ROLES = ["parent", "student"] as const;

export function isStudentScopedRole(role: string | undefined): boolean {
  return !!role && (STUDENT_SCOPED_ROLES as readonly string[]).includes(role);
}

/**
 * - `all` : personnel — pas de restriction par élève (le filtre établissement
 *   s'applique toujours à part) ;
 * - `ids` : parent → ses enfants, élève → lui-même. Peut être vide : l'appelant
 *   renvoie alors une liste vide.
 */
export type StudentScope = { kind: "all" } | { kind: "ids"; ids: string[] };

/** Un élève précis est-il visible dans ce périmètre ? */
export function canSeeStudent(scope: StudentScope, studentId: string | null | undefined): boolean {
  if (scope.kind === "all") return true;
  return !!studentId && scope.ids.includes(studentId);
}

/** Restreint une liste de lignes portant un `student_id` au périmètre. */
export function filterRowsByStudentScope<T>(
  rows: T[],
  scope: StudentScope,
  getStudentId: (row: T) => string | null | undefined = (r) =>
    (r as { student_id?: string | null }).student_id
): T[] {
  if (scope.kind === "all") return rows;
  return rows.filter((r) => canSeeStudent(scope, getStudentId(r)));
}
