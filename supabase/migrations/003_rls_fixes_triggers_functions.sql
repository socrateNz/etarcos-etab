-- ==================================================
-- Etarcos Etab – Migration 003: RLS Fixes, Triggers & Functions
-- ==================================================

-- ============================================
-- 1. RLS MANQUANTES – Tables de la migration 001
-- ============================================

-- Classrooms
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classrooms_select" ON classrooms FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "classrooms_insert" ON classrooms FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "classrooms_update" ON classrooms FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "classrooms_delete" ON classrooms FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_select" ON subjects FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "subjects_insert" ON subjects FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "subjects_update" ON subjects FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "subjects_delete" ON subjects FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select" ON rooms FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "rooms_insert" ON rooms FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "rooms_update" ON rooms FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "rooms_delete" ON rooms FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Cycles
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cycles_select" ON cycles FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "cycles_insert" ON cycles FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "cycles_update" ON cycles FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "cycles_delete" ON cycles FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Levels
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels_select" ON levels FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "levels_insert" ON levels FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "levels_update" ON levels FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "levels_delete" ON levels FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Staff Members (salaires proteges)
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_select" ON staff_members FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR user_id = auth.uid()
  );
CREATE POLICY "staff_insert" ON staff_members FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "staff_update" ON staff_members FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "staff_delete" ON staff_members FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select" ON expenses FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "expenses_insert" ON expenses FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "expenses_update" ON expenses FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "expenses_delete" ON expenses FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Fee Categories
ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fee_categories_select" ON fee_categories FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "fee_categories_insert" ON fee_categories FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "fee_categories_update" ON fee_categories FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "fee_categories_delete" ON fee_categories FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Student Parents (junction table)
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_parents_select" ON student_parents FOR SELECT
  USING (
    public.is_super_admin()
    OR student_id IN (SELECT id FROM students WHERE establishment_id = public.current_establishment_id())
  );
CREATE POLICY "student_parents_insert" ON student_parents FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR student_id IN (SELECT id FROM students WHERE establishment_id = public.current_establishment_id())
  );
CREATE POLICY "student_parents_delete" ON student_parents FOR DELETE
  USING (
    public.is_super_admin()
    OR student_id IN (SELECT id FROM students WHERE establishment_id = public.current_establishment_id())
  );

-- Notifications – policies manquantes (INSERT/UPDATE/DELETE)
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "notifications_delete" ON notifications FOR DELETE
  USING (user_id = auth.uid() OR public.is_super_admin());

-- ============================================
-- 2. RLS AMELIOREES – Tables migration 002
-- ============================================

DROP POLICY IF EXISTS "academic_periods_policy" ON academic_periods;
CREATE POLICY "academic_periods_select" ON academic_periods FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "academic_periods_insert" ON academic_periods FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "academic_periods_update" ON academic_periods FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "academic_periods_delete" ON academic_periods FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "tracks_policy" ON tracks;
CREATE POLICY "tracks_select" ON tracks FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "tracks_insert" ON tracks FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "tracks_update" ON tracks FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "tracks_delete" ON tracks FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "lessons_policy" ON lessons;
CREATE POLICY "lessons_select" ON lessons FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR teacher_id = auth.uid()
  );
CREATE POLICY "lessons_insert" ON lessons FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "lessons_update" ON lessons FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "lessons_delete" ON lessons FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "exams_policy" ON exams;
CREATE POLICY "exams_select" ON exams FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "exams_insert" ON exams FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "exams_update" ON exams FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "exams_delete" ON exams FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "discipline_records_policy" ON discipline_records;
CREATE POLICY "discipline_select" ON discipline_records FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );
CREATE POLICY "discipline_insert" ON discipline_records FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "discipline_update" ON discipline_records FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "discipline_delete" ON discipline_records FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "library_books_policy" ON library_books;
CREATE POLICY "library_books_select" ON library_books FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "library_books_insert" ON library_books FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "library_books_update" ON library_books FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "library_books_delete" ON library_books FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "library_loans_policy" ON library_loans;
CREATE POLICY "library_loans_select" ON library_loans FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR borrower_id = auth.uid()
  );
