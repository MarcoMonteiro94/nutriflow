import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Activity,
  ClipboardList,
  Ruler
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
      <div className="p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Conta não vinculada</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
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

  const measurementsList = measurements ?? [];
  const latestMeasurement = measurementsList[0];
  const weightTrend = getWeightTrend(measurementsList);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Meu Progresso</h1>
        <p className="text-muted-foreground">Acompanhe sua evolução ao longo do tempo.</p>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {latestMeasurement?.weight ? `${latestMeasurement.weight}kg` : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Peso atual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                {weightTrend?.trend === "down" ? (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                ) : weightTrend?.trend === "up" ? (
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                ) : (
                  <Minus className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {weightTrend ? `${weightTrend.diff}kg` : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Variação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Body Composition Summary */}
      {latestMeasurement && (latestMeasurement.body_fat_percentage || latestMeasurement.muscle_mass) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Composição Corporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {latestMeasurement.body_fat_percentage && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">% Gordura</p>
                  <p className="text-xl font-bold">{latestMeasurement.body_fat_percentage}%</p>
                </div>
              )}
              {latestMeasurement.muscle_mass && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Massa Muscular</p>
                  <p className="text-xl font-bold">{latestMeasurement.muscle_mass}kg</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Circumferences */}
      {latestMeasurement && (latestMeasurement.waist_circumference || latestMeasurement.hip_circumference) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              Medidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {latestMeasurement.waist_circumference && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Cintura</p>
                  <p className="text-xl font-bold">{latestMeasurement.waist_circumference}cm</p>
                </div>
              )}
              {latestMeasurement.hip_circumference && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Quadril</p>
                  <p className="text-xl font-bold">{latestMeasurement.hip_circumference}cm</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Measurements History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Medidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {measurementsList.length > 0 ? (
            <div className="space-y-3">
              {measurementsList.map((measurement) => (
                <div
                  key={measurement.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(measurement.measured_at), "dd/MM/yyyy", { locale: ptBR })}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {measurement.weight && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Peso: </span>
                          <span className="font-medium">{measurement.weight}kg</span>
                        </div>
                      )}
                      {measurement.body_fat_percentage && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Gordura: </span>
                          <span className="font-medium">{measurement.body_fat_percentage}%</span>
                        </div>
                      )}
                      {measurement.muscle_mass && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Músculo: </span>
                          <span className="font-medium">{measurement.muscle_mass}kg</span>
                        </div>
                      )}
                      {measurement.waist_circumference && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Cintura: </span>
                          <span className="font-medium">{measurement.waist_circumference}cm</span>
                        </div>
                      )}
                    </div>
                    {measurement.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{measurement.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Scale className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold">Nenhuma medida registrada</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Seu nutricionista irá registrar suas medidas durante as consultas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
