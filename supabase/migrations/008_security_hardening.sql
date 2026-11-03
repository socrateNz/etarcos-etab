-- ============================================================================
-- 008 — Durcissement sécurité de la base (idempotent, rejouable sans risque)
-- ============================================================================
--
-- Contexte : l'application n'accède à la base QUE côté serveur, avec la clé
-- service_role (cf. docs/RLS_ARCHITECTURE.md). Les rôles `anon` et
-- `authenticated` ne servent jamais. Or la clé anon est publique
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY, visible dans le navigateur) : tout ce que
-- ces rôles peuvent faire, n'importe qui peut le faire via l'API REST.
--
-- Cette migration :
--   1. active RLS sur TOUTES les tables du schéma public (notifications ne
--      l'avait pas : lisible/modifiable par n'importe qui) ;
--   2. complète / corrige les policies (notifications SELECT manquante,
--      audit_logs INSERT ouvert à tous) ;
--   3. retire aux rôles anon/authenticated tout accès direct aux tables,
--      séquences et fonctions — défense en profondeur : même une policy mal
--      écrite ne peut plus fuiter via la clé publique ;
--   4. empêche l'appel public de generate_report_card / calculate_student_average
--      (SECURITY DEFINER : contournent RLS, appelables via /rest/v1/rpc).
--
-- service_role (utilisé par l'application) n'est PAS affecté : il bypasse RLS
-- et garde tous ses droits.
--
-- ⚠️ Si un jour l'app utilise Supabase Auth côté navigateur (bridging RLS,
-- cf. docs/RLS_ARCHITECTURE.md), il faudra re-GRANT les droits nécessaires au
-- rôle `authenticated`, table par table.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. RLS activé sur toutes les tables du schéma public
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Policies manquantes / trop permissives
-- ----------------------------------------------------------------------------

-- notifications : chacun ne voit que ses notifications (seule INSERT/UPDATE/
-- DELETE existaient — et RLS n'était même pas activé sur la table).
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_super_admin());

-- audit_logs : l'INSERT était `WITH CHECK (TRUE)` → n'importe qui pouvait
-- écrire de fausses entrées dans le journal d'audit. On limite à ses propres
-- entrées (l'application, en service_role, n'est pas concernée).
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. Aucun accès direct pour anon / authenticated
-- ----------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Tables / séquences créées plus tard par ce même rôle : pas de droits par défaut.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- service_role garde explicitement tous les droits (no-op s'il les a déjà).
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ----------------------------------------------------------------------------
-- 4. Fonctions : plus d'appel RPC public
-- ----------------------------------------------------------------------------
-- Par défaut PostgreSQL accorde EXECUTE à PUBLIC sur toute nouvelle fonction.
-- generate_report_card (SECURITY DEFINER) permettait à n'importe qui de créer
-- ou écraser un bulletin via /rest/v1/rpc/generate_report_card.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Les fonctions SECURITY DEFINER doivent figer leur search_path (sinon un
-- objet homonyme dans un autre schéma pourrait être résolu à leur place).
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      -- exclut les fonctions appartenant à une extension (pas à nous)
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid AND d.classid = 'pg_proc'::regclass AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f.sig);
  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- Vérifications (à lancer après, résultats attendus en commentaire)
-- ============================================================================
-- Tables sans RLS → attendu : 0 ligne
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;
--
-- Droits restants pour anon/authenticated sur les tables → attendu : 0 ligne
--   SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated');
--
-- Fonctions encore appelables par anon → attendu : 0 ligne
--   SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND has_function_privilege('anon', p.oid, 'EXECUTE');
