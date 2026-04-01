"use server";

import { createClient } from "@/lib/supabase/server";
import type { WizardAccumulatedData, SaveWizardResult } from "./types";

export async function saveOnboardingWizard(
  data: WizardAccumulatedData,
  existingPatientId?: string
): Promise<SaveWizardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { step: 1, message: "Não autenticado." } };
  }

  if (!data.patient) {
    return {
      success: false,
      error: { step: 1, message: "Dados do paciente são obrigatórios." },
    };
  }

  // Step 1: Insert patient (or reuse existing on retry)
  let patientId = existingPatientId;

  if (!patientId) {
    const nutriId = data.patient.nutri_id_override || user.id;

    const { data: patient, error: patientErr } = await supabase
      .from("patients")
      .insert({
        full_name: data.patient.full_name,
        email: data.patient.email,
        phone: data.patient.phone,
        birth_date: data.patient.birth_date,
        gender: data.patient.gender,
        activity_level: data.patient.activity_level,
        goal: data.patient.goal,
        notes: data.patient.notes,
        nutri_id: nutriId,
      })
      .select("id")
      .single();

    if (patientErr || !patient) {
      const msg =
        patientErr?.code === "23505"
          ? "Já existe um paciente com este email."
          : (patientErr?.message ?? "Erro ao criar paciente.");
      return { success: false, error: { step: 1, message: msg } };
    }

    patientId = patient.id;
  }

  let anamnesisId: string | undefined;
  let anthropometryId: string | undefined;
  let mealPlanId: string | undefined;

  // Step 2: Insert anamnesis (optional)
  if (data.anamnesis) {
    const { data: anamnesis, error: anamnesisErr } = await supabase
      .from("anamnesis_reports")
      .insert({
        patient_id: patientId,
        nutri_id: user.id,
        source_type: "text" as const,
        status: "approved" as const,
        chief_complaint: data.anamnesis.chief_complaint,
        history_present_illness: data.anamnesis.history_present_illness,
        current_medications: data.anamnesis.current_medications,
        dietary_history:
          data.anamnesis.allergies.length > 0
            ? { allergies: data.anamnesis.allergies }
            : {},
        observations: data.anamnesis.observations,
      })
      .select("id")
      .single();

    if (anamnesisErr) {
      return {
        success: false,
        patientId,
        error: { step: 2, message: "Erro ao salvar anamnese." },
      };
    }
    anamnesisId = anamnesis?.id;
  }

  // Step 3: Insert anthropometry (optional)
  if (data.anthropometry) {
    const { data: assessment, error: anthroErr } = await supabase
      .from("anthropometry_assessments")
      .insert({
        patient_id: patientId,
        assessed_at: data.anthropometry.assessed_at,
        weight: data.anthropometry.weight,
        height: data.anthropometry.height,
        triceps_skinfold: data.anthropometry.triceps_skinfold,
        subscapular_skinfold: data.anthropometry.subscapular_skinfold,
        suprailiac_skinfold: data.anthropometry.suprailiac_skinfold,
        abdominal_skinfold: data.anthropometry.abdominal_skinfold,
        thigh_skinfold: data.anthropometry.thigh_skinfold,
        chest_skinfold: data.anthropometry.chest_skinfold,
        midaxillary_skinfold: data.anthropometry.midaxillary_skinfold,
        neck_circumference: data.anthropometry.neck_circumference,
        chest_circumference: data.anthropometry.chest_circumference,
        waist_circumference: data.anthropometry.waist_circumference,
        abdomen_circumference: data.anthropometry.abdomen_circumference,
        hip_circumference: data.anthropometry.hip_circumference,
        right_arm_circumference: data.anthropometry.right_arm_circumference,
        left_arm_circumference: data.anthropometry.left_arm_circumference,
        right_forearm_circumference:
          data.anthropometry.right_forearm_circumference,
        left_forearm_circumference:
          data.anthropometry.left_forearm_circumference,
        right_thigh_circumference:
          data.anthropometry.right_thigh_circumference,
        left_thigh_circumference: data.anthropometry.left_thigh_circumference,
        right_calf_circumference: data.anthropometry.right_calf_circumference,
        left_calf_circumference: data.anthropometry.left_calf_circumference,
        bmi: data.anthropometry.bmi,
        body_fat_percentage: data.anthropometry.body_fat_percentage,
        waist_hip_ratio: data.anthropometry.waist_hip_ratio,
        calculation_protocol: data.anthropometry.calculation_protocol,
        notes: data.anthropometry.notes,
      })
      .select("id")
      .single();

    if (anthroErr) {
      return {
        success: false,
        patientId,
        anamnesisId,
        error: { step: 3, message: "Erro ao salvar antropometria." },
      };
    }
    anthropometryId = assessment?.id;
  }

  // Step 4: Insert meal plan (optional)
  if (data.mealPlan) {
    const { data: plan, error: planErr } = await supabase
      .from("meal_plans")
      .insert({
        patient_id: patientId,
        nutri_id: user.id,
        title: data.mealPlan.title,
        description: data.mealPlan.description,
        status: data.mealPlan.status,
        starts_at: data.mealPlan.starts_at,
        ends_at: data.mealPlan.ends_at,
      })
      .select("id")
      .single();

    if (planErr) {
      return {
        success: false,
        patientId,
        anamnesisId,
        anthropometryId,
        error: { step: 4, message: "Erro ao salvar plano alimentar." },
      };
    }
    mealPlanId = plan?.id;
  }

  return {
    success: true,
    patientId,
    anamnesisId,
    anthropometryId,
    mealPlanId,
  };
}
