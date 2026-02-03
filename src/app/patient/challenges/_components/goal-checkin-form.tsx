"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { PhotoUpload } from "./photo-upload";
import { MetricInput } from "./metric-input";
import { updateStreakAfterCheckin, checkStreakAchievements, hasCheckinToday } from "@/lib/challenges/streak-utils";
import { checkGoalCompletion, advanceToNextGoal } from "@/lib/challenges/phase-utils";
import { Check, Loader2, Camera, Scale, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChallengeGoal, GoalType, MetricType } from "@/types/database";

interface GoalCheckinFormProps {
  goal: ChallengeGoal;
  participantId: string;
  patientId: string;
  onSuccess: (data: { streak: number; achievements: string[] }) => void;
}

const GOAL_TYPE_CONFIG: Record<GoalType, {
  icon: typeof Check;
  label: string;
  description: string;
}> = {
  checkin: {
    icon: CheckCircle2,
    label: "Confirmação",
    description: "Confirme que completou esta meta hoje"
  },
  photo: {
    icon: Camera,
    label: "Foto",
    description: "Envie uma foto como prova"
  },
  metric: {
    icon: Scale,
    label: "Medição",
    description: "Registre seu valor de hoje"
  },
};

export function GoalCheckinForm({
  goal,
  participantId,
  patientId,
  onSuccess,
}: GoalCheckinFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metricValue, setMetricValue] = useState("");
  const [notes, setNotes] = useState("");

  const config = GOAL_TYPE_CONFIG[goal.type as GoalType];

  // Check if already checked in today
  useEffect(() => {
    async function checkTodaysCheckin() {
      const hasCheckin = await hasCheckinToday(participantId, goal.id);
      setAlreadyCheckedIn(hasCheckin);
    }
    checkTodaysCheckin();
  }, [participantId, goal.id]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Validate form
  const isValid = () => {
    if (goal.type === "photo" && !selectedFile) return false;
    if (goal.type === "metric" && !metricValue) return false;
    return true;
  };

  // Upload photo to storage
  async function uploadPhoto(file: File): Promise<string> {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const fileName = `${participantId}/${goal.id}/${today}-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("challenge-photos")
      .upload(fileName, file, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error("Erro ao enviar foto: " + uploadError.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("challenge-photos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  // Submit check-in
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValid() || alreadyCheckedIn) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      let imageUrl: string | null = null;

      // Upload photo if needed
      if (goal.type === "photo" && selectedFile) {
        setIsUploading(true);
        imageUrl = await uploadPhoto(selectedFile);
        setIsUploading(false);
      }

      // Create check-in record
      const checkinData = {
        participant_id: participantId,
        goal_id: goal.id,
        checkin_date: today,
        completed: true,
        image_url: imageUrl,
        metric_value: goal.type === "metric" ? parseFloat(metricValue) : null,
        notes: notes || null,
      };

      const { error: insertError } = await (supabase as any)
        .from("goal_checkins")
        .insert(checkinData);

      if (insertError) {
        throw new Error("Erro ao salvar check-in: " + insertError.message);
      }

      // Update streak
      const { current: streak } = await updateStreakAfterCheckin(participantId, goal.id);

      // Check for streak achievements
      const achievements = await checkStreakAchievements(participantId, goal.id, streak);

      // Check if goal is completed
      const { completed: goalCompleted } = await checkGoalCompletion(participantId, goal.id);

      if (goalCompleted) {
        // Advance to next goal
        await advanceToNextGoal(participantId, goal.id);
      }

      // Show success animation
      setShowSuccess(true);

      // Call success callback after animation
      setTimeout(() => {
        onSuccess({ streak, achievements });
      }, 1500);

    } catch (err) {
      console.error("Check-in error:", err);
      setError(err instanceof Error ? err.message : "Erro ao fazer check-in");
      setIsUploading(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Track if confetti was already fired
  const confettiFired = useRef(false);

  // Fire confetti when success is shown
  useEffect(() => {
    if (showSuccess && !confettiFired.current) {
      confettiFired.current = true;
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  }, [showSuccess]);

  // Success animation
  if (showSuccess) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="size-10" />
            </div>
            <Sparkles className="absolute -right-2 -top-2 size-8 text-amber-500 animate-pulse" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-emerald-800">
            Check-in realizado!
          </h3>
          <p className="mt-2 text-emerald-600">
            Parabéns por manter o foco!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Already checked in today
  if (alreadyCheckedIn) {
    return (
      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500 text-white">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-sky-800">
            Você já fez o check-in de hoje!
          </h3>
          <p className="mt-2 text-sm text-sky-600">
            Volte amanhã para continuar sua sequência.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-primary/10 text-primary"
          )}>
            <config.icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Check-in: {config.label}</CardTitle>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type-specific input */}
          {goal.type === "checkin" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-primary/30 bg-primary/5">
                <CheckCircle2 className="h-12 w-12 text-primary/50" />
              </div>
              <p className="text-center text-muted-foreground">
                Clique em &quot;Confirmar&quot; para registrar que você completou esta meta hoje.
              </p>
            </div>
          )}

          {goal.type === "photo" && (
            <PhotoUpload
              onFileSelect={handleFileSelect}
              previewUrl={previewUrl}
              isUploading={isUploading}
            />
          )}

          {goal.type === "metric" && goal.metric_type && (
            <MetricInput
              metricType={goal.metric_type as MetricType}
              patientId={patientId}
              value={metricValue}
              onChange={setMetricValue}
            />
          )}

          {/* Optional notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Como foi seu dia? Alguma dificuldade?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!isValid() || isSubmitting || isUploading}
          >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isUploading ? "Enviando foto..." : "Salvando..."}
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Confirmar Check-in
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
