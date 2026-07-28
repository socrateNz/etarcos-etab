// ==================================================
// Etarcos Etab – Database Types
// Générés depuis le schéma Supabase PostgreSQL
// ==================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================
// ENUMS
// ============================================

export type EstablishmentStatus = "active" | "inactive" | "suspended" | "pending";
export type EstablishmentPlan = "free" | "starter" | "professional" | "enterprise";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";
export type AcademicYearStatus = "upcoming" | "active" | "closed";
export type PaymentStatus = "pending" | "paid" | "partial" | "overdue" | "cancelled";
export type Gender = "male" | "female" | "other";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type DisciplineLevel = "warning" | "reprimand" | "suspension" | "exclusion";

// ============================================
// CORE TABLES
// ============================================

export interface Owner {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: EstablishmentStatus;
  plan: EstablishmentPlan;
  settings: EstablishmentSettings;
  created_at: string;
  updated_at: string;
}

export interface EstablishmentSettings {
  timezone: string;
  currency: string;
  locale: string;
  academic_system: "semester" | "trimester" | "annual";
  grading_system: "20" | "100" | "letter";
  report_card_template: string;
  modules_enabled: string[];
  ai_assistant_enabled: boolean;
}

export interface EstablishmentOwner {
  establishment_id: string;
  owner_id: string;
  role: "primary" | "co-owner" | "investor";
  created_at: string;
  // Relations
  establishment?: Establishment;
  owner?: Owner;
}

export interface User {
  id: string;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  address: string | null;
  is_active: boolean;
  email_verified: boolean;
  last_login: string | null;
  establishment_id: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  establishment?: Establishment;
  roles?: Role[];
}

// ============================================
// RBAC
// ============================================

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  establishment_id: string | null;
  is_system: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  establishment_id: string;
  created_at: string;
  // Relations
  user?: User;
  role?: Role;
  establishment?: Establishment;
}

// ============================================
// ACADEMIC
// ============================================

export interface AcademicYear {
  id: string;
  establishment_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: AcademicYearStatus;
  created_at: string;
  updated_at: string;
}

export interface Cycle {
  id: string;
  establishment_id: string;
  name: string;
  code: string;
  description: string | null;
  order: number;
  created_at: string;
}

export interface Level {
  id: string;
  establishment_id: string;
  cycle_id: string;
  name: string;
  code: string;
  order: number;
  created_at: string;
  // Relations
  cycle?: Cycle;
}

export interface Classroom {
  id: string;
  establishment_id: string;
  level_id: string;
  academic_year_id: string;
  name: string;
  code: string;
  capacity: number;
  main_teacher_id: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  level?: Level;
  main_teacher?: User;
  _count?: { students: number };
}

export interface Subject {
  id: string;
  establishment_id: string;
  name: string;
  code: string;
  coefficient: number;
  color: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  establishment_id: string;
  name: string;
  type: "classroom" | "lab" | "library" | "gym" | "office" | "other";
  capacity: number;
  floor: number | null;
  building: string | null;
  is_available: boolean;
  created_at: string;
}

// ============================================
// STUDENTS & PARENTS
// ============================================

export interface Student {
  id: string;
  establishment_id: string;
  user_id: string;
  student_number: string;
  classroom_id: string | null;
  academic_year_id: string;
  enrollment_date: string;
  scholarship_type: "none" | "partial" | "full" | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
  classroom?: Classroom;
  parents?: Parent[];
}

export interface Parent {
  id: string;
  establishment_id: string;
  user_id: string;
  relationship: "father" | "mother" | "guardian" | "other";
  profession: string | null;
  is_emergency_contact: boolean;
  created_at: string;
  // Relations
  user?: User;
  students?: Student[];
}

// ============================================
// ACADEMIC RECORDS
// ============================================

export interface Grade {
  id: string;
  establishment_id: string;
  student_id: string;
  subject_id: string;
  classroom_id: string;
  academic_year_id: string;
  period: string;
  value: number;
  max_value: number;
  coefficient: number;
  type: "test" | "exam" | "homework" | "oral" | "practical";
  comment: string | null;
  graded_by: string;
  created_at: string;
  // Relations
  student?: Student;
  subject?: Subject;
}

