"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Users,
  Search,
  CheckCircle2,
  Trophy,
  Loader2,
  Trash2,
} from "lucide-react";
import { differenceInDays, isAfter, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ChallengeParticipant, ChallengeCheckin, Patient } from "@/types/database";

type ParticipantWithDetails = ChallengeParticipant & {
  patient: Patient;
  checkins: ChallengeCheckin[];
};

interface ParticipantsListProps {
  challengeId: string;
  participants: ParticipantWithDetails[];
  availablePatients: Patient[];
  totalDays: number;
  startDate: Date;
}

function ParticipantCard({
  participant,
  totalDays,
  startDate,
  onRemove,
}: {
  participant: ParticipantWithDetails;
  totalDays: number;
  startDate: Date;
  onRemove: (id: string) => void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);
  const checkinsCount = participant.checkins.length;
  const now = new Date();
  const daysPassed = isAfter(now, startDate)
    ? Math.min(differenceInDays(now, startDate) + 1, totalDays)
    : 0;
  const completionRate = daysPassed > 0
    ? Math.round((checkinsCount / daysPassed) * 100)
    : 0;

  async function handleRemove() {
    setIsRemoving(true);
    await onRemove(participant.id);
    setIsRemoving(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
          {participant.patient.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{participant.patient.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {checkinsCount} de {daysPassed} check-ins ({completionRate}%)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {participant.badge_earned && (
          <Badge variant="default" className="gap-1">
            <Trophy className="h-3 w-3" />
            Concluiu
          </Badge>
        )}

        <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export function ParticipantsList({
  challengeId,
  participants,
  availablePatients,
  totalDays,
  startDate,
}: ParticipantsListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const filteredPatients = availablePatients.filter((patient) =>
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleAddParticipants() {
    if (selectedPatients.length === 0) {
      toast.error("Selecione pelo menos um paciente");
      return;
    }

    setIsAdding(true);

    try {
      const participantsToAdd = selectedPatients.map((patientId) => ({
        challenge_id: challengeId,
        patient_id: patientId,
      }));

      const { error } = await supabase
        .from("challenge_participants")
        .insert(participantsToAdd);

      if (error) throw error;

      toast.success(
        `${selectedPatients.length} paciente(s) adicionado(s) ao desafio!`
      );
      setSelectedPatients([]);
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error adding participants:", error);
      toast.error("Erro ao adicionar participantes");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveParticipant(participantId: string) {
    try {
      const { error } = await supabase
        .from("challenge_participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;

      toast.success("Participante removido do desafio");
      router.refresh();
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("Erro ao remover participante");
    }
  }

  function togglePatient(patientId: string) {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Participantes ({participants.length})</CardTitle>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Participantes</DialogTitle>
              <DialogDescription>
                Selecione os pacientes que participarão deste desafio.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar pacientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredPatients.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {availablePatients.length === 0
                      ? "Todos os pacientes já estão no desafio"
                      : "Nenhum paciente encontrado"}
                  </p>
                ) : (
                  filteredPatients.map((patient) => {
                    const isSelected = selectedPatients.includes(patient.id);
                    return (
                      <div
                        key={patient.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => togglePatient(patient.id)}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {patient.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{patient.full_name}</p>
                          {patient.email && (
                            <p className="text-xs text-muted-foreground">
                              {patient.email}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedPatients.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedPatients.length} paciente(s) selecionado(s)
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddParticipants}
                  disabled={selectedPatients.length === 0 || isAdding}
                >
                  {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">Nenhum participante</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione pacientes para começar o desafio.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                totalDays={totalDays}
                startDate={startDate}
                onRemove={handleRemoveParticipant}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
