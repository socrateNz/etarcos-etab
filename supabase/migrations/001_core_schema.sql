-- ==================================================
-- Etarcos Etab – Migration 001: Core Schema
-- ==================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE establishment_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE establishment_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE academic_year_status AS ENUM ('upcoming', 'active', 'closed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'overdue', 'cancelled');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE discipline_level AS ENUM ('warning', 'reprimand', 'suspension', 'exclusion');
CREATE TYPE contract_type AS ENUM ('permanent', 'temporary', 'part_time', 'intern');
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian', 'other');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'check', 'mobile_money', 'card');
CREATE TYPE owner_role AS ENUM ('primary', 'co-owner', 'investor');
CREATE TYPE room_type AS ENUM ('classroom', 'lab', 'library', 'gym', 'office', 'other');
CREATE TYPE grade_type AS ENUM ('test', 'exam', 'homework', 'oral', 'practical');
CREATE TYPE scholarship_type AS ENUM ('none', 'partial', 'full');
CREATE TYPE grading_system AS ENUM ('20', '100', 'letter');
CREATE TYPE academic_system AS ENUM ('semester', 'trimester', 'annual');

-- ============================================
-- CORE TABLES
-- ============================================

-- Owners (propriétaires d'établissements)
CREATE TABLE owners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  phone       VARCHAR(30),
  avatar_url  TEXT,
  status      user_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Establishments
CREATE TABLE establishments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(300) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  logo_url    TEXT,
  banner_url  TEXT,
  address     TEXT,
  city        VARCHAR(100),
  country     VARCHAR(100) NOT NULL DEFAULT 'Cameroun',
  phone       VARCHAR(30),
  email       VARCHAR(255),
  website     VARCHAR(255),
  status      establishment_status NOT NULL DEFAULT 'active',
  plan        establishment_plan NOT NULL DEFAULT 'free',
  settings    JSONB NOT NULL DEFAULT '{
    "timezone": "Africa/Douala",
    "currency": "XAF",
    "locale": "fr-CM",
    "academic_system": "trimester",
    "grading_system": "20",
    "report_card_template": "default",
    "modules_enabled": ["dashboard", "students", "classes", "grades", "payments"],
    "ai_assistant_enabled": false
  }'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Many-to-Many: Establishment <-> Owners
CREATE TABLE establishment_owners (
  establishment_id  UUID REFERENCES establishments(id) ON DELETE CASCADE,
  owner_id          UUID REFERENCES owners(id) ON DELETE CASCADE,
  role              owner_role NOT NULL DEFAULT 'primary',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (establishment_id, owner_id)
);

-- Users
CREATE TABLE users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            VARCHAR(255) UNIQUE NOT NULL,
  name             VARCHAR(200) NOT NULL,
  first_name       VARCHAR(100),
  last_name        VARCHAR(100),
  avatar_url       TEXT,
  phone            VARCHAR(30),
  gender           gender,
  date_of_birth    DATE,
  address          TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  last_login       TIMESTAMPTZ,
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RBAC
-- ============================================

-- Roles
CREATE TABLE roles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  slug             VARCHAR(100) NOT NULL,
  description      TEXT,
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  is_system        BOOLEAN NOT NULL DEFAULT FALSE,
  color            VARCHAR(20),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug, establishment_id)
);

-- Permissions
CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  module      VARCHAR(100) NOT NULL,
  action      VARCHAR(50) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role <-> Permissions