export interface ReportCard {
  id: string;
  establishment_id: string;
  student_id: string;
  academic_year_id: string;
  period: string;
  average: number;
  rank: number | null;
  total_students: number | null;
  mention: string | null;
  appreciation: string | null;
  is_published: boolean;
  published_at: string | null;
  qr_code_url: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  student?: Student;
}

// ============================================
// FINANCIAL
// ============================================

export interface FeeCategory {
  id: string;
  establishment_id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  academic_year_id: string;
  level_id: string | null;
  is_mandatory: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  establishment_id: string;
  student_id: string;
  fee_category_id: string;
  academic_year_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  currency: string;
  status: PaymentStatus;
  payment_date: string | null;
  due_date: string;
  receipt_number: string | null;
  payment_method: "cash" | "transfer" | "check" | "mobile_money" | "card";
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  student?: Student;
  fee_category?: FeeCategory;
}

export interface Expense {
  id: string;
  establishment_id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  approved_by: string | null;
  created_by: string;
  created_at: string;
}

// ============================================
// HR & STAFF
// ============================================

export interface StaffMember {
  id: string;
  establishment_id: string;
  user_id: string;
  employee_number: string;
  department: string | null;
  position: string;
  hire_date: string;
  salary: number | null;
  contract_type: "permanent" | "temporary" | "part_time" | "intern";
  status: UserStatus;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
}

// ============================================
// LIBRARY
// ============================================

export interface Book {
  id: string;
  establishment_id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  published_year: number | null;
  category: string;
  quantity: number;
  available: number;
  cover_url: string | null;
  created_at: string;
}

// ============================================
// EXTENDED SCHEMA (migration 002 + 003)
// ============================================

