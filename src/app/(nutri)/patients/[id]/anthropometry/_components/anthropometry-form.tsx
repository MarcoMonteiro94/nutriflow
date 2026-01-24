"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CalendarIcon, Loader2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  calculateBMI,
  getBMIClassification,
  calculateBodyFat,
  getBodyFatClassification,
  calculateWaistHipRatio,
  getWHRClassification,
  calculateSkinfoldSum,
} from "@/lib/anthropometry-calculations";
import type { AnthropometryAssessment, Patient } from "@/types/database";

interface AnthropometryFormProps {
  patientId: string;
  patient: Pick<Patient, "gender" | "birth_date">;
  assessmentId?: string;
  initialData?: Partial<AnthropometryAssessment>;
}

export function AnthropometryForm({
  patientId,
  patient,
  assessmentId,
  initialData,
}: AnthropometryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section open states
  const [basicOpen, setBasicOpen] = useState(true);
  const [skinfoldsOpen, setSkinfoldsOpen] = useState(true);
  const [circumferencesOpen, setCircumferencesOpen] = useState(true);

  // Date
  const [date, setDate] = useState<Date | undefined>(
    initialData?.assessed_at ? new Date(initialData.assessed_at) : new Date()
  );

  // Basic measurements
  const [weight, setWeight] = useState(initialData?.weight?.toString() || "");
  const [height, setHeight] = useState(initialData?.height?.toString() || "");

  // Skinfolds (mm)
  const [tricepsSkinfold, setTricepsSkinfold] = useState(
    initialData?.triceps_skinfold?.toString() || ""
  );
  const [subscapularSkinfold, setSubscapularSkinfold] = useState(
    initialData?.subscapular_skinfold?.toString() || ""
  );
  const [suprailiacSkinfold, setSuprailiacSkinfold] = useState(
    initialData?.suprailiac_skinfold?.toString() || ""
  );
  const [abdominalSkinfold, setAbdominalSkinfold] = useState(
    initialData?.abdominal_skinfold?.toString() || ""
  );
  const [thighSkinfold, setThighSkinfold] = useState(
    initialData?.thigh_skinfold?.toString() || ""
  );
  const [chestSkinfold, setChestSkinfold] = useState(
    initialData?.chest_skinfold?.toString() || ""
  );
  const [midaxillarySkinfold, setMidaxillarySkinfold] = useState(
    initialData?.midaxillary_skinfold?.toString() || ""
  );

  // Circumferences (cm)
  const [neckCircumference, setNeckCircumference] = useState(
    initialData?.neck_circumference?.toString() || ""
  );
  const [chestCircumference, setChestCircumference] = useState(
    initialData?.chest_circumference?.toString() || ""
  );
  const [waistCircumference, setWaistCircumference] = useState(
    initialData?.waist_circumference?.toString() || ""
  );
  const [abdomenCircumference, setAbdomenCircumference] = useState(
    initialData?.abdomen_circumference?.toString() || ""
  );
  const [hipCircumference, setHipCircumference] = useState(
    initialData?.hip_circumference?.toString() || ""
  );
  const [rightArmCircumference, setRightArmCircumference] = useState(
    initialData?.right_arm_circumference?.toString() || ""
  );
  const [leftArmCircumference, setLeftArmCircumference] = useState(
    initialData?.left_arm_circumference?.toString() || ""
  );
  const [rightForearmCircumference, setRightForearmCircumference] = useState(
    initialData?.right_forearm_circumference?.toString() || ""
  );
  const [leftForearmCircumference, setLeftForearmCircumference] = useState(
    initialData?.left_forearm_circumference?.toString() || ""
  );
  const [rightThighCircumference, setRightThighCircumference] = useState(
    initialData?.right_thigh_circumference?.toString() || ""
  );
  const [leftThighCircumference, setLeftThighCircumference] = useState(
    initialData?.left_thigh_circumference?.toString() || ""
  );
  const [rightCalfCircumference, setRightCalfCircumference] = useState(
    initialData?.right_calf_circumference?.toString() || ""
  );
  const [leftCalfCircumference, setLeftCalfCircumference] = useState(
    initialData?.left_calf_circumference?.toString() || ""
  );

  // Notes
  const [notes, setNotes] = useState(initialData?.notes || "");

  const isEditing = !!assessmentId;

  // Calculate patient age
  const patientAge = useMemo(() => {
    if (!patient.birth_date) return null;
    const birthDate = new Date(patient.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }, [patient.birth_date]);

  // Map gender to sex for calculations
  const patientSex = useMemo((): "male" | "female" | null => {
    if (!patient.gender) return null;
    const genderLower = patient.gender.toLowerCase();
    if (genderLower === "masculino" || genderLower === "male" || genderLower === "m") {
      return "male";
    }
    if (genderLower === "feminino" || genderLower === "female" || genderLower === "f") {
      return "female";
    }
    return null;
  }, [patient.gender]);

  // Auto-calculated metrics
  const calculatedMetrics = useMemo(() => {
    const weightNum = weight ? parseFloat(weight) : null;
    const heightNum = height ? parseFloat(height) : null;
    const waistNum = waistCircumference ? parseFloat(waistCircumference) : null;
    const hipNum = hipCircumference ? parseFloat(hipCircumference) : null;

    const bmi = calculateBMI(weightNum, heightNum);
    const whr = calculateWaistHipRatio(waistNum, hipNum);

    const skinfolds = {
      triceps: tricepsSkinfold ? parseFloat(tricepsSkinfold) : null,
      suprailiac: suprailiacSkinfold ? parseFloat(suprailiacSkinfold) : null,
      chest: chestSkinfold ? parseFloat(chestSkinfold) : null,
      abdominal: abdominalSkinfold ? parseFloat(abdominalSkinfold) : null,
      thigh: thighSkinfold ? parseFloat(thighSkinfold) : null,
      subscapular: subscapularSkinfold ? parseFloat(subscapularSkinfold) : null,
      midaxillary: midaxillarySkinfold ? parseFloat(midaxillarySkinfold) : null,
    };

    const bodyFat = calculateBodyFat(patientSex, skinfolds, patientAge);
    const skinfoldSum = calculateSkinfoldSum(skinfolds);

    return {
      bmi,
      bmiClassification: getBMIClassification(bmi),
      bodyFat,
      bodyFatClassification: getBodyFatClassification(bodyFat, patientSex),
      whr,
      whrClassification: getWHRClassification(whr, patientSex),
      skinfoldSum,
    };
  }, [
    weight,
    height,
    waistCircumference,
    hipCircumference,
    tricepsSkinfold,
    suprailiacSkinfold,
    chestSkinfold,
    abdominalSkinfold,
    thighSkinfold,
    subscapularSkinfold,
    midaxillarySkinfold,
    patientSex,
    patientAge,
  ]);

  // Check if at least one measurement is filled
  const hasAnyMeasurement = useMemo(() => {
    return !!(
      weight ||
      height ||
      tricepsSkinfold ||
      subscapularSkinfold ||
      suprailiacSkinfold ||
      abdominalSkinfold ||
      thighSkinfold ||
      chestSkinfold ||
      midaxillarySkinfold ||
      neckCircumference ||
      chestCircumference ||
      waistCircumference ||
      abdomenCircumference ||
      hipCircumference ||
      rightArmCircumference ||
      leftArmCircumference ||
      rightForearmCircumference ||
      leftForearmCircumference ||
      rightThighCircumference ||
      leftThighCircumference ||
      rightCalfCircumference ||
      leftCalfCircumference
    );
  }, [
    weight,
    height,
    tricepsSkinfold,
    subscapularSkinfold,
    suprailiacSkinfold,
    abdominalSkinfold,
    thighSkinfold,
    chestSkinfold,
    midaxillarySkinfold,
    neckCircumference,
    chestCircumference,
    waistCircumference,
    abdomenCircumference,
    hipCircumference,
    rightArmCircumference,
    leftArmCircumference,
    rightForearmCircumference,
    leftForearmCircumference,
    rightThighCircumference,
    leftThighCircumference,
    rightCalfCircumference,
    leftCalfCircumference,
  ]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("Selecione uma data.");
      return;
    }

    if (!hasAnyMeasurement) {
      setError("Preencha pelo menos uma medida.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const assessmentData = {
        patient_id: patientId,
        assessed_at: date.toISOString(),
        // Basic measurements
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        // Skinfolds
        triceps_skinfold: tricepsSkinfold ? parseFloat(tricepsSkinfold) : null,
        subscapular_skinfold: subscapularSkinfold
          ? parseFloat(subscapularSkinfold)
          : null,
        suprailiac_skinfold: suprailiacSkinfold
          ? parseFloat(suprailiacSkinfold)
          : null,
        abdominal_skinfold: abdominalSkinfold
          ? parseFloat(abdominalSkinfold)
          : null,
        thigh_skinfold: thighSkinfold ? parseFloat(thighSkinfold) : null,
        chest_skinfold: chestSkinfold ? parseFloat(chestSkinfold) : null,
        midaxillary_skinfold: midaxillarySkinfold
          ? parseFloat(midaxillarySkinfold)
          : null,
        // Circumferences
        neck_circumference: neckCircumference
          ? parseFloat(neckCircumference)
          : null,
        chest_circumference: chestCircumference
          ? parseFloat(chestCircumference)
          : null,
        waist_circumference: waistCircumference
          ? parseFloat(waistCircumference)
          : null,
        abdomen_circumference: abdomenCircumference
          ? parseFloat(abdomenCircumference)
          : null,
        hip_circumference: hipCircumference
          ? parseFloat(hipCircumference)
          : null,
        right_arm_circumference: rightArmCircumference
          ? parseFloat(rightArmCircumference)
          : null,
        left_arm_circumference: leftArmCircumference
          ? parseFloat(leftArmCircumference)
          : null,
        right_forearm_circumference: rightForearmCircumference
          ? parseFloat(rightForearmCircumference)
          : null,
        left_forearm_circumference: leftForearmCircumference
          ? parseFloat(leftForearmCircumference)
          : null,
        right_thigh_circumference: rightThighCircumference
          ? parseFloat(rightThighCircumference)
          : null,
        left_thigh_circumference: leftThighCircumference
          ? parseFloat(leftThighCircumference)
          : null,
        right_calf_circumference: rightCalfCircumference
          ? parseFloat(rightCalfCircumference)
          : null,
        left_calf_circumference: leftCalfCircumference
          ? parseFloat(leftCalfCircumference)
          : null,
        // Calculated fields
        bmi: calculatedMetrics.bmi,
        body_fat_percentage: calculatedMetrics.bodyFat,
        waist_hip_ratio: calculatedMetrics.whr,
        calculation_protocol: calculatedMetrics.bodyFat ? "pollock_3" : null,
        // Metadata
        notes: notes || null,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("anthropometry_assessments")
          .update(assessmentData)
          .eq("id", assessmentId);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("anthropometry_assessments")
          .insert(assessmentData);

        if (insertError) {
          throw insertError;
        }
      }

      router.push(`/patients/${patientId}/anthropometry`);
      router.refresh();
    } catch (err) {
      setError("Erro ao salvar avaliação antropométrica. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Calculated Metrics Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas Calculadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">IMC</p>
              <p className="text-lg font-semibold">
                {calculatedMetrics.bmi?.toFixed(1) ?? "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                {calculatedMetrics.bmiClassification}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">% Gordura Corporal</p>
              <p className="text-lg font-semibold">
                {calculatedMetrics.bodyFat?.toFixed(1) ?? "N/A"}
                {calculatedMetrics.bodyFat ? "%" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {calculatedMetrics.bodyFatClassification}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Relação Cintura-Quadril
              </p>
              <p className="text-lg font-semibold">
                {calculatedMetrics.whr?.toFixed(3) ?? "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                {calculatedMetrics.whrClassification}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Soma das Dobras</p>
              <p className="text-lg font-semibold">
                {calculatedMetrics.skinfoldSum?.toFixed(1) ?? "N/A"}
                {calculatedMetrics.skinfoldSum ? " mm" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {patientSex === null && "Defina o sexo do paciente"}
                {patientAge === null && patientSex !== null && "Defina a data de nascimento"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label>Data da Avaliação *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                format(date, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Basic Measurements Section */}
      <Collapsible open={basicOpen} onOpenChange={setBasicOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between p-0 hover:bg-transparent"
            type="button"
          >
            <span className="text-base font-semibold">Medidas Básicas</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                basicOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                max="500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex: 75.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                min="0"
                max="300"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Ex: 175"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Skinfolds Section */}
      <Collapsible open={skinfoldsOpen} onOpenChange={setSkinfoldsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between p-0 hover:bg-transparent"
            type="button"
          >
            <span className="text-base font-semibold">
              Dobras Cutâneas (mm)
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                skinfoldsOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            {patientSex === "male"
              ? "Protocolo Jackson-Pollock 3 dobras (Homens): Peitoral, Abdominal, Coxa"
              : patientSex === "female"
                ? "Protocolo Jackson-Pollock 3 dobras (Mulheres): Tríceps, Suprailíaca, Coxa"
                : "Defina o sexo do paciente para cálculo automático de % gordura"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tricepsSkinfold">Tríceps</Label>
              <Input
                id="tricepsSkinfold"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={tricepsSkinfold}
                onChange={(e) => setTricepsSkinfold(e.target.value)}
                placeholder="Ex: 15.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscapularSkinfold">Subescapular</Label>
              <Input
                id="subscapularSkinfold"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={subscapularSkinfold}
                onChange={(e) => setSubscapularSkinfold(e.target.value)}
                placeholder="Ex: 12.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suprailiacSkinfold">Suprailíaca</Label>
              <Input
                id="suprailiacSkinfold"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={suprailiacSkinfold}
                onChange={(e) => setSuprailiacSkinfold(e.target.value)}
                placeholder="Ex: 18.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abdominalSkinfold">Abdominal</Label>
              <Input
                id="abdominalSkinfold"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={abdominalSkinfold}
                onChange={(e) => setAbdominalSkinfold(e.target.value)}
                placeholder="Ex: 25.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thighSkinfold">Coxa</Label>
              <Input
                id="thighSkinfold"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={thighSkinfold}
                onChange={(e) => setThighSkinfold(e.target.value)}
                placeholder="Ex: 20.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chestSkinfold">Peitoral</Label>
              <Input
                id="chestSkinfold"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={chestSkinfold}
                onChange={(e) => setChestSkinfold(e.target.value)}
                placeholder="Ex: 10.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="midaxillarySkinfold">Axilar Média</Label>
              <Input
                id="midaxillarySkinfold"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={midaxillarySkinfold}
                onChange={(e) => setMidaxillarySkinfold(e.target.value)}
                placeholder="Ex: 14.0"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Circumferences Section */}
      <Collapsible open={circumferencesOpen} onOpenChange={setCircumferencesOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between p-0 hover:bg-transparent"
            type="button"
          >
            <span className="text-base font-semibold">Circunferências (cm)</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                circumferencesOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-6">
          {/* Trunk */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Tronco
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="neckCircumference">Pescoço</Label>
                <Input
                  id="neckCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={neckCircumference}
                  onChange={(e) => setNeckCircumference(e.target.value)}
                  placeholder="Ex: 38.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chestCircumference">Tórax</Label>
                <Input
                  id="chestCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={chestCircumference}
                  onChange={(e) => setChestCircumference(e.target.value)}
                  placeholder="Ex: 95.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waistCircumference">Cintura</Label>
                <Input
                  id="waistCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={waistCircumference}
                  onChange={(e) => setWaistCircumference(e.target.value)}
                  placeholder="Ex: 80.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abdomenCircumference">Abdômen</Label>
                <Input
                  id="abdomenCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={abdomenCircumference}
                  onChange={(e) => setAbdomenCircumference(e.target.value)}
                  placeholder="Ex: 85.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hipCircumference">Quadril</Label>
                <Input
                  id="hipCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={hipCircumference}
                  onChange={(e) => setHipCircumference(e.target.value)}
                  placeholder="Ex: 95.0"
                />
              </div>
            </div>
          </div>

          {/* Arms */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Membros Superiores
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="rightArmCircumference">Braço Direito</Label>
                <Input
                  id="rightArmCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rightArmCircumference}
                  onChange={(e) => setRightArmCircumference(e.target.value)}
                  placeholder="Ex: 32.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftArmCircumference">Braço Esquerdo</Label>
                <Input
                  id="leftArmCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={leftArmCircumference}
                  onChange={(e) => setLeftArmCircumference(e.target.value)}
                  placeholder="Ex: 31.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rightForearmCircumference">
                  Antebraço Direito
                </Label>
                <Input
                  id="rightForearmCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rightForearmCircumference}
                  onChange={(e) => setRightForearmCircumference(e.target.value)}
                  placeholder="Ex: 28.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftForearmCircumference">
                  Antebraço Esquerdo
                </Label>
                <Input
                  id="leftForearmCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={leftForearmCircumference}
                  onChange={(e) => setLeftForearmCircumference(e.target.value)}
                  placeholder="Ex: 27.5"
                />
              </div>
            </div>
          </div>

          {/* Legs */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Membros Inferiores
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="rightThighCircumference">Coxa Direita</Label>
                <Input
                  id="rightThighCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="150"
                  value={rightThighCircumference}
                  onChange={(e) => setRightThighCircumference(e.target.value)}
                  placeholder="Ex: 55.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftThighCircumference">Coxa Esquerda</Label>
                <Input
                  id="leftThighCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="150"
                  value={leftThighCircumference}
                  onChange={(e) => setLeftThighCircumference(e.target.value)}
                  placeholder="Ex: 54.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rightCalfCircumference">
                  Panturrilha Direita
                </Label>
                <Input
                  id="rightCalfCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rightCalfCircumference}
                  onChange={(e) => setRightCalfCircumference(e.target.value)}
                  placeholder="Ex: 38.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftCalfCircumference">
                  Panturrilha Esquerda
                </Label>
                <Input
                  id="leftCalfCircumference"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={leftCalfCircumference}
                  onChange={(e) => setLeftCalfCircumference(e.target.value)}
                  placeholder="Ex: 37.5"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações sobre a avaliação (opcional)"
          rows={3}
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar Alterações" : "Registrar Avaliação"}
        </Button>
      </div>
    </form>
  );
}
