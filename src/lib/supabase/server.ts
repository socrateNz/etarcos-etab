// ==================================================
// Etarcos Etab – Supabase Client (Server)
// ==================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - cookies peuvent être read-only
          }
        },
      },
    }
  );
}

// Client avec Service Role pour les Server Actions admin.
// NOTE: ce client bypasse RLS entièrement — la sécurité tenant/permissions
// repose sur la couche applicative (requireAuth/resolveEstablishmentId/
// assertEstablishmentOwnership), pas sur les policies RLS de la base
// (qui existent mais ne sont jamais exercées, faute de session Supabase Auth
// réelle — NextAuth gère sa propre session JWT). Détails et pistes pour
// bridger ça proprement plus tard : voir docs/RLS_ARCHITECTURE.md.
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