export interface LibraryBook {
  id: string;
  establishment_id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  published_year: number | null;
  quantity: number;
  available_qty: number;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryLoan {
  id: string;
  establishment_id: string;
  book_id: string;
  borrower_id: string;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  establishment_id: string;
  name: string;
  code: string;
  category: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  location: string | null;
  supplier_info: Json | null;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  establishment_id: string;
  item_id: string;
  quantity: number;
  type: "purchase" | "usage" | "loss" | "return";
  description: string | null;
  recorded_by: string;
  created_at: string;
}

export interface NewsPost {
  id: string;
  establishment_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_url: string | null;
  is_published: boolean;
  published_at: string | null;
  author_id: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Relations
  author?: { id: string; name: string } | null;
}

// ============================================
// AUDIT
// ============================================

export interface AuditLog {
  id: string;
  user_id: string;
  establishment_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  changes: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Relations
  user?: User;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// ============================================
// PAGINATION & API RESPONSES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ============================================
// FLAT DATABASE TABLES (for Supabase ORM stability)
// ============================================

export interface OwnerTable {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface EstablishmentTable {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: EstablishmentStatus;
  plan: EstablishmentPlan;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface EstablishmentOwnerTable {
  establishment_id: string;
  owner_id: string;
  role: "primary" | "co-owner" | "investor";
  created_at: string;
}

export interface UserTable {
  id: string;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  address: string | null;
  is_active: boolean;
  email_verified: boolean;
  last_login: string | null;
  establishment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleTable {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  establishment_id: string | null;
  is_system: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionTable {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface RolePermissionTable {
  role_id: string;
  permission_id: string;
}

export interface UserRoleTable {
  user_id: string;
  role_id: string;
  establishment_id: string;
  created_at: string;
}

export interface AcademicYearTable {
  id: string;
  establishment_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: AcademicYearStatus;
  created_at: string;
  updated_at: string;
}

export interface StudentTable {
  id: string;
  establishment_id: string;
  user_id: string;
  student_number: string;
  classroom_id: string | null;
  academic_year_id: string;
  enrollment_date: string;
  scholarship_type: "none" | "partial" | "full" | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface ParentTable {
  id: string;
  establishment_id: string;
  user_id: string;
  relationship: "father" | "mother" | "guardian" | "other";
  profession: string | null;
  is_emergency_contact: boolean;
  created_at: string;
}

export interface GradeTable {
  id: string;
  establishment_id: string;
  student_id: string;
  subject_id: string;
  classroom_id: string;
  academic_year_id: string;
  period: string;
  value: number;
  max_value: number;
  coefficient: number;
  type: "test" | "exam" | "homework" | "oral" | "practical";
  comment: string | null;
  graded_by: string;
  created_at: string;
}

export interface ReportCardTable {
  id: string;
  establishment_id: string;
  student_id: string;
  academic_year_id: string;
  period: string;
  average: number;
  rank: number | null;
  total_students: number | null;
  mention: string | null;
  appreciation: string | null;
  is_published: boolean;
  published_at: string | null;
  qr_code_url: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTable {
  id: string;
  establishment_id: string;
  student_id: string;
  fee_category_id: string;
  academic_year_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  currency: string;
  status: PaymentStatus;
  payment_date: string | null;
  due_date: string;
  receipt_number: string | null;
  payment_method: "cash" | "transfer" | "check" | "mobile_money" | "card";
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseTable {
  id: string;
  establishment_id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  approved_by: string | null;
  created_by: string;
  created_at: string;
}

export interface AuditLogTable {
  id: string;
  user_id: string;
  establishment_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  changes: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface NotificationTable {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  link: string | null;
  created_at: string;
}

type FlatInsert<T> = Omit<T, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

type FlatUpdate<T> = Partial<Omit<T, "id">>;

export interface Database {
  public: {
    Tables: {
      owners: {
        Row: OwnerTable;
        Insert: FlatInsert<OwnerTable>;
        Update: FlatUpdate<OwnerTable>;
      };
      establishments: {
        Row: EstablishmentTable;
        Insert: FlatInsert<EstablishmentTable>;
        Update: FlatUpdate<EstablishmentTable>;
      };
      establishment_owners: {
        Row: EstablishmentOwnerTable;
        Insert: Omit<EstablishmentOwnerTable, "created_at"> & { created_at?: string };
        Update: Partial<EstablishmentOwnerTable>;
      };
      users: {
        Row: UserTable;
        Insert: Omit<UserTable, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: FlatUpdate<UserTable>;
      };
      roles: {
        Row: RoleTable;
        Insert: FlatInsert<RoleTable>;
        Update: FlatUpdate<RoleTable>;
      };
      permissions: {
        Row: PermissionTable;
        Insert: Omit<PermissionTable, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<PermissionTable, "id">>;
      };
      role_permissions: {
        Row: RolePermissionTable;
        Insert: RolePermissionTable;
        Update: Partial<RolePermissionTable>;
      };
      user_roles: {
        Row: UserRoleTable;
        Insert: Omit<UserRoleTable, "created_at"> & { created_at?: string };
        Update: Partial<UserRoleTable>;
      };
      academic_years: {
        Row: AcademicYearTable;
        Insert: FlatInsert<AcademicYearTable>;
        Update: FlatUpdate<AcademicYearTable>;
      };
      students: {
        Row: StudentTable;
        Insert: FlatInsert<StudentTable>;
        Update: FlatUpdate<StudentTable>;
      };
      parents: {
        Row: ParentTable;
        Insert: Omit<ParentTable, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<ParentTable, "id">>;
      };
      grades: {
        Row: GradeTable;
        Insert: Omit<GradeTable, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<GradeTable, "id">>;
      };
      report_cards: {
        Row: ReportCardTable;
        Insert: FlatInsert<ReportCardTable>;
        Update: FlatUpdate<ReportCardTable>;
      };
      payments: {
        Row: PaymentTable;
        Insert: FlatInsert<PaymentTable>;
        Update: FlatUpdate<PaymentTable>;
      };
      expenses: {
        Row: ExpenseTable;
        Insert: Omit<ExpenseTable, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<ExpenseTable, "id">>;
      };
      audit_logs: {
        Row: AuditLogTable;
        Insert: Omit<AuditLogTable, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: never;
      };
      notifications: {
        Row: NotificationTable;
        Insert: Omit<NotificationTable, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<NotificationTable, "id">>;
      };
    };
  };
}
