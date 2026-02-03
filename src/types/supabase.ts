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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anamnesis_reports: {
        Row: {
          ai_model_used: string | null
          approved_at: string | null
          audio_duration_seconds: number | null
          audio_file_path: string | null
          chief_complaint: string | null
          confidence_score: number | null
          created_at: string
          current_medications: Json | null
          dietary_history: Json | null
          family_history: Json | null
          goals: Json | null
          history_present_illness: string | null
          id: string
          nutri_id: string
          observations: string | null
          original_transcript: string | null
          past_medical_history: Json | null
          patient_id: string
          social_history: Json | null
          source_type: string
          status: string
          supplements: Json | null
          updated_at: string
        }
        Insert: {
          ai_model_used?: string | null
          approved_at?: string | null
          audio_duration_seconds?: number | null
          audio_file_path?: string | null
          chief_complaint?: string | null
          confidence_score?: number | null
          created_at?: string
          current_medications?: Json | null
          dietary_history?: Json | null
          family_history?: Json | null
          goals?: Json | null
          history_present_illness?: string | null
          id?: string
          nutri_id: string
          observations?: string | null
          original_transcript?: string | null
          past_medical_history?: Json | null
          patient_id: string
          social_history?: Json | null
          source_type: string
          status?: string
          supplements?: Json | null
          updated_at?: string
        }
        Update: {
          ai_model_used?: string | null
          approved_at?: string | null
          audio_duration_seconds?: number | null
          audio_file_path?: string | null
          chief_complaint?: string | null
          confidence_score?: number | null
          created_at?: string
          current_medications?: Json | null
          dietary_history?: Json | null
          family_history?: Json | null
          goals?: Json | null
          history_present_illness?: string | null
          id?: string
          nutri_id?: string
          observations?: string | null
          original_transcript?: string | null
          past_medical_history?: Json | null
          patient_id?: string
          social_history?: Json | null
          source_type?: string
          status?: string
          supplements?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_reports_nutri_id_fkey"
            columns: ["nutri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      anthropometry_assessments: {
        Row: {
          abdomen_circumference: number | null
          abdominal_skinfold: number | null
          assessed_at: string
          bmi: number | null
          body_fat_percentage: number | null
          calculation_protocol: string | null
          chest_circumference: number | null
          chest_skinfold: number | null
          created_at: string
          height: number | null
          hip_circumference: number | null
          id: string
          left_arm_circumference: number | null
          left_calf_circumference: number | null
          left_forearm_circumference: number | null
          left_thigh_circumference: number | null
          midaxillary_skinfold: number | null
          neck_circumference: number | null
          notes: string | null
          patient_id: string
          right_arm_circumference: number | null
          right_calf_circumference: number | null
          right_forearm_circumference: number | null
          right_thigh_circumference: number | null
          subscapular_skinfold: number | null
          suprailiac_skinfold: number | null
          thigh_skinfold: number | null
          triceps_skinfold: number | null
          waist_circumference: number | null
          waist_hip_ratio: number | null
          weight: number | null
        }
        Insert: {
          abdomen_circumference?: number | null
          abdominal_skinfold?: number | null
          assessed_at?: string
          bmi?: number | null
          body_fat_percentage?: number | null
          calculation_protocol?: string | null
          chest_circumference?: number | null
          chest_skinfold?: number | null
          created_at?: string
          height?: number | null
          hip_circumference?: number | null
          id?: string
          left_arm_circumference?: number | null
          left_calf_circumference?: number | null
          left_forearm_circumference?: number | null
          left_thigh_circumference?: number | null
          midaxillary_skinfold?: number | null
          neck_circumference?: number | null
          notes?: string | null
          patient_id: string
          right_arm_circumference?: number | null
          right_calf_circumference?: number | null
          right_forearm_circumference?: number | null
          right_thigh_circumference?: number | null
          subscapular_skinfold?: number | null
          suprailiac_skinfold?: number | null
          thigh_skinfold?: number | null
          triceps_skinfold?: number | null
          waist_circumference?: number | null
          waist_hip_ratio?: number | null
          weight?: number | null
        }
        Update: {
          abdomen_circumference?: number | null
          abdominal_skinfold?: number | null
          assessed_at?: string
          bmi?: number | null
          body_fat_percentage?: number | null
          calculation_protocol?: string | null
          chest_circumference?: number | null
          chest_skinfold?: number | null
          created_at?: string
          height?: number | null
          hip_circumference?: number | null
          id?: string
          left_arm_circumference?: number | null
          left_calf_circumference?: number | null
          left_forearm_circumference?: number | null
          left_thigh_circumference?: number | null
          midaxillary_skinfold?: number | null
          neck_circumference?: number | null
          notes?: string | null
          patient_id?: string
          right_arm_circumference?: number | null
          right_calf_circumference?: number | null
          right_forearm_circumference?: number | null
          right_thigh_circumference?: number | null
          subscapular_skinfold?: number | null
          suprailiac_skinfold?: number | null
          thigh_skinfold?: number | null
          triceps_skinfold?: number | null
          waist_circumference?: number | null
          waist_hip_ratio?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anthropometry_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_history: {
        Row: {
          action: Database["public"]["Enums"]["appointment_action"]
          appointment_id: string
          changed_by: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_datetime: string | null
          new_status: string | null
          old_datetime: string | null
          old_status: string | null
          reason: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["appointment_action"]
          appointment_id: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_datetime?: string | null
          new_status?: string | null
          old_datetime?: string | null
          old_status?: string | null
          reason?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["appointment_action"]
          appointment_id?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_datetime?: string | null
          new_status?: string | null
          old_datetime?: string | null
          old_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          nutri_id: string
          organization_id: string | null
          patient_id: string
          rescheduled_at: string | null
          rescheduled_from: string | null
          rescheduled_reason: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          nutri_id: string
          organization_id?: string | null
          patient_id: string
          rescheduled_at?: string | null
          rescheduled_from?: string | null
          rescheduled_reason?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          nutri_id?: string
          organization_id?: string | null
          patient_id?: string
          rescheduled_at?: string | null
          rescheduled_from?: string | null
          rescheduled_reason?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_nutri_id_fkey"
            columns: ["nutri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_checkins: {
        Row: {
          checkin_date: string
          completed: boolean | null
          created_at: string | null
          id: string
          notes: string | null
          participant_id: string
        }
        Insert: {
          checkin_date: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          participant_id: string
        }
        Update: {
          checkin_date?: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_checkins_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "challenge_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_goals: {
        Row: {
          challenge_id: string
          created_at: string | null
          description: string | null
          duration_days: number
          id: string
          metric_type: string | null
          order_index: number
          phase_id: string | null
          settings: Json | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          metric_type?: string | null
          order_index?: number
          phase_id?: string | null
          settings?: Json | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          metric_type?: string | null
          order_index?: number
          phase_id?: string | null
          settings?: Json | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_goals_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_goals_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "challenge_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          badge_earned: boolean | null
          best_streak: number | null
          challenge_id: string
          completed_at: string | null
          current_goal_id: string | null
          current_phase_id: string | null
          id: string
          joined_at: string | null
          patient_id: string
          streak_count: number | null
        }
        Insert: {
          badge_earned?: boolean | null
          best_streak?: number | null
          challenge_id: string
          completed_at?: string | null
          current_goal_id?: string | null
          current_phase_id?: string | null
          id?: string
          joined_at?: string | null
          patient_id: string
          streak_count?: number | null
        }
        Update: {
          badge_earned?: boolean | null
          best_streak?: number | null
          challenge_id?: string
          completed_at?: string | null
          current_goal_id?: string | null
          current_phase_id?: string | null
          id?: string
          joined_at?: string | null
          patient_id?: string
          streak_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_current_goal_id_fkey"
            columns: ["current_goal_id"]
            isOneToOne: false
            referencedRelation: "challenge_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "challenge_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_phases: {
        Row: {
          challenge_id: string
          completion_threshold: number
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          challenge_id: string
          completion_threshold?: number
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          challenge_id?: string
          completion_threshold?: number
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_phases_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          nutri_id: string
          org_id: string | null
          settings: Json | null
          start_date: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          nutri_id: string
          org_id?: string | null
          settings?: Json | null
          start_date: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          nutri_id?: string
          org_id?: string | null
          settings?: Json | null
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_nutri_id_fkey"
            columns: ["nutri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          calories: number
          carbs: number
          category: string | null
          created_at: string
          creator_id: string | null
          fat: number
          fiber: number | null
          id: string
          name: string
          portion_size: number | null
          portion_unit: string | null
          protein: number
          sodium: number | null
          source: Database["public"]["Enums"]["food_source"]
        }
        Insert: {
          calories?: number
          carbs?: number
          category?: string | null
          created_at?: string
          creator_id?: string | null
          fat?: number
          fiber?: number | null
          id?: string
          name: string
          portion_size?: number | null
          portion_unit?: string | null
          protein?: number
          sodium?: number | null
          source?: Database["public"]["Enums"]["food_source"]
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string | null
          created_at?: string
          creator_id?: string | null
          fat?: number
          fiber?: number | null
          id?: string
          name?: string
          portion_size?: number | null
          portion_unit?: string | null
          protein?: number
          sodium?: number | null
          source?: Database["public"]["Enums"]["food_source"]
        }
        Relationships: [
          {
            foreignKeyName: "food_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_checkins: {
        Row: {
          checkin_date: string
          completed: boolean | null
          created_at: string | null
          goal_id: string
          id: string
          image_url: string | null
          metric_value: number | null
          notes: string | null
          participant_id: string
        }
        Insert: {
          checkin_date: string
          completed?: boolean | null
          created_at?: string | null
          goal_id: string
          id?: string
          image_url?: string | null
          metric_value?: number | null
          notes?: string | null
          participant_id: string
        }
        Update: {
          checkin_date?: string
          completed?: boolean | null
          created_at?: string | null
          goal_id?: string
          id?: string
          image_url?: string | null
          metric_value?: number | null
          notes?: string | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_checkins_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "challenge_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_checkins_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "challenge_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_contents: {
        Row: {
          amount: number
          created_at: string
          food_id: string
          id: string
          is_substitution: boolean
          meal_id: string
          parent_content_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          food_id: string
          id?: string
          is_substitution?: boolean
          meal_id: string
          parent_content_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          food_id?: string
          id?: string
          is_substitution?: boolean
          meal_id?: string
          parent_content_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_contents_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_contents_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_contents_parent_content_id_fkey"
            columns: ["parent_content_id"]
            isOneToOne: false
            referencedRelation: "meal_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          nutri_id: string
          patient_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["plan_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          nutri_id: string
          patient_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          nutri_id?: string
          patient_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_nutri_id_fkey"
            columns: ["nutri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          id: string
          meal_plan_id: string
          notes: string | null
          sort_order: number
          time: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_plan_id: string
          notes?: string | null
          sort_order?: number
          time: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_plan_id?: string
          notes?: string | null
          sort_order?: number
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          body_fat_percentage: number | null
          created_at: string
          height: number | null
          hip_circumference: number | null
          id: string
          measured_at: string
          muscle_mass: number | null
          notes: string | null
          patient_id: string
          waist_circumference: number | null
          weight: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string
          height?: number | null
          hip_circumference?: number | null
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          notes?: string | null
          patient_id: string
          waist_circumference?: number | null
          weight?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string
          height?: number | null
          hip_circumference?: number | null
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          notes?: string | null
          patient_id?: string
          waist_circumference?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      nutri_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          nutri_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          nutri_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          nutri_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nutri_time_blocks: {
        Row: {
          block_type: Database["public"]["Enums"]["block_type"] | null
          created_at: string | null
          end_datetime: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          nutri_id: string
          recurrence_rule: string | null
          start_datetime: string
          title: string
          updated_at: string | null
        }
        Insert: {
          block_type?: Database["public"]["Enums"]["block_type"] | null
          created_at?: string | null
          end_datetime: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          nutri_id: string
          recurrence_rule?: string | null
          start_datetime: string
          title: string
          updated_at?: string | null
        }
        Update: {
          block_type?: Database["public"]["Enums"]["block_type"] | null
          created_at?: string | null
          end_datetime?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          nutri_id?: string
          recurrence_rule?: string | null
          start_datetime?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          role?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_achievements: {
        Row: {
          achievement_type: string
          created_at: string | null
          earned_at: string | null
          goal_id: string | null
          id: string
          participant_id: string
          phase_id: string | null
        }
        Insert: {
          achievement_type: string
          created_at?: string | null
          earned_at?: string | null
          goal_id?: string | null
          id?: string
          participant_id: string
          phase_id?: string | null
        }
        Update: {
          achievement_type?: string
          created_at?: string | null
          earned_at?: string | null
          goal_id?: string | null
          id?: string
          participant_id?: string
          phase_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_achievements_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "challenge_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_achievements_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "challenge_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_achievements_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "challenge_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          patient_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          patient_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          patient_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          goal: string | null
          id: string
          notes: string | null
          nutri_id: string
          phone: string | null
          profile_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          gender?: string | null
          goal?: string | null
          id?: string
          notes?: string | null
          nutri_id: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          goal?: string | null
          id?: string
          notes?: string | null
          nutri_id?: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_nutri_id_fkey"
            columns: ["nutri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_nutri_challenge_ids: {
        Args: { nutri_uuid: string }
        Returns: string[]
      }
      get_org_nutri_ids: { Args: never; Returns: string[] }
      get_org_patient_user_ids: { Args: never; Returns: string[] }
      get_patient_plan_by_token: { Args: { p_token: string }; Returns: Json }
      get_user_admin_org_ids: { Args: never; Returns: string[] }
      get_user_org_ids: { Args: never; Returns: string[] }
      get_user_organizations: {
        Args: never
        Returns: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_patient_ids: { Args: { user_uuid: string }; Returns: string[] }
      get_user_receptionist_org_ids: { Args: never; Returns: string[] }
      get_user_role_in_org: { Args: { org_id: string }; Returns: string }
      is_nutri_in_my_org: {
        Args: { target_nutri_id: string }
        Returns: boolean
      }
      is_nutritionist: { Args: { user_id: string }; Returns: boolean }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_org_owner: { Args: { org_id: string }; Returns: boolean }
      is_patient: {
        Args: { patient_uuid: string; user_id: string }
        Returns: boolean
      }
      is_patient_user: {
        Args: { patient_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_receptionist: { Args: never; Returns: boolean }
      nutri_owns_participation: {
        Args: { nutri_uuid: string; participant_uuid: string }
        Returns: boolean
      }
      owns_patient: {
        Args: { patient_uuid: string; user_id: string }
        Returns: boolean
      }
      user_owns_participation: {
        Args: { participant_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_participates_in_challenge: {
        Args: { challenge_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      appointment_action:
        | "created"
        | "rescheduled"
        | "cancelled"
        | "completed"
        | "no_show"
      block_type: "personal" | "holiday" | "vacation" | "other"
      food_source: "official" | "custom"
      plan_status: "active" | "archived"
      user_role: "nutri" | "patient"
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
      appointment_action: [
        "created",
        "rescheduled",
        "cancelled",
        "completed",
        "no_show",
      ],
      block_type: ["personal", "holiday", "vacation", "other"],
      food_source: ["official", "custom"],
      plan_status: ["active", "archived"],
      user_role: ["nutri", "patient"],
    },
  },
} as const
