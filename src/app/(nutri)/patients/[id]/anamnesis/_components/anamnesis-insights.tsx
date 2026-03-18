"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import type { AnamnesisInsights } from "@/lib/ai/analyze-anamnesis";

interface AnamnesisInsightsProps {
  reportId: string;
  initialInsights: AnamnesisInsights | null;
}

export function AnamnesisInsightsPanel({
  reportId,
  initialInsights,
}: AnamnesisInsightsProps) {
  const [insights, setInsights] = useState<AnamnesisInsights | null>(initialInsights);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/anamnesis/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (!response.ok) {
        throw new Error("Falha na análise");
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch {
      setError("Erro ao gerar análise. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (!insights) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Análise com IA</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            Gere insights automáticos sobre esta anamnese: pontos de atenção,
            padrões alimentares e sugestões de conduta.
          </p>
          {error && (
            <p className="text-sm text-destructive mb-3">{error}</p>
          )}
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Análise
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Análise com IA
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {insights.model_used}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              title="Regenerar análise"
            >
              {isAnalyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Summary */}
        <div className="rounded-lg bg-primary/5 p-4">
          <p className="text-sm font-medium text-primary mb-1">Resumo</p>
          <p className="text-sm">{insights.summary}</p>
        </div>

        {/* Attention Points */}
        <InsightSection
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          title="Pontos de Atenção"
          items={insights.attention_points}
        />

        {/* Dietary Patterns */}
        <InsightSection
          icon={<TrendingUp className="h-4 w-4 text-sky-500" />}
          title="Padrões Alimentares"
          items={insights.dietary_patterns}
        />

        {/* Suggestions */}
        <InsightSection
          icon={<Lightbulb className="h-4 w-4 text-emerald-500" />}
          title="Sugestões de Conduta"
          items={insights.suggestions}
        />

        {/* Risk Factors */}
        <InsightSection
          icon={<ShieldAlert className="h-4 w-4 text-rose-500" />}
          title="Fatores de Risco"
          items={insights.risk_factors}
        />
      </CardContent>
    </Card>
  );
}

function InsightSection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  if (!items.length || (items.length === 1 && items[0] === "Dados insuficientes para análise")) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm font-medium">{title}</p>
      </div>
      <ul className="space-y-1.5 pl-6">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
