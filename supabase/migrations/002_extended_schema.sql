-- ==================================================
-- Etarcos Etab – Migration 002: Extended Schema
-- ==================================================

-- ============================================
-- 1. ACADEMIC PERIODS & TRACKS (FILIÈRES)
-- ============================================

-- Configurable Academic Periods (Trimesters, Semesters)
CREATE TABLE academic_periods (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL, -- e.g., '1er Trimestre', 'Semestre 1'
  code             VARCHAR(20) NOT NULL,  -- e.g., 'T1', 'S1'
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  weight           DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_period_dates CHECK (end_date > start_date),
  UNIQUE (establishment_id, academic_year_id, code)
);

-- Tracks / Specialties (Filières)
CREATE TABLE tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             VARCHAR(150) NOT NULL, -- e.g., 'Scientifique (S)', 'Gestion'
  code             VARCHAR(20) NOT NULL,  -- e.g., 'F1', 'IND'
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (establishment_id, code)
);

-- Alter existing Core Academic tables to link optional tracks
ALTER TABLE classrooms ADD COLUMN track_id UUID REFERENCES tracks(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN track_id UUID REFERENCES tracks(id) ON DELETE SET NULL;
ALTER TABLE subjects ADD COLUMN track_id UUID REFERENCES tracks(id) ON DELETE SET NULL;

-- ============================================
-- 2. TIMETABLES (EMPLOIS DU TEMPS) & EXAMS
-- ============================================

-- Weekly Lessons Scheduling
CREATE TABLE lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  classroom_id     UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  subject_id       UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id          UUID REFERENCES rooms(id) ON DELETE SET NULL,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  day_of_week      SMALLINT NOT NULL CONSTRAINT chk_day_of_week CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Lundi, 7 = Dimanche
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_lesson_time CHECK (end_time > start_time)
);

-- Exam sessions / planning
CREATE TABLE exams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             VARCHAR(150) NOT NULL, -- e.g., 'Examen Régional de Mathématiques'
  classroom_id     UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  subject_id       UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  period_id        UUID REFERENCES academic_periods(id) ON DELETE SET NULL,
  exam_date        DATE NOT NULL,
  start_time       TIME,
  end_time         TIME,
  room_id          UUID REFERENCES rooms(id) ON DELETE SET NULL,
  max_score        DECIMAL(6,2) NOT NULL DEFAULT 20.00,
  coefficient      DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_exam_time CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
);

-- ============================================
-- 3. DISCIPLINE
-- ============================================

-- Student discipline reports and punishments
CREATE TABLE discipline_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  level            discipline_level NOT NULL DEFAULT 'warning',
  reason           TEXT NOT NULL,
  decision         TEXT,
  incident_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_days    SMALLINT, -- for suspensions
  recorded_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  status           user_status NOT NULL DEFAULT 'active', -- active/pending approval etc.
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. LIBRARY (BIBLIOTHÈQUE)
-- ============================================

-- Library Book Catalog
CREATE TABLE library_books (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  title            VARCHAR(300) NOT NULL,
  author           VARCHAR(200) NOT NULL,
  isbn             VARCHAR(20),
  category         VARCHAR(100),
  publisher        VARCHAR(200),
  published_year   INTEGER,
  quantity         SMALLINT NOT NULL DEFAULT 1,
  available_qty    SMALLINT NOT NULL DEFAULT 1,
  location         VARCHAR(100), -- Shelf, floor, cabinet
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Library loans register
CREATE TABLE library_loans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  book_id          UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  borrower_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE NOT NULL,
  return_date      DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_loan_dates CHECK (due_date >= loan_date)
);

-- ============================================
-- 5. INVENTORY (INVENTAIRE)
-- ============================================

-- Inventory items registry
CREATE TABLE inventory_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             VARCHAR(200) NOT NULL,
  code             VARCHAR(50) NOT NULL,
  category         VARCHAR(100),
  description      TEXT,
  quantity         INTEGER NOT NULL DEFAULT 0,
  unit             VARCHAR(20) NOT NULL DEFAULT 'pcs',
  location         VARCHAR(100),
  supplier_info    JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (establishment_id, code)
);

-- Stock inputs and outputs
CREATE TABLE stock_movements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  item_id          UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity         INTEGER NOT NULL, -- positive for in, negative for out
  type             VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'loss', 'return'
  description      TEXT,
  recorded_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. HUMAN RESOURCES & LEAVE REQUESTS
-- ============================================

-- Leave and absence tracking for staff members
CREATE TABLE leave_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  staff_member_id  UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  type             VARCHAR(100) NOT NULL, -- 'sick', 'vacation', 'maternity', 'other'
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  reason           TEXT,
  status           user_status NOT NULL DEFAULT 'pending',
  approved_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_leave_dates CHECK (end_date >= start_date)
);

-- ============================================
-- 7. DOCUMENTS & DIPLOMAS (DIPLÔMES)
-- ============================================

-- Documents storage register
CREATE TABLE documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  file_url         TEXT NOT NULL,
  file_type        VARCHAR(100),
  file_size        INTEGER,
  category         VARCHAR(100), -- 'report_card', 'receipt', 'contract', 'id_card', 'other'
  owner_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  is_public        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certificates and diplomas registry
CREATE TABLE diplomas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name             VARCHAR(200) NOT NULL, -- e.g., 'Baccalauréat Général', 'BEPC'
  serial_number    VARCHAR(100) UNIQUE NOT NULL,
  issue_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  hash_signature   VARCHAR(256), -- cryptographic hash for integrity check
  pdf_url          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_academic_periods_year ON academic_periods(academic_year_id);
CREATE INDEX idx_lessons_classroom ON lessons(classroom_id);
CREATE INDEX idx_lessons_teacher ON lessons(teacher_id);
CREATE INDEX idx_exams_classroom ON exams(classroom_id);
CREATE INDEX idx_exams_period ON exams(period_id);
CREATE INDEX idx_discipline_student ON discipline_records(student_id);
CREATE INDEX idx_library_books_title ON library_books(title, author);
CREATE INDEX idx_library_loans_borrower ON library_loans(borrower_id);
CREATE INDEX idx_inventory_items_code ON inventory_items(code);
CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_member_id);
CREATE INDEX idx_documents_establishment ON documents(establishment_id);
CREATE INDEX idx_diplomas_student ON diplomas(student_id);

-- ============================================
-- 9. TRIGGERS FOR updated_at
-- ============================================

CREATE TRIGGER trg_academic_periods_updated_at BEFORE UPDATE ON academic_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_discipline_records_updated_at BEFORE UPDATE ON discipline_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_library_books_updated_at BEFORE UPDATE ON library_books FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_library_loans_updated_at BEFORE UPDATE ON library_loans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE diplomas ENABLE ROW LEVEL SECURITY;

-- Policies: Establishments scope matches
CREATE POLICY "academic_periods_policy" ON academic_periods FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "tracks_policy" ON tracks FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "lessons_policy" ON lessons FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "exams_policy" ON exams FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "discipline_records_policy" ON discipline_records FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "library_books_policy" ON library_books FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "library_loans_policy" ON library_loans FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "inventory_items_policy" ON inventory_items FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "stock_movements_policy" ON stock_movements FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "leave_requests_policy" ON leave_requests FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "documents_policy" ON documents FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
CREATE POLICY "diplomas_policy" ON diplomas FOR ALL USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());
