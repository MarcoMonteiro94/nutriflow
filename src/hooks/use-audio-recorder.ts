"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { AudioRecorderState } from "@/types/anamnesis";

interface UseAudioRecorderOptions {
  maxDurationSeconds?: number;
  onMaxDurationReached?: () => void;
}

interface UseAudioRecorderReturn extends AudioRecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  isSupported: boolean;
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { maxDurationSeconds = 3600, onMaxDurationReached } = options;

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  const isSupported =
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    "getUserMedia" in (navigator.mediaDevices || {});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - startTimeRef.current) / 1000 + pausedDurationRef.current
      );

      setState((prev) => ({ ...prev, duration: elapsed }));

      // Check max duration
      if (elapsed >= maxDurationSeconds) {
        onMaxDurationReached?.();
        stopRecording();
      }
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDurationSeconds, onMaxDurationReached]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        error: "Gravação de áudio não é suportada neste navegador",
      }));
      return;
    }

    try {
      // Reset state
      chunksRef.current = [];
      pausedDurationRef.current = 0;

      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Determine best MIME type
      const mimeType = getSupportedMimeType();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }));

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setState((prev) => ({
          ...prev,
          error: "Erro durante a gravação",
          isRecording: false,
        }));
      };

      mediaRecorderRef.current = mediaRecorder;

      // Start recording
      mediaRecorder.start(1000); // Capture in 1 second chunks

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
      }));

      startTimer();
    } catch (error) {
      console.error("Error starting recording:", error);
      let errorMessage = "Erro ao acessar o microfone";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Permissão para acessar o microfone foi negada";
        } else if (error.name === "NotFoundError") {
          errorMessage = "Nenhum microfone encontrado";
        }
      }

      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [isSupported, state.audioUrl, startTimer]);

  const stopRecording = useCallback(() => {
    stopTimer();

    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      pausedDurationRef.current = state.duration;
      stopTimer();
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused, state.duration, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      startTimer();
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused, startTimer]);

  const resetRecording = useCallback(() => {
    stopTimer();

    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    chunksRef.current = [];
    pausedDurationRef.current = 0;
    mediaRecorderRef.current = null;
    streamRef.current = null;

    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
    });
  }, [state.isRecording, state.audioUrl, stopTimer]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    isSupported,
  };
}

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "audio/webm";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
