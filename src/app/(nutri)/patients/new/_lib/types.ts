export interface WizardPatientData {
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  activity_level: string | null;
  goal: string | null;
  notes: string | null;
  nutri_id_override?: string;
}

export interface WizardAnamnesisData {
  chief_complaint: string | null;
  history_present_illness: string | null;
  current_medications: string[];
  allergies: string[];
  observations: string | null;
}

export interface WizardAnthropometryData {
  assessed_at: string;
  weight: number | null;
  height: number | null;
  // Skinfolds (mm)
  triceps_skinfold: number | null;
  subscapular_skinfold: number | null;
  suprailiac_skinfold: number | null;
  abdominal_skinfold: number | null;
  thigh_skinfold: number | null;
  chest_skinfold: number | null;
  midaxillary_skinfold: number | null;
  // Circumferences (cm)
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
  // Calculated
  bmi: number | null;
  body_fat_percentage: number | null;
  waist_hip_ratio: number | null;
  calculation_protocol: string | null;
  // Metadata
  notes: string | null;
}

export interface WizardMealPlanData {
  title: string | null;
  description: string | null;
  status: "active" | "archived";
  starts_at: string | null;
  ends_at: string | null;
}

export interface WizardAccumulatedData {
  patient?: WizardPatientData;
  anamnesis?: WizardAnamnesisData;
  anthropometry?: WizardAnthropometryData;
  mealPlan?: WizardMealPlanData;
}

export interface SaveWizardResult {
  success: boolean;
  patientId?: string;
  anamnesisId?: string;
  anthropometryId?: string;
  mealPlanId?: string;
  error?: {
    step: number;
    message: string;
  };
}
