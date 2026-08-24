-- ============================================
-- 007. CARTES SCOLAIRES (STUDENT ID CARDS)
-- ============================================
-- Registre des cartes d'identité scolaire émises pour les élèves.
-- Mirrors the `diplomas` table pattern: no PDF is generated/stored,
-- the card is rendered live in the browser and printed on demand.

CREATE TABLE IF NOT EXISTS id_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  serial_number    VARCHAR(100) UNIQUE NOT NULL,
  issue_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date      DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_id_cards_student ON id_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_id_cards_establishment ON id_cards(establishment_id);

ALTER TABLE id_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "id_cards_select" ON id_cards;
CREATE POLICY "id_cards_select" ON id_cards FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "id_cards_insert" ON id_cards;
CREATE POLICY "id_cards_insert" ON id_cards FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "id_cards_delete" ON id_cards;
CREATE POLICY "id_cards_delete" ON id_cards FOR DELETE
  USING (public.is_super_admin());
