"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingState = "idle" | "recording" | "stopped" | "failed";

type StopResult = {
  blob: Blob;
  mimeType: string;
};

const MIME_TYPE_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

function resolveMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return (
    MIME_TYPE_CANDIDATES.find((candidate) =>
      MediaRecorder.isTypeSupported(candidate),
    ) || ""
  );
}

export function useAudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const stopResolverRef = useRef<((result: StopResult | null) => void) | null>(
    null,
  );

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined";

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
  }, []);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetRecording = () => {
    cleanupTimer();
    cleanupStream();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setRecordedBlob(null);
    setElapsedSeconds(0);
    setError(null);
    setMimeType("");
    setRecordingState("idle");
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      return null;
    });
  };

  const startRecording = async () => {
    if (!isSupported) {
      setRecordingState("failed");
      throw new Error("This browser does not support audio recording");
    }

    resetRecording();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const nextMimeType = resolveMimeType();
      const recorder = nextMimeType
        ? new MediaRecorder(stream, { mimeType: nextMimeType })
        : new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setMimeType(recorder.mimeType || nextMimeType);
      setRecordingState("recording");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        cleanupTimer();
        cleanupStream();
        setRecordingState("failed");
        setError("Recording failed while capturing audio");
      };

      recorder.onstop = () => {
        cleanupTimer();
        cleanupStream();

        const nextBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || nextMimeType || "audio/webm",
        });

        setRecordedBlob(nextBlob);
        setPreviewUrl((currentPreviewUrl) => {
          if (currentPreviewUrl) {
            URL.revokeObjectURL(currentPreviewUrl);
          }
          return URL.createObjectURL(nextBlob);
        });
        setRecordingState("stopped");
        stopResolverRef.current?.({
          blob: nextBlob,
          mimeType: recorder.mimeType || nextMimeType || "audio/webm",
        });
        stopResolverRef.current = null;
      };

      recorder.start();
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((current) => current + 1);
      }, 1000);
    } catch (cause) {
      cleanupTimer();
      cleanupStream();
      setRecordingState("failed");
      setError(
        cause instanceof Error ? cause.message : "Failed to start recording",
      );
      throw cause;
    }
  };

  const stopRecording = async (): Promise<StopResult | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      return null;
    }

    return new Promise((resolve) => {
      stopResolverRef.current = resolve;
      recorder.stop();
    });
  };

  useEffect(() => {
    return () => {
      cleanupTimer();
      cleanupStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [cleanupStream, cleanupTimer, previewUrl]);

  return {
    elapsedSeconds,
    error,
    isSupported,
    mimeType,
    previewUrl,
    recordedBlob,
    recordingState,
    resetRecording,
    startRecording,
    stopRecording,
  };
}
