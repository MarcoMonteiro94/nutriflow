import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Activity,
  ClipboardList,
  Ruler,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Measurement } from "@/types/database";

function getWeightTrend(measurements: Measurement[]) {
  if (measurements.length < 2) return null;

  const recent = measurements[0];
  const previous = measurements[1];

  if (!recent.weight || !previous.weight) return null;

  const diff = Number(recent.weight) - Number(previous.weight);
  const percentage = ((diff / Number(previous.weight)) * 100).toFixed(1);

  return {
    diff: diff.toFixed(1),
    percentage,
    trend: diff > 0 ? "up" : diff < 0 ? "down" : "stable"
  };
}

function getTotalProgress(measurements: Measurement[]) {
  if (measurements.length < 2) return null;

  const oldest = measurements[measurements.length - 1];
  const newest = measurements[0];

  if (!oldest.weight || !newest.weight) return null;

  const diff = Number(newest.weight) - Number(oldest.weight);
  return {
    diff: diff.toFixed(1),
    count: measurements.length,
  };
}

export default async function PatientProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get patient record linked to this user
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, nutri_id")
    .eq("user_id", user.id)
    .single();

  if (!patient) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 lg:px-8">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <ClipboardList className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Conta não vinculada</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Sua conta ainda não está vinculada a um perfil de paciente.
              Entre em contato com seu nutricionista para vincular sua conta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get all measurements for this patient, ordered by date
  const { data: measurements } = await supabase
    .from("measurements")
    .select("*")
    .eq("patient_id", patient.id)
    .order("measured_at", { ascending: false });

  const measurementsList = (measurements ?? []) as Measurement[];
  const latestMeasurement = measurementsList[0];
  const weightTrend = getWeightTrend(measurementsList);
  const totalProgress = getTotalProgress(measurementsList);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm">Evolução</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
          Meu Progresso
        </h1>
        <p className="mt-1 text-muted-foreground">
          Acompanhe sua evolução ao longo do tempo.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Scale className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Peso Atual
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {latestMeasurement?.weight ? `${latestMeasurement.weight}kg` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {weightTrend?.trend === "down" ? (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                ) : weightTrend?.trend === "up" ? (
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                ) : (
                  <Minus className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Última Variação
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {weightTrend ? `${weightTrend.diff}kg` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  % Gordura
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {latestMeasurement?.body_fat_percentage
                    ? `${latestMeasurement.body_fat_percentage}%`
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Zap className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Massa Muscular
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {latestMeasurement?.muscle_mass
                    ? `${latestMeasurement.muscle_mass}kg`
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Body Composition */}
          {latestMeasurement && (
            latestMeasurement.waist_circumference ||
            latestMeasurement.hip_circumference
          ) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Ruler className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Medidas Corporais</CardTitle>
                    <CardDescription>Circunferências em centímetros</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Cintura", value: latestMeasurement.waist_circumference },
                    { label: "Quadril", value: latestMeasurement.hip_circumference },
                  ].filter(item => item.value).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl bg-muted/30 p-4"
                    >
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-lg font-bold tabular-nums">{item.value}cm</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Measurements History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Histórico de Medidas</CardTitle>
                  <CardDescription>
                    {measurementsList.length} registro{measurementsList.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {measurementsList.length > 0 ? (
                <div className="space-y-3">
                  {measurementsList.map((measurement, index) => (
                    <div
                      key={measurement.id}
                      className={`rounded-xl border p-4 transition-all ${
                        index === 0
                          ? "border-primary/20 bg-primary/5 ring-1 ring-primary/10"
                          : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                              {format(new Date(measurement.measured_at), "dd/MM/yyyy", { locale: ptBR })}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Mais recente
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {measurement.weight && (
                              <div className="flex items-center gap-1.5">
                                <Scale className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{measurement.weight}kg</span>
                              </div>
                            )}
                            {measurement.body_fat_percentage && (
                              <div className="flex items-center gap-1.5">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{measurement.body_fat_percentage}%</span>
                              </div>
                            )}
                            {measurement.muscle_mass && (
                              <div className="flex items-center gap-1.5">
                                <Zap className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{measurement.muscle_mass}kg</span>
                              </div>
                            )}
                            {measurement.waist_circumference && (
                              <div className="flex items-center gap-1.5">
                                <Ruler className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{measurement.waist_circumference}cm</span>
                              </div>
                            )}
                          </div>
                          {measurement.notes && (
                            <p className="text-sm text-muted-foreground">{measurement.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Scale className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold">Nenhuma medida registrada</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    Seu nutricionista irá registrar suas medidas durante as consultas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Total Progress */}
          {totalProgress && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium">Progresso Total</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-3xl font-bold tabular-nums">
                      {Number(totalProgress.diff) > 0 ? "+" : ""}{totalProgress.diff}kg
                    </p>
                    <p className="text-sm text-muted-foreground">
                      desde a primeira medição
                    </p>
                  </div>
                  <div className="h-px bg-border" />
                  <p className="text-sm text-muted-foreground">
                    Baseado em <strong>{totalProgress.count}</strong> medições
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest Measurement Date */}
          {latestMeasurement && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-medium">Última Medição</span>
                </div>
                <p className="text-lg font-semibold">
                  {format(new Date(latestMeasurement.measured_at), "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(latestMeasurement.measured_at), "yyyy", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Motivation Card */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="mb-3 text-3xl">🎯</div>
              <p className="font-medium">
                Consistência é a chave!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada medição é um passo na direção certa.
                Continue acompanhando seu progresso.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
