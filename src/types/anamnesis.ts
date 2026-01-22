// Anamnesis Report Types

export type AnamnesisSourceType = "audio" | "text" | "hybrid";
export type AnamnesisStatus = "draft" | "processing" | "review" | "approved";

export interface SocialHistory {
  occupation?: string;
  lifestyle?: string;
  physical_activity?: string;
  sleep_pattern?: string;
  stress_level?: string;
  alcohol_consumption?: string;
  smoking_status?: string;
}

export interface DietaryHistory {
  typical_day?: string;
  meal_frequency?: string;
  eating_out_frequency?: string;
  restrictions?: string[];
  allergies?: string[];
  intolerances?: string[];
  preferences?: string[];
  aversions?: string[];
  water_intake?: string;
  previous_diets?: string;
}

export interface AnamnesisReport {
  id: string;
  patient_id: string;
  nutri_id: string;

  // Structured content
  chief_complaint: string | null;
  history_present_illness: string | null;
  past_medical_history: string[];
  family_history: string[];
  social_history: SocialHistory;
  dietary_history: DietaryHistory;
  current_medications: string[];
  supplements: string[];
  goals: string[];
  observations: string | null;

  // AI metadata
  source_type: AnamnesisSourceType;
  original_transcript: string | null;
  audio_file_path: string | null;
  audio_duration_seconds: number | null;
  ai_model_used: string | null;
  confidence_score: number | null;

  // Workflow
  status: AnamnesisStatus;
  approved_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface AnamnesisReportInsert {
  id?: string;
  patient_id: string;
  nutri_id: string;

  chief_complaint?: string | null;
  history_present_illness?: string | null;
  past_medical_history?: string[];
  family_history?: string[];
  social_history?: SocialHistory;
  dietary_history?: DietaryHistory;
  current_medications?: string[];
  supplements?: string[];
  goals?: string[];
  observations?: string | null;

  source_type: AnamnesisSourceType;
  original_transcript?: string | null;
  audio_file_path?: string | null;
  audio_duration_seconds?: number | null;
  ai_model_used?: string | null;
  confidence_score?: number | null;

  status?: AnamnesisStatus;
}

export interface AnamnesisReportUpdate {
  chief_complaint?: string | null;
  history_present_illness?: string | null;
  past_medical_history?: string[];
  family_history?: string[];
  social_history?: SocialHistory;
  dietary_history?: DietaryHistory;
  current_medications?: string[];
  supplements?: string[];
  goals?: string[];
  observations?: string | null;
  status?: AnamnesisStatus;
  approved_at?: string | null;
}

// AI Processing Types

export interface ProcessedAnamnesisData {
  chief_complaint: string;
  history_present_illness: string;
  past_medical_history: string[];
  family_history: string[];
  social_history: SocialHistory;
  dietary_history: DietaryHistory;
  current_medications: string[];
  supplements: string[];
  goals: string[];
  observations: string;
}

export interface TranscriptionResult {
  text: string;
  duration_seconds: number;
  language: string;
}

export interface ProcessingResult {
  data: ProcessedAnamnesisData;
  confidence_score: number;
  model_used: string;
}

// UI State Types

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
}

export type ProcessingStep = "idle" | "uploading" | "transcribing" | "processing" | "complete" | "error";

export interface ProcessingState {
  step: ProcessingStep;
  progress: number;
  message: string;
  error?: string;
}
