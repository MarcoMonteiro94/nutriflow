"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioRecorder } from "@/components/anamnesis/audio-recorder";
import { ProcessingIndicator } from "@/components/anamnesis/processing-indicator";
import { ArrowLeft, Mic, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import type { ProcessingStep, AnamnesisSourceType } from "@/types/anamnesis";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewAnamnesisPage({ params }: PageProps) {
  const { id: patientId } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"record" | "text" | "upload">("record");
  const [textInput, setTextInput] = useState("");
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [processingMessage, setProcessingMessage] = useState("");
  const [processingError, setProcessingError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRecordingComplete = async (blob: Blob) => {
    await processAudio(blob, "audio");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processAudio(file, "audio");
  };

  const handleTextSubmit = async () => {
    if (textInput.trim().length < 50) {
      toast.error("O texto deve ter pelo menos 50 caracteres");
      return;
    }

    await processText(textInput, "text");
  };

  const processAudio = async (audioData: Blob | File, sourceType: AnamnesisSourceType) => {
    setIsProcessing(true);
    setProcessingStep("uploading");
    setProcessingError("");

    try {
      // Step 1: Upload audio
      setProcessingMessage("Enviando arquivo de áudio...");
      const formData = new FormData();
      formData.append("file", audioData, audioData instanceof File ? audioData.name : "recording.webm");
      formData.append("patientId", patientId);

      const uploadResponse = await fetch("/api/anamnesis/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Erro ao fazer upload");
      }

      const uploadResult = await uploadResponse.json();

      // Step 2: Transcribe audio
      setProcessingStep("transcribing");
      setProcessingMessage("Convertendo áudio em texto...");

      const transcribeResponse = await fetch("/api/anamnesis/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: uploadResult.filePath }),
      });

      if (!transcribeResponse.ok) {
        const error = await transcribeResponse.json();
        throw new Error(error.error || "Erro ao transcrever");
      }

      const transcribeResult = await transcribeResponse.json();

      // Step 3: Process with AI
      setProcessingStep("processing");
      setProcessingMessage("Analisando com inteligência artificial...");

      const processResponse = await fetch("/api/anamnesis/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          transcript: transcribeResult.transcript,
          sourceType,
          audioFilePath: uploadResult.filePath,
          audioDurationSeconds: transcribeResult.duration_seconds,
        }),
      });

      if (!processResponse.ok) {
        const error = await processResponse.json();
        throw new Error(error.error || "Erro ao processar");
      }

      const processResult = await processResponse.json();

      // Step 4: Complete
      setProcessingStep("complete");
      setProcessingMessage("Processamento concluído!");

      toast.success("Anamnese processada com sucesso!");

      // Redirect to review page
      setTimeout(() => {
        router.push(`/patients/${patientId}/anamnesis/${processResult.reportId}`);
      }, 1500);
    } catch (error) {
      console.error("Processing error:", error);
      setProcessingStep("error");
      setProcessingError(
        error instanceof Error ? error.message : "Erro desconhecido"
      );
      toast.error("Erro ao processar anamnese");
    }
  };

  const processText = async (text: string, sourceType: AnamnesisSourceType) => {
    setIsProcessing(true);
    setProcessingStep("processing");
    setProcessingError("");
    setProcessingMessage("Analisando com inteligência artificial...");

    try {
      const processResponse = await fetch("/api/anamnesis/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          transcript: text,
          sourceType,
        }),
      });

      if (!processResponse.ok) {
        const error = await processResponse.json();
        throw new Error(error.error || "Erro ao processar");
      }

      const processResult = await processResponse.json();

      setProcessingStep("complete");
      setProcessingMessage("Processamento concluído!");

      toast.success("Anamnese processada com sucesso!");

      setTimeout(() => {
        router.push(`/patients/${patientId}/anamnesis/${processResult.reportId}`);
      }, 1500);
    } catch (error) {
      console.error("Processing error:", error);
      setProcessingStep("error");
      setProcessingError(
        error instanceof Error ? error.message : "Erro desconhecido"
      );
      toast.error("Erro ao processar anamnese");
    }
  };

  const resetProcessing = () => {
    setIsProcessing(false);
    setProcessingStep("idle");
    setProcessingMessage("");
    setProcessingError("");
  };

  if (isProcessing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={resetProcessing}
            disabled={processingStep !== "error"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Processando Anamnese
            </h1>
            <p className="text-muted-foreground">
              Aguarde enquanto processamos as informações
            </p>
          </div>
        </div>

        <ProcessingIndicator
          step={processingStep}
          message={processingMessage}
          error={processingError}
        />

        {processingStep === "error" && (
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={resetProcessing}>
              Tentar Novamente
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/patients/${patientId}/anamnesis`}>Voltar</Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/patients/${patientId}/anamnesis`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nova Anamnese
          </h1>
          <p className="text-muted-foreground">
            Grave ou digite as informações da consulta
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como você quer registrar a anamnese?</CardTitle>
          <CardDescription>
            Escolha uma das opções abaixo para iniciar o registro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="record" className="gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Gravar</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Digitar</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="mt-6">
              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground mb-4">
                  <p>
                    Grave a consulta diretamente do navegador. O áudio será
                    transcrito e processado automaticamente.
                  </p>
                </div>
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  maxDurationSeconds={3600} // 1 hour
                />
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  <p>
                    Digite ou cole suas anotações da consulta. A IA irá
                    estruturar as informações automaticamente.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anamnesis-text">Texto da Anamnese</Label>
                  <Textarea
                    id="anamnesis-text"
                    placeholder="Digite as informações da consulta aqui...&#10;&#10;Exemplo:&#10;Paciente relata ganho de peso nos últimos 6 meses, cerca de 8kg. Trabalha em escritório, sedentário. Alimentação irregular, pula café da manhã frequentemente. Come muito fast-food no almoço por falta de tempo. Não pratica exercícios. Dorme cerca de 5-6 horas por noite. Histórico familiar de diabetes (mãe). Objetivo: perder peso e melhorar disposição."
                    className="min-h-[300px] resize-y"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 50 caracteres. Atual: {textInput.length}
                  </p>
                </div>
                <Button
                  onClick={handleTextSubmit}
                  disabled={textInput.trim().length < 50}
                  className="w-full"
                >
                  Processar com IA
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  <p>
                    Faça upload de um arquivo de áudio existente (MP3, WAV, M4A,
                    WebM). Máximo de 50MB.
                  </p>
                </div>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <Label
                    htmlFor="audio-upload"
                    className="cursor-pointer text-primary hover:underline"
                  >
                    Clique para selecionar um arquivo
                  </Label>
                  <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Formatos suportados: MP3, WAV, M4A, WebM, OGG
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