CREATE POLICY "library_loans_insert" ON library_loans FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "library_loans_update" ON library_loans FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "library_loans_delete" ON library_loans FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "inventory_items_policy" ON inventory_items;
CREATE POLICY "inventory_items_select" ON inventory_items FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "inventory_items_insert" ON inventory_items FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "inventory_items_update" ON inventory_items FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "inventory_items_delete" ON inventory_items FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "stock_movements_policy" ON stock_movements;
CREATE POLICY "stock_movements_select" ON stock_movements FOR SELECT
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "stock_movements_insert" ON stock_movements FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "leave_requests_policy" ON leave_requests;
CREATE POLICY "leave_requests_select" ON leave_requests FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid())
  );
CREATE POLICY "leave_requests_insert" ON leave_requests FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "leave_requests_update" ON leave_requests FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "leave_requests_delete" ON leave_requests FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "documents_policy" ON documents;
CREATE POLICY "documents_select" ON documents FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR (is_public = TRUE)
    OR owner_id = auth.uid()
  );
CREATE POLICY "documents_insert" ON documents FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "documents_update" ON documents FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR owner_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "documents_delete" ON documents FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR owner_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "diplomas_policy" ON diplomas;
CREATE POLICY "diplomas_select" ON diplomas FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );
CREATE POLICY "diplomas_insert" ON diplomas FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- ============================================
-- 3. TABLE news_posts
-- ============================================

