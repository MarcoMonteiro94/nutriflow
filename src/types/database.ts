export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "nutri" | "patient";
          full_name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "nutri" | "patient";
          full_name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "nutri" | "patient";
          full_name?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      patients: {
        Row: {
          id: string;
          nutri_id: string;
          profile_id: string | null;
          user_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          birth_date: string | null;
          gender: string | null;
          goal: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nutri_id: string;
          profile_id?: string | null;
          user_id?: string | null;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          goal?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nutri_id?: string;
          profile_id?: string | null;
          user_id?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          goal?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patients_nutri_id_fkey";
            columns: ["nutri_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patients_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      food_items: {
        Row: {
          id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number | null;
          sodium: number | null;
          portion_size: number | null;
          portion_unit: string | null;
          category: string | null;
          source: "official" | "custom";
          creator_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number | null;
          sodium?: number | null;
          portion_size?: number | null;
          portion_unit?: string | null;
          category?: string | null;
          source?: "official" | "custom";
          creator_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number | null;
          sodium?: number | null;
          portion_size?: number | null;
          portion_unit?: string | null;
          category?: string | null;
          source?: "official" | "custom";
          creator_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_items_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      meal_plans: {
        Row: {
          id: string;
          patient_id: string;
          nutri_id: string;
          title: string | null;
          description: string | null;
          status: "active" | "archived";
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          nutri_id: string;
          title?: string | null;
          description?: string | null;
          status?: "active" | "archived";
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          nutri_id?: string;
          title?: string | null;
          description?: string | null;
          status?: "active" | "archived";
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plans_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_plans_nutri_id_fkey";
            columns: ["nutri_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      meals: {
        Row: {
          id: string;
          meal_plan_id: string;
          time: string;
          title: string;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          time: string;
          title: string;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          meal_plan_id?: string;
          time?: string;
          title?: string;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_id_fkey";
            columns: ["meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          }
        ];
      };
      meal_contents: {
        Row: {
          id: string;
          meal_id: string;
          food_id: string;
          amount: number;
          is_substitution: boolean;
          parent_content_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          food_id: string;
          amount: number;
          is_substitution?: boolean;
          parent_content_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meal_id?: string;
          food_id?: string;
          amount?: number;
          is_substitution?: boolean;
          parent_content_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_contents_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_contents_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_contents_parent_content_id_fkey";
            columns: ["parent_content_id"];
            isOneToOne: false;
            referencedRelation: "meal_contents";
            referencedColumns: ["id"];
          }
        ];
      };
      appointments: {
        Row: {
          id: string;
          nutri_id: string;
          patient_id: string;
          scheduled_at: string;
          duration_minutes: number;
          status: string;
          notes: string | null;
          rescheduled_from: string | null;
          rescheduled_at: string | null;
          rescheduled_reason: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nutri_id: string;
          patient_id: string;
          scheduled_at: string;
          duration_minutes?: number;
          status?: string;
          notes?: string | null;
          rescheduled_from?: string | null;
          rescheduled_at?: string | null;
          rescheduled_reason?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nutri_id?: string;
          patient_id?: string;
          scheduled_at?: string;
          duration_minutes?: number;
          status?: string;
          notes?: string | null;
          rescheduled_from?: string | null;
          rescheduled_at?: string | null;
          rescheduled_reason?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_nutri_id_fkey";
            columns: ["nutri_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey";
            columns: ["rescheduled_from"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          }
        ];
      };
      nutri_availability: {
        Row: {
          id: string;
          nutri_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nutri_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nutri_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nutri_availability_nutri_id_fkey";
            columns: ["nutri_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      nutri_time_blocks: {
        Row: {
          id: string;
          nutri_id: string;
          title: string;
          start_datetime: string;
          end_datetime: string;
          block_type: "personal" | "holiday" | "vacation" | "other";
          is_recurring: boolean;
          recurrence_rule: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nutri_id: string;
          title: string;
          start_datetime: string;
          end_datetime: string;
          block_type?: "personal" | "holiday" | "vacation" | "other";
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nutri_id?: string;
          title?: string;
          start_datetime?: string;
          end_datetime?: string;
          block_type?: "personal" | "holiday" | "vacation" | "other";
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nutri_time_blocks_nutri_id_fkey";
            columns: ["nutri_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      appointment_history: {
        Row: {
          id: string;
          appointment_id: string;
          action: "created" | "rescheduled" | "cancelled" | "completed" | "no_show";
          old_datetime: string | null;
          new_datetime: string | null;
          old_status: string | null;
          new_status: string | null;
          changed_by: string | null;
          reason: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          action: "created" | "rescheduled" | "cancelled" | "completed" | "no_show";
          old_datetime?: string | null;
          new_datetime?: string | null;
          old_status?: string | null;
          new_status?: string | null;
          changed_by?: string | null;
          reason?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          action?: "created" | "rescheduled" | "cancelled" | "completed" | "no_show";
          old_datetime?: string | null;
          new_datetime?: string | null;
          old_status?: string | null;
          new_status?: string | null;
          changed_by?: string | null;
          reason?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_history_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      measurements: {
        Row: {
          id: string;
          patient_id: string;
          measured_at: string;
          weight: number | null;
          height: number | null;
          body_fat_percentage: number | null;
          muscle_mass: number | null;
          waist_circumference: number | null;
          hip_circumference: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          measured_at?: string;
          weight?: number | null;
          height?: number | null;
          body_fat_percentage?: number | null;
          muscle_mass?: number | null;
          waist_circumference?: number | null;
          hip_circumference?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          measured_at?: string;
          weight?: number | null;
          height?: number | null;
          body_fat_percentage?: number | null;
          muscle_mass?: number | null;
          waist_circumference?: number | null;
          hip_circumference?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "measurements_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
      measurement_goals: {
        Row: {
          id: string;
          patient_id: string;
          metric_type: string;
          target_value: number;
          target_date: string | null;
          current_value: number | null;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          metric_type: string;
          target_value: number;
          target_date?: string | null;
          current_value?: number | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          metric_type?: string;
          target_value?: number;
          target_date?: string | null;
          current_value?: number | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "measurement_goals_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_measurement_types: {
        Row: {
          id: string;
          nutri_id: string;
          name: string;
          unit: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nutri_id: string;
          name: string;
          unit: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nutri_id?: string;
          name?: string;
          unit?: string;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_measurement_types_nutri_id_fkey";
            columns: ["nutri_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_measurement_values: {
        Row: {
          id: string;
          patient_id: string;
          type_id: string;
          value: number;
          measured_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          type_id: string;
          value: number;
          measured_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          type_id?: string;
          value?: number;
          measured_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_measurement_values_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "custom_measurement_values_type_id_fkey";
            columns: ["type_id"];
            isOneToOne: false;
            referencedRelation: "custom_measurement_types";
            referencedColumns: ["id"];
          }
        ];
      };
      measurement_photos: {
        Row: {
          id: string;
          patient_id: string;
          measurement_id: string | null;
          photo_url: string;
          view_type: string | null;
          notes: string | null;
          uploaded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          measurement_id?: string | null;
          photo_url: string;
          view_type?: string | null;
          notes?: string | null;
          uploaded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          measurement_id?: string | null;
          photo_url?: string;
          view_type?: string | null;
          notes?: string | null;
          uploaded_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "measurement_photos_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "measurement_photos_measurement_id_fkey";
            columns: ["measurement_id"];
            isOneToOne: false;
            referencedRelation: "anthropometry_assessments";
            referencedColumns: ["id"];
          }
        ];
      };
      patient_tokens: {
        Row: {
          id: string;
          patient_id: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patient_tokens_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
      anamnesis_reports: {
        Row: {
          id: string;
          patient_id: string;
          nutri_id: string;
          chief_complaint: string | null;
          history_present_illness: string | null;
          past_medical_history: string[];
          family_history: string[];
          social_history: Record<string, unknown>;
          dietary_history: Record<string, unknown>;
          current_medications: string[];
          supplements: string[];
          goals: string[];
          observations: string | null;
          source_type: "audio" | "text" | "hybrid";
          original_transcript: string | null;
          audio_file_path: string | null;
          audio_duration_seconds: number | null;
          ai_model_used: string | null;
          confidence_score: number | null;
          status: "draft" | "processing" | "review" | "approved";
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          nutri_id: string;
          chief_complaint?: string | null;
          history_present_illness?: string | null;
          past_medical_history?: string[];
          family_history?: string[];
          social_history?: Record<string, unknown>;
          dietary_history?: Record<string, unknown>;
          current_medications?: string[];
          supplements?: string[];
          goals?: string[];
          observations?: string | null;
          source_type: "audio" | "text" | "hybrid";
          original_transcript?: string | null;
          audio_file_path?: string | null;
          audio_duration_seconds?: number | null;
          ai_model_used?: string | null;
          confidence_score?: number | null;
          status?: "draft" | "processing" | "review" | "approved";
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          nutri_id?: string;
          chief_complaint?: string | null;
          history_present_illness?: string | null;
          past_medical_history?: string[];
          family_history?: string[];
          social_history?: Record<string, unknown>;
          dietary_history?: Record<string, unknown>;
          current_medications?: string[];
          supplements?: string[];
          goals?: string[];
          observations?: string | null;
          source_type?: "audio" | "text" | "hybrid";
          original_transcript?: string | null;
          audio_file_path?: string | null;
          audio_duration_seconds?: number | null;
          ai_model_used?: string | null;
          confidence_score?: number | null;
          status?: "draft" | "processing" | "review" | "approved";
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "anamnesis_reports_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "anamnesis_reports_nutri_id_fkey";
            columns: ["nutri_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          settings: Record<string, unknown>;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          settings?: Record<string, unknown>;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          settings?: Record<string, unknown>;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "admin" | "nutri" | "receptionist" | "patient";
          invited_by: string | null;
          invited_at: string | null;
          accepted_at: string | null;
          status: "pending" | "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "admin" | "nutri" | "receptionist" | "patient";
          invited_by?: string | null;
          invited_at?: string | null;
          accepted_at?: string | null;
          status?: "pending" | "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: "admin" | "nutri" | "receptionist" | "patient";
          invited_by?: string | null;
          invited_at?: string | null;
          accepted_at?: string | null;
          status?: "pending" | "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_invites: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: "admin" | "nutri" | "receptionist" | "patient";
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: "admin" | "nutri" | "receptionist" | "patient";
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: "admin" | "nutri" | "receptionist" | "patient";
          invited_by?: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_invites_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      anthropometry_assessments: {
        Row: {
          id: string;
          patient_id: string;
          assessed_at: string;
          // Basic measurements
          weight: number | null;
          height: number | null;
          // Skinfolds (dobras cutâneas) in mm
          triceps_skinfold: number | null;
          subscapular_skinfold: number | null;
          suprailiac_skinfold: number | null;
          abdominal_skinfold: number | null;
          thigh_skinfold: number | null;
          chest_skinfold: number | null;
          midaxillary_skinfold: number | null;
          // Circumferences (circunferências) in cm
          neck_circumference: number | null;
          chest_circumference: number | null;
          waist_circumference: number | null;
          abdomen_circumference: number | null;
          hip_circumference: number | null;
          right_arm_circumference: number | null;
          left_arm_circumference: number | null;
          right_forearm_circumference: number | null;
          left_forearm_circumference: number | null;
          right_thigh_circumference: number | null;
          left_thigh_circumference: number | null;
          right_calf_circumference: number | null;
          left_calf_circumference: number | null;
          // Calculated fields (stored for historical reference)
          bmi: number | null;
          body_fat_percentage: number | null;
          waist_hip_ratio: number | null;
          calculation_protocol: string | null;
          // Metadata
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          assessed_at?: string;
          // Basic measurements
          weight?: number | null;
          height?: number | null;
          // Skinfolds (dobras cutâneas) in mm
          triceps_skinfold?: number | null;
          subscapular_skinfold?: number | null;
          suprailiac_skinfold?: number | null;
          abdominal_skinfold?: number | null;
          thigh_skinfold?: number | null;
          chest_skinfold?: number | null;
          midaxillary_skinfold?: number | null;
          // Circumferences (circunferências) in cm
          neck_circumference?: number | null;
          chest_circumference?: number | null;
          waist_circumference?: number | null;
          abdomen_circumference?: number | null;
          hip_circumference?: number | null;
          right_arm_circumference?: number | null;
          left_arm_circumference?: number | null;
          right_forearm_circumference?: number | null;
          left_forearm_circumference?: number | null;
          right_thigh_circumference?: number | null;
          left_thigh_circumference?: number | null;
          right_calf_circumference?: number | null;
          left_calf_circumference?: number | null;
          // Calculated fields (stored for historical reference)
          bmi?: number | null;
          body_fat_percentage?: number | null;
          waist_hip_ratio?: number | null;
          calculation_protocol?: string | null;
          // Metadata
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          assessed_at?: string;
          // Basic measurements
          weight?: number | null;
          height?: number | null;
          // Skinfolds (dobras cutâneas) in mm
          triceps_skinfold?: number | null;
          subscapular_skinfold?: number | null;
          suprailiac_skinfold?: number | null;
          abdominal_skinfold?: number | null;
          thigh_skinfold?: number | null;
          chest_skinfold?: number | null;
          midaxillary_skinfold?: number | null;
          // Circumferences (circunferências) in cm
          neck_circumference?: number | null;
          chest_circumference?: number | null;
          waist_circumference?: number | null;
          abdomen_circumference?: number | null;
          hip_circumference?: number | null;
          right_arm_circumference?: number | null;
          left_arm_circumference?: number | null;
          right_forearm_circumference?: number | null;
          left_forearm_circumference?: number | null;
          right_thigh_circumference?: number | null;
          left_thigh_circumference?: number | null;
          right_calf_circumference?: number | null;
          left_calf_circumference?: number | null;
          // Calculated fields (stored for historical reference)
          bmi?: number | null;
          body_fat_percentage?: number | null;
          waist_hip_ratio?: number | null;
          calculation_protocol?: string | null;
          // Metadata
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "anthropometry_assessments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "nutri" | "patient";
      food_source: "official" | "custom";
      plan_status: "active" | "archived";
      block_type: "personal" | "holiday" | "vacation" | "other";
      appointment_action: "created" | "rescheduled" | "cancelled" | "completed" | "no_show";
      org_role: "admin" | "nutri" | "receptionist" | "patient";
      member_status: "pending" | "active" | "inactive";
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Commonly used table types
export type Profile = Tables<"profiles">;
export type Patient = Tables<"patients">;
export type FoodItem = Tables<"food_items">;
export type MealPlan = Tables<"meal_plans">;
export type Meal = Tables<"meals">;
export type MealContent = Tables<"meal_contents">;
export type Appointment = Tables<"appointments">;
export type Measurement = Tables<"measurements">;
export type PatientToken = Tables<"patient_tokens">;
export type NutriAvailability = Tables<"nutri_availability">;
export type NutriTimeBlock = Tables<"nutri_time_blocks">;
export type AppointmentHistory = Tables<"appointment_history">;
export type AnamnesisReportRow = Tables<"anamnesis_reports">;
export type AnthropometryAssessment = Tables<"anthropometry_assessments">;
export type MeasurementGoal = Tables<"measurement_goals">;
export type CustomMeasurementType = Tables<"custom_measurement_types">;
export type CustomMeasurementValue = Tables<"custom_measurement_values">;
export type MeasurementPhoto = Tables<"measurement_photos">;

// Enum types
export type BlockType = Database["public"]["Enums"]["block_type"];
export type AppointmentAction = Database["public"]["Enums"]["appointment_action"];
export type AnamnesisSourceType = "audio" | "text" | "hybrid";
export type AnamnesisStatus = "draft" | "processing" | "review" | "approved";

// Organization types
export type Organization = Tables<"organizations">;
export type OrganizationMember = Tables<"organization_members">;
export type OrganizationInvite = Tables<"organization_invites">;
export type OrgRole = Database["public"]["Enums"]["org_role"];
export type MemberStatus = Database["public"]["Enums"]["member_status"];
