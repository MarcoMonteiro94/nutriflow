"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioRecorder, formatDuration } from "@/hooks/use-audio-recorder";
import { Mic, Square, Pause, Play, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDurationSeconds?: number;
  disabled?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  maxDurationSeconds = 1800, // 30 minutes default
  disabled = false,
}: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecorder({
    maxDurationSeconds,
    onMaxDurationReached: () => {
      // Automatically stop and save
    },
  });

  const handleConfirm = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            Gravação de áudio não é suportada neste navegador.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-6">
          {/* Recording Indicator */}
          <div className="relative">
            <div
              className={cn(
                "h-24 w-24 rounded-full flex items-center justify-center transition-colors",
                isRecording && !isPaused
                  ? "bg-red-500/20 animate-pulse"
                  : audioUrl
                    ? "bg-green-500/20"
                    : "bg-muted"
              )}
            >
              <Mic
                className={cn(
                  "h-10 w-10",
                  isRecording && !isPaused
                    ? "text-red-500"
                    : audioUrl
                      ? "text-green-500"
                      : "text-muted-foreground"
                )}
              />
            </div>
            {isRecording && !isPaused && (
              <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          {/* Duration Display */}
          <div className="text-center">
            <p className="text-3xl font-mono font-semibold tabular-nums">
              {formatDuration(duration)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isRecording && !isPaused && "Gravando..."}
              {isRecording && isPaused && "Pausado"}
              {!isRecording && audioUrl && "Gravação concluída"}
              {!isRecording && !audioUrl && `Máximo: ${formatDuration(maxDurationSeconds)}`}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!isRecording && !audioUrl && (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={disabled}
                className="gap-2"
              >
                <Mic className="h-5 w-5" />
                Iniciar Gravação
              </Button>
            )}

            {isRecording && (
              <>
                {isPaused ? (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={resumeRecording}
                    className="h-12 w-12"
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={pauseRecording}
                    className="h-12 w-12"
                  >
                    <Pause className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="gap-2"
                >
                  <Square className="h-5 w-5" />
                  Parar
                </Button>
              </>
            )}

            {!isRecording && audioUrl && (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={resetRecording}
                  className="h-12 w-12"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={handleConfirm}
                  disabled={disabled}
                  className="gap-2"
                >
                  Usar esta Gravação
                </Button>
              </>
            )}
          </div>

          {/* Audio Preview */}
          {audioUrl && !isRecording && (
            <div className="w-full max-w-md">
              <audio
                src={audioUrl}
                controls
                className="w-full h-10"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
