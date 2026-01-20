"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: SaveStatus;
  error: Error | null;
  save: () => Promise<void>;
  reset: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const previousDataRef = useRef<T>(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const save = useCallback(async () => {
    if (!enabled) return;

    setStatus("saving");
    setError(null);

    try {
      await onSave(data);
      if (isMountedRef.current) {
        setStatus("saved");
        previousDataRef.current = data;
        // Reset to idle after a brief moment
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus("idle");
          }
        }, 2000);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setStatus("error");
        setError(err instanceof Error ? err : new Error("Failed to save"));
      }
    }
  }, [data, onSave, enabled]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  // Debounced auto-save on data change
  useEffect(() => {
    if (!enabled) return;

    // Check if data has actually changed (simple JSON comparison)
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (!hasChanged) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, save]);

  return {
    status,
    error,
    save,
    reset,
  };
}
