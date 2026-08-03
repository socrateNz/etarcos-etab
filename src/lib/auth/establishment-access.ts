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
