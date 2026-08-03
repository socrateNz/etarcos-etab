// ==================================================
// Etarcos Etab – NextAuth v5 Configuration
// ==================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { loginSchema } from "@/schemas/auth";
import { createClient } from "@supabase/supabase-js";
import { getPermissionsForRole } from "@/types/permissions";
import { checkLoginRateLimit } from "@/lib/auth/rate-limit";
import type { SystemRole } from "@/types/auth";

// IMPORTANT: Les permissions NE sont PAS stockées dans le JWT (trop volumineux → HTTP 431)
// Elles sont dérivées à la volée depuis le rôle dans le callback session

// Client d'authentification — clé anon pour signInWithPassword
// IMPORTANT: Ne pas utiliser ce client pour des requêtes DB (la session USER écraserait le service role key)
function getAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Client admin — service role key SANS session utilisateur
// Créé séparément pour que signInWithPassword ne remplace pas le service role key
// → bypass RLS complet sur toutes les tables
function getAdminDbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Rate-limit by IP + email so a single attacker can't brute-force one
        // account, and a compromised IP can't hammer many accounts either.
        const forwardedFor = request.headers.get("x-forwarded-for");
        const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
        const { allowed } = await checkLoginRateLimit(`${ip}:${email.toLowerCase()}`);
        if (!allowed) return null;

        try {
          // 1. Authentification via client anon (stocke la session USER sur ce client uniquement)
          const authClient = getAuthClient();
          const { data: authData, error: authError } =
            await authClient.auth.signInWithPassword({ email, password });

          if (authError || !authData.user) return null;

          const userId = authData.user.id;
          const requiresChange = authData.user.user_metadata?.requires_password_change === true;

          // 2. Requêtes DB via client admin séparé (service role, jamais affecté par signInWithPassword)
          const db = getAdminDbClient();

          const { data: userProfile, error: profileError } = await db
            .from("users")
            .select("id, email, name, avatar_url, establishment_id")
            .eq("id", userId)
            .maybeSingle();

          if (profileError || !userProfile) return null;

          // 3. Récupération du rôle
          let role: SystemRole = "student";

          // Vérifier d'abord s'il s'agit d'un propriétaire
          const { data: ownerRow } = await db
            .from("owners")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (ownerRow) {
            role = "owner";
          } else {
            // Sinon récupérer le rôle depuis user_roles
            const { data: userRoleRow } = await db
              .from("user_roles")
              .select("role_id")
              .eq("user_id", userId)
              .limit(1)
              .maybeSingle();

            if (userRoleRow?.role_id) {
              const { data: roleData } = await db
                .from("roles")
                .select("slug")
                .eq("id", userRoleRow.role_id)
                .maybeSingle();
              if (roleData?.slug) role = roleData.slug as SystemRole;
            }

            // Fallback: If user has no user_roles record, check staff_members table
            if (role === "student") {
              const { data: staffRow } = await db
                .from("staff_members")
                .select("position, establishment_id")
                .eq("user_id", userId)
                .maybeSingle();

              if (staffRow?.position) {
                const pos = staffRow.position.toLowerCase();
                if (pos.includes("direct") || pos.includes("dir")) role = "director";
                else if (pos.includes("cens") || pos.includes("survei")) role = "censor";
                else if (pos.includes("compt") || pos.includes("financ") || pos.includes("account")) role = "accountant";
                else if (pos.includes("secr")) role = "secretary";
                else if (pos.includes("biblio") || pos.includes("lib")) role = "librarian";
                else if (pos.includes("lab")) role = "lab_manager";
                else role = "teacher";

                // Auto-create role in roles table if missing and insert into user_roles
                let { data: roleObj } = await db
                  .from("roles")
                  .select("id")
                  .or(`slug.eq.${role},name.eq.${role}`)
                  .maybeSingle();

                if (!roleObj) {
                  const { data: newRole } = await db
                    .from("roles")
                    .insert({
                      name: role === "director" ? "Directeur d'Établissement" : role.charAt(0).toUpperCase() + role.slice(1),
                      slug: role,
                      is_system: true,
                    })
                    .select("id")
                    .single();
                  roleObj = newRole;
                }

                if (roleObj) {
                  await db.from("user_roles").insert({
                    user_id: userId,
                    role_id: roleObj.id,
                    establishment_id: staffRow.establishment_id || (userProfile as any).establishment_id,
                  });
                }
              }
            }
          }

          let finalEstablishmentId = (userProfile as any).establishment_id;
          if (!finalEstablishmentId) {
            const { data: urEst } = await db
              .from("user_roles")
              .select("establishment_id")
              .eq("user_id", userId)
              .not("establishment_id", "is", null)
              .limit(1)
              .maybeSingle();

            if (urEst?.establishment_id) {
              finalEstablishmentId = urEst.establishment_id;
            } else {
              const { data: staffEst } = await db
                .from("staff_members")
                .select("establishment_id")
                .eq("user_id", userId)
                .not("establishment_id", "is", null)
                .limit(1)
                .maybeSingle();

              if (staffEst?.establishment_id) {
                finalEstablishmentId = staffEst.establishment_id;
              }
            }
          }

          return {
            id: userId,
            email: authData.user.email!,
            name: (userProfile as any).name,
            image: (userProfile as any).avatar_url,
            role,
            establishment_id: finalEstablishmentId,
            requires_password_change: requiresChange,
          };
        } catch (error) {
          console.error("Erreur de connexion:", error);
          return null;
        }
      },
    }),

    // Fournisseurs SSO futurs (Google, Microsoft Entra ID, Facebook)
    // Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }),
    // MicrosoftEntraID({ ... }),
    // Facebook({ ... }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.establishment_id = (user as any).establishment_id;
        token.requires_password_change = (user as any).requires_password_change;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as SystemRole;
        session.user.establishment_id = token.establishment_id as string | null;
        session.user.permissions = getPermissionsForRole(token.role as SystemRole);
        session.user.requires_password_change = token.requires_password_change as boolean;
      }
      return session;
    },

    // NOTE: route protection is NOT done via an `authorized` callback here —
    // this custom Next.js build renames middleware.ts to proxy.ts, and
    // src/proxy.ts implements its own redirect logic directly instead of
    // relying on this callback (which the `auth((req) => ...)` wrapper it
    // uses never invokes). Keep both in sync if you touch either one.
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