CREATE TABLE IF NOT EXISTS news_posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  title            VARCHAR(300) NOT NULL,
  content          TEXT NOT NULL,
  excerpt          TEXT,
  cover_url        TEXT,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  published_at     TIMESTAMPTZ,
  author_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  tags             TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_posts_establishment ON news_posts(establishment_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_published     ON news_posts(is_published, published_at DESC);

CREATE TRIGGER trg_news_posts_updated_at
  BEFORE UPDATE ON news_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_posts_select" ON news_posts FOR SELECT
  USING (public.is_super_admin() OR establishment_id = public.current_establishment_id());
CREATE POLICY "news_posts_insert" ON news_posts FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "news_posts_update" ON news_posts FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR author_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "news_posts_delete" ON news_posts FOR DELETE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- ============================================
-- 4. TRIGGER — stock_movements → update inventory_items.quantity
-- ============================================

CREATE OR REPLACE FUNCTION sync_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inventory_items
  SET quantity   = quantity + NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.item_id;

  IF (SELECT quantity FROM inventory_items WHERE id = NEW.item_id) < 0 THEN
    RAISE EXCEPTION 'Stock insuffisant pour l article (id: %)', NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_inventory_quantity
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION sync_inventory_quantity();

-- ============================================
-- 5. TRIGGER — library_loans → update library_books.available_qty
-- ============================================

CREATE OR REPLACE FUNCTION sync_library_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE library_books
    SET available_qty = available_qty - 1,
        updated_at    = NOW()
    WHERE id = NEW.book_id;

    IF (SELECT available_qty FROM library_books WHERE id = NEW.book_id) < 0 THEN
      RAISE EXCEPTION 'Aucun exemplaire disponible pour ce livre (id: %)', NEW.book_id;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN
    UPDATE library_books
    SET available_qty = available_qty + 1,
        updated_at    = NOW()
    WHERE id = NEW.book_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_library_availability
  AFTER INSERT OR UPDATE ON library_loans
  FOR EACH ROW EXECUTE FUNCTION sync_library_availability();

-- ============================================
-- 6. FONCTION — calculate_student_average
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_student_average(
  p_student_id       UUID,
  p_academic_year_id UUID,
  p_period           VARCHAR(20)
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_total_weighted DECIMAL := 0;
  v_total_coeff    DECIMAL := 0;
  rec              RECORD;
BEGIN
  FOR rec IN
    SELECT
      g.value,
      g.max_value,
      g.coefficient     AS grade_coeff,
      s.coefficient     AS subject_coeff
    FROM grades g
    JOIN subjects s ON s.id = g.subject_id
    WHERE g.student_id       = p_student_id
      AND g.academic_year_id = p_academic_year_id
      AND g.period           = p_period
  LOOP
    v_total_weighted := v_total_weighted
      + ((rec.value / NULLIF(rec.max_value, 0)) * 20.0 * rec.grade_coeff * rec.subject_coeff);
    v_total_coeff    := v_total_coeff + (rec.grade_coeff * rec.subject_coeff);
  END LOOP;

  IF v_total_coeff = 0 THEN
    RETURN NULL;
  END IF;

  RETURN ROUND(v_total_weighted / v_total_coeff, 2);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 7. FONCTION — generate_report_card
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_report_card(
  p_student_id       UUID,
  p_academic_year_id UUID,
  p_period           VARCHAR(20),
  p_classroom_id     UUID
)
RETURNS UUID AS $$
DECLARE
  v_establishment_id UUID;
  v_average          DECIMAL(5,2);
  v_rank             SMALLINT;
  v_total_students   SMALLINT;
  v_mention          VARCHAR(50);
  v_report_card_id   UUID;
BEGIN
  SELECT establishment_id INTO v_establishment_id
  FROM students WHERE id = p_student_id;

  v_average := public.calculate_student_average(p_student_id, p_academic_year_id, p_period);
  IF v_average IS NULL THEN
    RAISE EXCEPTION 'Aucune note trouvee pour cet eleve dans cette periode';
  END IF;

  v_mention := CASE
    WHEN v_average >= 16 THEN 'Tres Bien'
    WHEN v_average >= 14 THEN 'Bien'
    WHEN v_average >= 12 THEN 'Assez Bien'
    WHEN v_average >= 10 THEN 'Passable'
    ELSE 'Insuffisant'
  END;

  SELECT COUNT(*) + 1
  INTO v_rank
  FROM students s2
  WHERE s2.classroom_id = p_classroom_id
    AND s2.status       = 'active'
    AND s2.id           != p_student_id
    AND public.calculate_student_average(s2.id, p_academic_year_id, p_period) > v_average;

  SELECT COUNT(*)
  INTO v_total_students
  FROM students
  WHERE classroom_id = p_classroom_id AND status = 'active';

  INSERT INTO report_cards (
    establishment_id, student_id, academic_year_id, period,
    average, rank, total_students, mention, is_published
  )
  VALUES (
    v_establishment_id, p_student_id, p_academic_year_id, p_period,
    v_average, v_rank, v_total_students, v_mention, FALSE
  )
  ON CONFLICT (student_id, academic_year_id, period)
  DO UPDATE SET
    average        = EXCLUDED.average,
    rank           = EXCLUDED.rank,
    total_students = EXCLUDED.total_students,
    mention        = EXCLUDED.mention,
    updated_at     = NOW()
  RETURNING id INTO v_report_card_id;

  RETURN v_report_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. INDEX MANQUANTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_levels_cycle            ON levels(cycle_id);
CREATE INDEX IF NOT EXISTS idx_subjects_establishment  ON subjects(establishment_id);
CREATE INDEX IF NOT EXISTS idx_rooms_establishment     ON rooms(establishment_id);
CREATE INDEX IF NOT EXISTS idx_tracks_establishment    ON tracks(establishment_id);
CREATE INDEX IF NOT EXISTS idx_grades_academic_year    ON grades(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_student    ON report_cards(student_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date        ON attendances(date);
CREATE INDEX IF NOT EXISTS idx_attendances_student     ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id           ON staff_members(user_id);
