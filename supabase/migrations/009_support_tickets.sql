-- ============================================================================
-- 009 — Tickets de support + correctifs search_path (idempotent)
-- ============================================================================
--
-- 1. Tables support_tickets / support_ticket_messages : les établissements
--    ouvrent un ticket, le super-admin répond. Remplace les tickets fictifs
--    codés en dur dans la page Support.
-- 2. Fixe le search_path des fonctions triggers signalées par le linter
--    Supabase (function_search_path_mutable).
--
-- Comme pour 008 : accès uniquement via service_role (serveur). RLS activé
-- sans policy et aucun droit pour anon/authenticated.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Tickets
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        TEXT NOT NULL UNIQUE DEFAULT ('TK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE SET NULL,
  created_by       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject          TEXT NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 200),
  category         TEXT NOT NULL DEFAULT 'other'
                     CHECK (category IN ('bug', 'question', 'billing', 'feature', 'other')),
  status           TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'pending', 'resolved')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id      UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_staff_reply BOOLEAN NOT NULL DEFAULT false,
  body           TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status      ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by  ON public.support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_establishment ON public.support_tickets(establishment_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_updated_at  ON public.support_tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id, created_at);

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.support_tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.support_tickets, public.support_ticket_messages FROM PUBLIC, anon, authenticated;
GRANT  ALL ON public.support_tickets, public.support_ticket_messages TO service_role;

-- ----------------------------------------------------------------------------
-- 2. search_path figé sur les fonctions triggers (linter Supabase)
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  fn TEXT;
BEGIN
  FOREACH fn IN ARRAY ARRAY['update_updated_at', 'sync_inventory_quantity', 'sync_library_availability'] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = fn AND p.pronargs = 0
    ) THEN
      EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public, pg_temp', fn);
    END IF;
  END LOOP;
END $$;

COMMIT;

-- ----------------------------------------------------------------------------
-- Vérifications (à lancer après coup)
-- ----------------------------------------------------------------------------
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('support_tickets', 'support_ticket_messages');
-- SELECT proname, proconfig FROM pg_proc
--   WHERE proname IN ('update_updated_at', 'sync_inventory_quantity', 'sync_library_availability');
