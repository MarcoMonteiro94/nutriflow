import { getAnthropicClient } from "./anthropic";
import type { AnamnesisReport } from "@/types/anamnesis";

export interface AnamnesisInsights {
  summary: string;
  attention_points: string[];
  dietary_patterns: string[];
  suggestions: string[];
  risk_factors: string[];
  analyzed_at: string;
  model_used: string;
}

const MODEL_ID = "claude-sonnet-4-20250514";

const ANALYSIS_PROMPT = `Você é um nutricionista clínico experiente analisando dados de uma anamnese nutricional.

Com base nos dados estruturados abaixo, gere uma análise inteligente para ajudar o nutricionista responsável.

DADOS DA ANAMNESE:
{data}

INSTRUÇÕES:
1. Gere um RESUMO EXECUTIVO conciso (2-3 frases) do caso
2. Liste PONTOS DE ATENÇÃO que o nutricionista deve considerar (condições médicas, medicamentos que afetam nutrição, etc.)
3. Identifique PADRÕES ALIMENTARES relevantes (positivos e negativos)
4. Faça SUGESTÕES práticas para a conduta nutricional
5. Liste FATORES DE RISCO nutricionais identificados

FORMATO DE SAÍDA (JSON válido):
{
  "summary": "Resumo executivo do caso em 2-3 frases",
  "attention_points": ["Ponto de atenção 1", "Ponto de atenção 2"],
  "dietary_patterns": ["Padrão identificado 1", "Padrão identificado 2"],
  "suggestions": ["Sugestão 1", "Sugestão 2"],
  "risk_factors": ["Fator de risco 1", "Fator de risco 2"]
}

REGRAS:
- Seja específico e baseado nos dados fornecidos
- Use linguagem técnica mas acessível
- Cada array deve ter entre 2 e 6 itens
- Se não houver dados suficientes para um campo, inclua ["Dados insuficientes para análise"]
- NÃO invente informações que não estejam nos dados

Responda APENAS com o JSON, sem texto adicional.`;

export async function analyzeAnamnesis(
  report: Pick<
    AnamnesisReport,
    | "chief_complaint"
    | "history_present_illness"
    | "past_medical_history"
    | "family_history"
    | "social_history"
    | "dietary_history"
    | "current_medications"
    | "supplements"
    | "goals"
    | "observations"
  >
): Promise<AnamnesisInsights> {
  const anthropic = getAnthropicClient();

  const dataStr = JSON.stringify(
    {
      queixa_principal: report.chief_complaint,
      historia_doenca_atual: report.history_present_illness,
      antecedentes_pessoais: report.past_medical_history,
      historico_familiar: report.family_history,
      historico_social: report.social_history,
      historico_alimentar: report.dietary_history,
      medicamentos: report.current_medications,
      suplementos: report.supplements,
      objetivos: report.goals,
      observacoes: report.observations,
    },
    null,
    2
  );

  const prompt = ANALYSIS_PROMPT.replace("{data}", dataStr);

  const response = await anthropic.messages.create({
    model: MODEL_ID,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI model");
  }

  const jsonMatch = textContent.text.trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    summary: parsed.summary || "Análise não disponível",
    attention_points: normalizeArray(parsed.attention_points),
    dietary_patterns: normalizeArray(parsed.dietary_patterns),
    suggestions: normalizeArray(parsed.suggestions),
    risk_factors: normalizeArray(parsed.risk_factors),
    analyzed_at: new Date().toISOString(),
    model_used: MODEL_ID,
  };
}

function normalizeArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return ["Dados insuficientes para análise"];
  return arr.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}
