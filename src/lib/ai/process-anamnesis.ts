import { getAnthropicClient } from "./anthropic";
import type {
  ProcessedAnamnesisData,
  ProcessingResult,
  SocialHistory,
  DietaryHistory,
} from "@/types/anamnesis";

const ANAMNESIS_PROMPT = `Você é um assistente especializado em nutrição clínica. Sua tarefa é analisar o texto de uma consulta nutricional e extrair informações estruturadas.

INSTRUÇÕES:
1. Extraia APENAS informações explicitamente mencionadas no texto
2. Use "Não informado" quando a informação não estiver presente
3. Mantenha linguagem profissional e técnica
4. Preserve termos médicos e nutricionais
5. Seja preciso e objetivo

FORMATO DE SAÍDA (JSON válido):
{
  "chief_complaint": "Queixa principal do paciente",
  "history_present_illness": "História da doença atual / motivo da consulta",
  "past_medical_history": ["Lista de condições médicas anteriores"],
  "family_history": ["Histórico familiar relevante"],
  "social_history": {
    "occupation": "Profissão",
    "lifestyle": "Estilo de vida geral",
    "physical_activity": "Nível e tipo de atividade física",
    "sleep_pattern": "Padrão de sono",
    "stress_level": "Nível de estresse percebido",
    "alcohol_consumption": "Consumo de álcool",
    "smoking_status": "Tabagismo"
  },
  "dietary_history": {
    "typical_day": "Descrição de um dia alimentar típico",
    "meal_frequency": "Frequência das refeições",
    "eating_out_frequency": "Frequência de refeições fora de casa",
    "restrictions": ["Restrições alimentares"],
    "allergies": ["Alergias alimentares"],
    "intolerances": ["Intolerâncias alimentares"],
    "preferences": ["Preferências alimentares"],
    "aversions": ["Aversões alimentares"],
    "water_intake": "Consumo de água",
    "previous_diets": "Dietas anteriores"
  },
  "current_medications": ["Lista de medicamentos em uso"],
  "supplements": ["Lista de suplementos em uso"],
  "goals": ["Objetivos do paciente"],
  "observations": "Observações adicionais relevantes"
}

TEXTO DA CONSULTA:
{transcript}

Responda APENAS com o JSON, sem texto adicional.`;

const MODEL_ID = "claude-sonnet-4-20250514";

export async function processAnamnesisText(
  transcript: string
): Promise<ProcessingResult> {
  const anthropic = getAnthropicClient();

  const prompt = ANAMNESIS_PROMPT.replace("{transcript}", transcript);

  const response = await anthropic.messages.create({
    model: MODEL_ID,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract the text content from the response
  const textContent = response.content.find((block) => block.type === "text");

  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI model");
  }

  // Parse the JSON response
  const jsonStr = textContent.text.trim();
  let parsedData: ProcessedAnamnesisData;

  try {
    // Try to extract JSON from the response (handle potential markdown code blocks)
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    parsedData = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${jsonStr.substring(0, 200)}...`);
  }

  // Validate and normalize the data
  const normalizedData = normalizeAnamnesisData(parsedData);

  // Calculate confidence score based on completeness
  const confidenceScore = calculateConfidenceScore(normalizedData, transcript);

  return {
    data: normalizedData,
    confidence_score: confidenceScore,
    model_used: MODEL_ID,
  };
}

function normalizeAnamnesisData(data: Partial<ProcessedAnamnesisData>): ProcessedAnamnesisData {
  return {
    chief_complaint: data.chief_complaint ?? "Não informado",
    history_present_illness: data.history_present_illness ?? "Não informado",
    past_medical_history: normalizeArray(data.past_medical_history),
    family_history: normalizeArray(data.family_history),
    social_history: normalizeSocialHistory(data.social_history),
    dietary_history: normalizeDietaryHistory(data.dietary_history),
    current_medications: normalizeArray(data.current_medications),
    supplements: normalizeArray(data.supplements),
    goals: normalizeArray(data.goals),
    observations: data.observations ?? "Não informado",
  };
}

function normalizeArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function normalizeSocialHistory(data: unknown): SocialHistory {
  const defaultValue = "Não informado";
  const social = data && typeof data === "object" ? (data as Partial<SocialHistory>) : {};

  return {
    occupation: social.occupation ?? defaultValue,
    lifestyle: social.lifestyle ?? defaultValue,
    physical_activity: social.physical_activity ?? defaultValue,
    sleep_pattern: social.sleep_pattern ?? defaultValue,
    stress_level: social.stress_level ?? defaultValue,
    alcohol_consumption: social.alcohol_consumption ?? defaultValue,
    smoking_status: social.smoking_status ?? defaultValue,
  };
}

function normalizeDietaryHistory(data: unknown): DietaryHistory {
  const defaultValue = "Não informado";
  const dietary = data && typeof data === "object" ? (data as Partial<DietaryHistory>) : {};

  return {
    typical_day: dietary.typical_day ?? defaultValue,
    meal_frequency: dietary.meal_frequency ?? defaultValue,
    eating_out_frequency: dietary.eating_out_frequency ?? defaultValue,
    restrictions: normalizeArray(dietary.restrictions),
    allergies: normalizeArray(dietary.allergies),
    intolerances: normalizeArray(dietary.intolerances),
    preferences: normalizeArray(dietary.preferences),
    aversions: normalizeArray(dietary.aversions),
    water_intake: dietary.water_intake ?? defaultValue,
    previous_diets: dietary.previous_diets ?? defaultValue,
  };
}

function calculateConfidenceScore(
  data: ProcessedAnamnesisData,
  originalTranscript: string
): number {
  let score = 0;
  let totalFields = 0;

  // Check main fields
  const mainFields = [
    data.chief_complaint,
    data.history_present_illness,
    data.observations,
  ];

  for (const field of mainFields) {
    totalFields++;
    if (field && field !== "Não informado" && field.length > 10) {
      score++;
    }
  }

  // Check arrays
  const arrayFields = [
    data.past_medical_history,
    data.family_history,
    data.current_medications,
    data.supplements,
    data.goals,
  ];

  for (const arr of arrayFields) {
    totalFields++;
    if (arr.length > 0) {
      score++;
    }
  }

  // Check social history
  const socialValues = Object.values(data.social_history);
  for (const val of socialValues) {
    totalFields++;
    if (val && val !== "Não informado") {
      score++;
    }
  }

  // Check dietary history
  const dietaryFields = [
    data.dietary_history.typical_day,
    data.dietary_history.meal_frequency,
    data.dietary_history.water_intake,
  ];

  for (const field of dietaryFields) {
    totalFields++;
    if (field && field !== "Não informado") {
      score++;
    }
  }

  // Bonus for transcript length (longer transcripts usually mean more information)
  const transcriptLengthBonus = Math.min(originalTranscript.length / 5000, 0.1);

  const baseScore = score / totalFields;
  const finalScore = Math.min(baseScore + transcriptLengthBonus, 1);

  return Math.round(finalScore * 100) / 100;
}
