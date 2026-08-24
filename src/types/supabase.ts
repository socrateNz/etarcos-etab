export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_periods: {
        Row: {
          academic_year_id: string
          code: string
          created_at: string
          end_date: string
          establishment_id: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
          weight: number
        }
        Insert: {
          academic_year_id: string
          code: string
          created_at?: string
          end_date: string
          establishment_id: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
          weight?: number
        }
        Update: {
          academic_year_id?: string
          code?: string
          created_at?: string
          end_date?: string
          establishment_id?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_periods_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_periods_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          establishment_id: string
          id: string
          is_current: boolean
          name: string
          start_date: string
          status: Database["public"]["Enums"]["academic_year_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          establishment_id: string
          id?: string
          is_current?: boolean
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["academic_year_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          establishment_id?: string
          id?: string
          is_current?: boolean
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["academic_year_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          classroom_id: string
          created_at: string
          date: string
          establishment_id: string
          id: string
          justification: string | null
          recorded_by: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string
          date: string
          establishment_id: string
          id?: string
          justification?: string | null
          recorded_by: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string
          date?: string
          establishment_id?: string
          id?: string
          justification?: string | null
          recorded_by?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendances_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          establishment_id: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          establishment_id?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          establishment_id?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          academic_year_id: string
          capacity: number
          code: string
          created_at: string
          establishment_id: string
          id: string
          level_id: string
          main_teacher_id: string | null
          name: string
          track_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          capacity?: number
          code: string
          created_at?: string
          establishment_id: string
          id?: string
          level_id: string
          main_teacher_id?: string | null
          name: string
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          capacity?: number
          code?: string
          created_at?: string
          establishment_id?: string
          id?: string
          level_id?: string
          main_teacher_id?: string | null
          name?: string
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_main_teacher_id_fkey"
            columns: ["main_teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      cycles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          establishment_id: string
          id: string
          name: string
          order: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          establishment_id: string
          id?: string
          name: string
          order?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          establishment_id?: string
          id?: string
          name?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "cycles_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      diplomas: {
        Row: {
          academic_year_id: string
          created_at: string
          establishment_id: string
          hash_signature: string | null
          id: string
          issue_date: string
          name: string
          pdf_url: string | null
          serial_number: string
          student_id: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          establishment_id: string
          hash_signature?: string | null
          id?: string
          issue_date?: string
          name: string
          pdf_url?: string | null
          serial_number: string
          student_id: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          establishment_id?: string
          hash_signature?: string | null
          id?: string
          issue_date?: string
          name?: string
          pdf_url?: string | null
          serial_number?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diplomas_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diplomas_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diplomas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      id_cards: {
        Row: {
          academic_year_id: string
          created_at: string
          establishment_id: string
          expiry_date: string | null
          id: string
          issue_date: string
          serial_number: string
          student_id: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          establishment_id: string
          expiry_date?: string | null
          id?: string
          issue_date?: string
          serial_number: string
          student_id: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          establishment_id?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string
          serial_number?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "id_cards_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_cards_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_records: {
        Row: {
          academic_year_id: string
          approved_by: string | null
          created_at: string
          decision: string | null
          duration_days: number | null
          establishment_id: string
          id: string
          incident_date: string
          level: Database["public"]["Enums"]["discipline_level"]
          reason: string
          recorded_by: string
          status: Database["public"]["Enums"]["user_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          approved_by?: string | null
          created_at?: string
          decision?: string | null
          duration_days?: number | null
          establishment_id: string
          id?: string
          incident_date?: string
          level?: Database["public"]["Enums"]["discipline_level"]
          reason: string
          recorded_by: string
          status?: Database["public"]["Enums"]["user_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          approved_by?: string | null
          created_at?: string
          decision?: string | null
          duration_days?: number | null
          establishment_id?: string
          id?: string
          incident_date?: string
          level?: Database["public"]["Enums"]["discipline_level"]
          reason?: string
          recorded_by?: string
          status?: Database["public"]["Enums"]["user_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_records_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_records_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          establishment_id: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_public: boolean
          owner_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          establishment_id: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_public?: boolean
          owner_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_public?: boolean
          owner_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_owners: {
        Row: {
          created_at: string
          establishment_id: string
          owner_id: string
          role: Database["public"]["Enums"]["owner_role"]
        }
        Insert: {
          created_at?: string
          establishment_id: string
          owner_id: string
          role?: Database["public"]["Enums"]["owner_role"]
        }
        Update: {
          created_at?: string
          establishment_id?: string
          owner_id?: string
          role?: Database["public"]["Enums"]["owner_role"]
        }
        Relationships: [
          {
            foreignKeyName: "establishment_owners_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishment_owners_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          country: string
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["establishment_plan"]
          settings: Json
          slug: string
          status: Database["public"]["Enums"]["establishment_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["establishment_plan"]
          settings?: Json
          slug: string
          status?: Database["public"]["Enums"]["establishment_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["establishment_plan"]
          settings?: Json
          slug?: string
          status?: Database["public"]["Enums"]["establishment_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          academic_year_id: string
          classroom_id: string | null
          coefficient: number
          created_at: string
          end_time: string | null
          establishment_id: string
          exam_date: string
          id: string
          max_score: number
          name: string
          period_id: string | null
          room_id: string | null
          start_time: string | null
          subject_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          classroom_id?: string | null
          coefficient?: number
          created_at?: string
          end_time?: string | null
          establishment_id: string
          exam_date: string
          id?: string
          max_score?: number
          name: string
          period_id?: string | null
          room_id?: string | null
          start_time?: string | null
          subject_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          classroom_id?: string | null
          coefficient?: number
          created_at?: string
          end_time?: string | null
          establishment_id?: string
          exam_date?: string
          id?: string
          max_score?: number
          name?: string
          period_id?: string | null
          room_id?: string | null
          start_time?: string | null
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: string
          created_at: string
          created_by: string
          currency: string
          description: string
          establishment_id: string
          expense_date: string
          id: string
          receipt_url: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category: string
          created_at?: string
          created_by: string
          currency?: string
          description: string
          establishment_id: string
          expense_date: string
          id?: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          establishment_id?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          academic_year_id: string
          amount: number
          created_at: string
          currency: string
          description: string | null
          establishment_id: string
          id: string
          is_mandatory: boolean
          level_id: string | null
          name: string
        }
        Insert: {
          academic_year_id: string
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          establishment_id: string
          id?: string
          is_mandatory?: boolean
          level_id?: string | null
          name: string
        }
        Update: {
          academic_year_id?: string
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          establishment_id?: string
          id?: string
          is_mandatory?: boolean
          level_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_categories_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_categories_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          academic_year_id: string
          classroom_id: string
          coefficient: number
          comment: string | null
          created_at: string
          establishment_id: string
          graded_by: string
          id: string
          max_value: number
          period: string
          student_id: string
          subject_id: string
          type: Database["public"]["Enums"]["grade_type"]
          value: number
        }
        Insert: {
          academic_year_id: string
          classroom_id: string
          coefficient?: number
          comment?: string | null
          created_at?: string
          establishment_id: string
          graded_by: string
          id?: string
          max_value?: number
          period: string
          student_id: string
          subject_id: string
          type?: Database["public"]["Enums"]["grade_type"]
          value: number
        }
        Update: {
          academic_year_id?: string
          classroom_id?: string
          coefficient?: number
          comment?: string | null
          created_at?: string
          establishment_id?: string
          graded_by?: string
          id?: string
          max_value?: number
          period?: string
          student_id?: string
          subject_id?: string
          type?: Database["public"]["Enums"]["grade_type"]
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          establishment_id: string
          id: string
          location: string | null
          name: string
          quantity: number
          supplier_info: Json | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          establishment_id: string
          id?: string
          location?: string | null
          name: string
          quantity?: number
          supplier_info?: Json | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          establishment_id?: string
          id?: string
          location?: string | null
          name?: string
          quantity?: number
          supplier_info?: Json | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          end_date: string
          establishment_id: string
          id: string
          reason: string | null
          staff_member_id: string
          start_date: string
          status: Database["public"]["Enums"]["user_status"]
          type: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          end_date: string
          establishment_id: string
          id?: string
          reason?: string | null
          staff_member_id: string
          start_date: string
          status?: Database["public"]["Enums"]["user_status"]
          type: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          end_date?: string
          establishment_id?: string
          id?: string
          reason?: string | null
          staff_member_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["user_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          academic_year_id: string
          classroom_id: string
          created_at: string
          day_of_week: number
          end_time: string
          establishment_id: string
          id: string
          room_id: string | null
          start_time: string
          subject_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          classroom_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          establishment_id: string
          id?: string
          room_id?: string | null
          start_time: string
          subject_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          classroom_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          establishment_id?: string
          id?: string
          room_id?: string | null
          start_time?: string
          subject_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          code: string
          created_at: string
          cycle_id: string
          establishment_id: string
          id: string
          name: string
          order: number
        }
        Insert: {
          code: string
          created_at?: string
          cycle_id: string
          establishment_id: string
          id?: string
          name: string
          order?: number
        }
        Update: {
          code?: string
          created_at?: string
          cycle_id?: string
          establishment_id?: string
          id?: string
          name?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "levels_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "levels_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          author: string
          available_qty: number
          category: string | null
          created_at: string
          establishment_id: string
          id: string
          isbn: string | null
          location: string | null
          published_year: number | null
          publisher: string | null
          quantity: number
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          available_qty?: number
          category?: string | null
          created_at?: string
          establishment_id: string
          id?: string
          isbn?: string | null
          location?: string | null
          published_year?: number | null
          publisher?: string | null
          quantity?: number
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          available_qty?: number
          category?: string | null
          created_at?: string
          establishment_id?: string
          id?: string
          isbn?: string | null
          location?: string | null
          published_year?: number | null
          publisher?: string | null
          quantity?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_books_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      library_loans: {
        Row: {
          book_id: string
          borrower_id: string
          created_at: string
          due_date: string
          establishment_id: string
          id: string
          loan_date: string
          notes: string | null
          return_date: string | null
          updated_at: string
        }
        Insert: {
          book_id: string
          borrower_id: string
          created_at?: string
          due_date: string
          establishment_id: string
          id?: string
          loan_date?: string
          notes?: string | null
          return_date?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          borrower_id?: string
          created_at?: string
          due_date?: string
          establishment_id?: string
          id?: string
          loan_date?: string
          notes?: string | null
          return_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_loans_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          author_id: string
          content: string
          cover_url: string | null
          created_at: string
          establishment_id: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          cover_url?: string | null
          created_at?: string
          establishment_id: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          establishment_id?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_posts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      parents: {
        Row: {
          created_at: string
          establishment_id: string
          id: string
          is_emergency_contact: boolean
          profession: string | null
          relationship: Database["public"]["Enums"]["relationship_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          establishment_id: string
          id?: string
          is_emergency_contact?: boolean
          profession?: string | null
          relationship: Database["public"]["Enums"]["relationship_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          establishment_id?: string
          id?: string
          is_emergency_contact?: boolean
          profession?: string | null
          relationship?: Database["public"]["Enums"]["relationship_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parents_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          academic_year_id: string
          amount: number
          amount_paid: number
          balance: number | null
          created_at: string
          created_by: string
          currency: string
          due_date: string
          establishment_id: string
          fee_category_id: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          receipt_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          amount: number
          amount_paid?: number
          balance?: number | null
          created_at?: string
          created_by: string
          currency?: string
          due_date: string
          establishment_id: string
          fee_category_id: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          amount?: number
          amount_paid?: number
          balance?: number | null
          created_at?: string
          created_by?: string
          currency?: string
          due_date?: string
          establishment_id?: string
          fee_category_id?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          module: string
          name: string
          slug: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
          name: string
          slug: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      report_cards: {
        Row: {
          academic_year_id: string
          appreciation: string | null
          average: number
          created_at: string
          establishment_id: string
          id: string
          is_published: boolean
          mention: string | null
          pdf_url: string | null
          period: string
          published_at: string | null
          qr_code_url: string | null
          rank: number | null
          student_id: string
          total_students: number | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          appreciation?: string | null
          average: number
          created_at?: string
          establishment_id: string
          id?: string
          is_published?: boolean
          mention?: string | null
          pdf_url?: string | null
          period: string
          published_at?: string | null
          qr_code_url?: string | null
          rank?: number | null
          student_id: string
          total_students?: number | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          appreciation?: string | null
          average?: number
          created_at?: string
          establishment_id?: string
          id?: string
          is_published?: boolean
          mention?: string | null
          pdf_url?: string | null
          period?: string
          published_at?: string | null
          qr_code_url?: string | null
          rank?: number | null
          student_id?: string
          total_students?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          establishment_id: string | null
          id: string
          is_system: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string | null
          id?: string
          is_system?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string | null
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          building: string | null
          capacity: number
          created_at: string
          establishment_id: string
          floor: number | null
          id: string
          is_available: boolean
          name: string
          type: Database["public"]["Enums"]["room_type"]
        }
        Insert: {
          building?: string | null
          capacity?: number
          created_at?: string
          establishment_id: string
          floor?: number | null
          id?: string
          is_available?: boolean
          name: string
          type?: Database["public"]["Enums"]["room_type"]
        }
        Update: {
          building?: string | null
          capacity?: number
          created_at?: string
          establishment_id?: string
          floor?: number | null
          id?: string
          is_available?: boolean
          name?: string
          type?: Database["public"]["Enums"]["room_type"]
        }
        Relationships: [
          {
            foreignKeyName: "rooms_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          department: string | null
          employee_number: string
          establishment_id: string
          hire_date: string
          id: string
          position: string
          salary: number | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          department?: string | null
          employee_number: string
          establishment_id: string
          hire_date: string
          id?: string
          position: string
          salary?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          department?: string | null
          employee_number?: string
          establishment_id?: string
          hire_date?: string
          id?: string
          position?: string
          salary?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          description: string | null
          establishment_id: string
          id: string
          item_id: string
          quantity: number
          recorded_by: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          establishment_id: string
          id?: string
          item_id: string
          quantity: number
          recorded_by: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          establishment_id?: string
          id?: string
          item_id?: string
          quantity?: number
          recorded_by?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year_id: string
          classroom_id: string | null
          created_at: string
          enrollment_date: string
          establishment_id: string
          id: string
          scholarship_type: Database["public"]["Enums"]["scholarship_type"]
          status: Database["public"]["Enums"]["user_status"]
          student_number: string
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year_id: string
          classroom_id?: string | null
          created_at?: string
          enrollment_date?: string
          establishment_id: string
          id?: string
          scholarship_type?: Database["public"]["Enums"]["scholarship_type"]
          status?: Database["public"]["Enums"]["user_status"]
          student_number: string
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_year_id?: string
          classroom_id?: string | null
          created_at?: string
          enrollment_date?: string
          establishment_id?: string
          id?: string
          scholarship_type?: Database["public"]["Enums"]["scholarship_type"]
          status?: Database["public"]["Enums"]["user_status"]
          student_number?: string
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          coefficient: number
          color: string | null
          created_at: string
          description: string | null
          establishment_id: string
          id: string
          is_active: boolean
          name: string
          track_id: string | null
        }
        Insert: {
          code: string
          coefficient?: number
          color?: string | null
          created_at?: string
          description?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean
          name: string
          track_id?: string | null
        }
        Update: {
          code?: string
          coefficient?: number
          color?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean
          name?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          code: string
          created_at: string
          description: string | null
          establishment_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          establishment_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          establishment_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          establishment_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          establishment_id: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          establishment_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          email_verified: boolean
          establishment_id: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          is_active: boolean
          last_login: string | null
          last_name: string | null
          name: string
          phone: string | null
          requires_password_change: boolean | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          email_verified?: boolean
          establishment_id?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          is_active?: boolean
          last_login?: string | null
          last_name?: string | null
          name: string
          phone?: string | null
          requires_password_change?: boolean | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean
          establishment_id?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          last_name?: string | null
          name?: string
          phone?: string | null
          requires_password_change?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_student_average: {
        Args: {
          p_academic_year_id: string
          p_period: string
          p_student_id: string
        }
        Returns: number
      }
      current_establishment_id: { Args: never; Returns: string }
      generate_report_card: {
        Args: {
          p_academic_year_id: string
          p_classroom_id: string
          p_period: string
          p_student_id: string
        }
        Returns: string
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      academic_system: "semester" | "trimester" | "annual"
      academic_year_status: "upcoming" | "active" | "closed"
      attendance_status: "present" | "absent" | "late" | "excused"
      contract_type: "permanent" | "temporary" | "part_time" | "intern"
      discipline_level: "warning" | "reprimand" | "suspension" | "exclusion"
      establishment_plan: "free" | "starter" | "professional" | "enterprise"
      establishment_status: "active" | "inactive" | "suspended" | "pending"
      gender: "male" | "female" | "other"
      grade_type: "test" | "exam" | "homework" | "oral" | "practical"
      grading_system: "20" | "100" | "letter"
      owner_role: "primary" | "co-owner" | "investor"
      payment_method: "cash" | "transfer" | "check" | "mobile_money" | "card"
      payment_status: "pending" | "paid" | "partial" | "overdue" | "cancelled"
      relationship_type: "father" | "mother" | "guardian" | "other"
      room_type: "classroom" | "lab" | "library" | "gym" | "office" | "other"
      scholarship_type: "none" | "partial" | "full"
      user_status: "active" | "inactive" | "suspended" | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      academic_system: ["semester", "trimester", "annual"],
      academic_year_status: ["upcoming", "active", "closed"],
      attendance_status: ["present", "absent", "late", "excused"],
      contract_type: ["permanent", "temporary", "part_time", "intern"],
      discipline_level: ["warning", "reprimand", "suspension", "exclusion"],
      establishment_plan: ["free", "starter", "professional", "enterprise"],
      establishment_status: ["active", "inactive", "suspended", "pending"],
      gender: ["male", "female", "other"],
      grade_type: ["test", "exam", "homework", "oral", "practical"],
      grading_system: ["20", "100", "letter"],
      owner_role: ["primary", "co-owner", "investor"],
      payment_method: ["cash", "transfer", "check", "mobile_money", "card"],
      payment_status: ["pending", "paid", "partial", "overdue", "cancelled"],
      relationship_type: ["father", "mother", "guardian", "other"],
      room_type: ["classroom", "lab", "library", "gym", "office", "other"],
      scholarship_type: ["none", "partial", "full"],
      user_status: ["active", "inactive", "suspended", "pending"],
    },
  },
} as const
