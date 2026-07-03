import { cookies } from "next/headers";

export async function resolveEstablishmentId(
  sessionEstablishmentId: string | null,
  explicitId?: string
): Promise<string | null> {
  if (explicitId) return explicitId;

  try {
    const cookieStore = await cookies();
    const activeId = cookieStore.get("active_establishment_id")?.value;
    if (activeId && activeId !== "global" && activeId !== "undefined") {
      return activeId;
    }
  } catch (e) {
    // Ignore error if not in request context
  }

  return sessionEstablishmentId;
}
