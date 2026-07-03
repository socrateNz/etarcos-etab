// ==================================================
// Etarcos Etab – NextAuth v5 Configuration
// ==================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { loginSchema } from "@/schemas/auth";
import { createClient } from "@supabase/supabase-js";
import { getPermissionsForRole } from "@/types/permissions";
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
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

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
          }

          return {
            id: userId,
            email: authData.user.email!,
            name: (userProfile as any).name,
            image: (userProfile as any).avatar_url,
            role,
            establishment_id: (userProfile as any).establishment_id,
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

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = !nextUrl.pathname.startsWith("/login") &&
        !nextUrl.pathname.startsWith("/register");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
