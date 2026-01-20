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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "nutri" | "patient";
      food_source: "official" | "custom";
      plan_status: "active" | "archived";
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
