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
      };
      patients: {
        Row: {
          id: string;
          nutri_id: string;
          birth_date: string | null;
          gender: string | null;
          goal: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nutri_id: string;
          birth_date?: string | null;
          gender?: string | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nutri_id?: string;
          birth_date?: string | null;
          gender?: string | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      food_items: {
        Row: {
          id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          source: "official" | "custom";
          creator_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          source: "official" | "custom";
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
          source?: "official" | "custom";
          creator_id?: string | null;
          created_at?: string;
        };
      };
      meal_plans: {
        Row: {
          id: string;
          patient_id: string;
          nutri_id: string;
          status: "active" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          nutri_id: string;
          status?: "active" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          nutri_id?: string;
          status?: "active" | "archived";
          created_at?: string;
          updated_at?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          meal_plan_id: string;
          time: string;
          title: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          time: string;
          title: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meal_plan_id?: string;
          time?: string;
          title?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      meal_contents: {
        Row: {
          id: string;
          meal_id: string;
          food_id: string;
          amount: number;
          is_substitution: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          food_id: string;
          amount: number;
          is_substitution?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          meal_id?: string;
          food_id?: string;
          amount?: number;
          is_substitution?: boolean;
          created_at?: string;
        };
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

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