CREATE TABLE role_permissions (
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User <-> Roles
CREATE TABLE user_roles (
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id          UUID REFERENCES roles(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id, establishment_id)
);

-- ============================================
-- ACADEMIC
-- ============================================

-- Academic Years
CREATE TABLE academic_years (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             VARCHAR(20) NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  is_current       BOOLEAN NOT NULL DEFAULT FALSE,
  status           academic_year_status NOT NULL DEFAULT 'upcoming',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Cycles
CREATE TABLE cycles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  code             VARCHAR(20) NOT NULL,
  description      TEXT,
  "order"          SMALLINT NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Levels
CREATE TABLE levels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  cycle_id         UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  code             VARCHAR(20) NOT NULL,
  "order"          SMALLINT NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Classrooms
CREATE TABLE classrooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  level_id         UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  code             VARCHAR(30) NOT NULL,
  capacity         SMALLINT NOT NULL DEFAULT 40,
  main_teacher_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subjects
CREATE TABLE subjects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             VARCHAR(200) NOT NULL,
  code             VARCHAR(20) NOT NULL,
  coefficient      DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  color            VARCHAR(20),
  description      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rooms
CREATE TABLE rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  type             room_type NOT NULL DEFAULT 'classroom',
  capacity         SMALLINT NOT NULL DEFAULT 40,
  floor            SMALLINT,
  building         VARCHAR(100),
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STUDENTS & PARENTS
-- ============================================

-- Students
CREATE TABLE students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_number   VARCHAR(30) UNIQUE NOT NULL,
  classroom_id     UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  enrollment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  scholarship_type scholarship_type NOT NULL DEFAULT 'none',
  status           user_status NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parents
CREATE TABLE parents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id     UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship         relationship_type NOT NULL,
  profession           VARCHAR(200),
  is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student <-> Parents
CREATE TABLE student_parents (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES parents(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, parent_id)
);

-- ============================================
-- GRADES & REPORT CARDS
-- ============================================

-- Grades
CREATE TABLE grades (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id       UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  classroom_id     UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  period           VARCHAR(20) NOT NULL, -- 'T1', 'T2', 'T3', 'S1', 'S2'
  value            DECIMAL(6,2) NOT NULL,
  max_value        DECIMAL(6,2) NOT NULL DEFAULT 20,
  coefficient      DECIMAL(4,2) NOT NULL DEFAULT 1,
  type             grade_type NOT NULL DEFAULT 'test',
  comment          TEXT,
  graded_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_grade CHECK (value >= 0 AND value <= max_value)
);

-- Report Cards
CREATE TABLE report_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  period           VARCHAR(20) NOT NULL,
  average          DECIMAL(5,2) NOT NULL,
  rank             SMALLINT,
  total_students   SMALLINT,
  mention          VARCHAR(50),
  appreciation     TEXT,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  published_at     TIMESTAMPTZ,
  qr_code_url      TEXT,
  pdf_url          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, academic_year_id, period)
);

-- ============================================
-- FINANCIAL
-- ============================================

-- Fee Categories
CREATE TABLE fee_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             VARCHAR(200) NOT NULL,
  description      TEXT,
  amount           DECIMAL(15,2) NOT NULL,
  currency         VARCHAR(10) NOT NULL DEFAULT 'XAF',
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  level_id         UUID REFERENCES levels(id) ON DELETE SET NULL,
  is_mandatory     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_category_id  UUID NOT NULL REFERENCES fee_categories(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  amount           DECIMAL(15,2) NOT NULL,
  amount_paid      DECIMAL(15,2) NOT NULL DEFAULT 0,
  balance          DECIMAL(15,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
  currency         VARCHAR(10) NOT NULL DEFAULT 'XAF',
  status           payment_status NOT NULL DEFAULT 'pending',
  payment_date     DATE,
  due_date         DATE NOT NULL,
  receipt_number   VARCHAR(50) UNIQUE,
  payment_method   payment_method,
  notes            TEXT,
  created_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  category         VARCHAR(100) NOT NULL,
  description      VARCHAR(500) NOT NULL,
  amount           DECIMAL(15,2) NOT NULL,
  currency         VARCHAR(10) NOT NULL DEFAULT 'XAF',
  expense_date     DATE NOT NULL,
  receipt_url      TEXT,
  approved_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HR & STAFF
-- ============================================

-- Staff Members
CREATE TABLE staff_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_number  VARCHAR(30) UNIQUE NOT NULL,
  department       VARCHAR(100),
  position         VARCHAR(200) NOT NULL,
  hire_date        DATE NOT NULL,
  salary           DECIMAL(15,2),
  contract_type    contract_type NOT NULL DEFAULT 'permanent',
  status           user_status NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance
CREATE TABLE attendances (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  classroom_id     UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  subject_id       UUID REFERENCES subjects(id) ON DELETE SET NULL,
  date             DATE NOT NULL,
  status           attendance_status NOT NULL DEFAULT 'present',
  justification    TEXT,
  recorded_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, classroom_id, date, subject_id)
);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  action           VARCHAR(100) NOT NULL,
  entity           VARCHAR(100) NOT NULL,
  entity_id        UUID,
  changes          JSONB,
  ip_address       INET,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'info',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Establishments
CREATE INDEX idx_establishments_slug ON establishments(slug);
CREATE INDEX idx_establishments_status ON establishments(status);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_establishment ON users(establishment_id);

-- Students
CREATE INDEX idx_students_establishment ON students(establishment_id);
CREATE INDEX idx_students_classroom ON students(classroom_id);
CREATE INDEX idx_students_academic_year ON students(academic_year_id);
CREATE INDEX idx_students_number ON students(student_number);

-- Grades
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_classroom ON grades(classroom_id);
CREATE INDEX idx_grades_period ON grades(period);

-- Payments
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);

-- Audit logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- TRIGGERS: updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_establishments_updated_at BEFORE UPDATE ON establishments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_academic_years_updated_at BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_classrooms_updated_at BEFORE UPDATE ON classrooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_report_cards_updated_at BEFORE UPDATE ON report_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishment_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's establishment
CREATE OR REPLACE FUNCTION public.current_establishment_id()
RETURNS UUID AS $$
  SELECT establishment_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.slug = 'super_admin' AND r.is_system = TRUE
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Users: can read own profile or same establishment
CREATE POLICY "users_select_policy" ON users FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
  );

CREATE POLICY "users_update_policy" ON users FOR UPDATE
  USING (id = auth.uid() OR public.is_super_admin());

-- Establishments: accessible by their users
CREATE POLICY "establishments_select_policy" ON establishments FOR SELECT
  USING (
    public.is_super_admin()
    OR id = public.current_establishment_id()
    OR id IN (SELECT establishment_id FROM establishment_owners eo JOIN owners o ON o.id = eo.owner_id WHERE o.user_id = auth.uid())
  );

-- Students: accessible within same establishment
CREATE POLICY "students_select_policy" ON students FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR user_id = auth.uid()
  );

CREATE POLICY "students_insert_policy" ON students FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());

CREATE POLICY "students_update_policy" ON students FOR UPDATE
  USING (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Grades: accessible by teachers and students within establishment
CREATE POLICY "grades_select_policy" ON grades FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "grades_insert_policy" ON grades FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id() OR public.is_super_admin());

-- Payments: accessible within establishment
CREATE POLICY "payments_select_policy" ON payments FOR SELECT
  USING (
    public.is_super_admin()
    OR establishment_id = public.current_establishment_id()
    OR student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- Audit logs: super admin only
CREATE POLICY "audit_logs_select_policy" ON audit_logs FOR SELECT
  USING (public.is_super_admin() OR user_id = auth.uid());

CREATE POLICY "audit_logs_insert_policy" ON audit_logs FOR INSERT
  WITH CHECK (TRUE); -- Anyone can insert their own audit log

-- Permissions: readable by all authenticated
CREATE POLICY "permissions_select_policy" ON permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Roles: readable within establishment
CREATE POLICY "roles_select_policy" ON roles FOR SELECT
  USING (
    public.is_super_admin()
    OR is_system = TRUE
    OR establishment_id = public.current_establishment_id()
  );
