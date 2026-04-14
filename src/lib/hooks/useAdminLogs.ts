"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Song } from "@/types/music";

type LogEntry = {
  id: string;
  message: string;
  timestamp: Date;
};

export function useAdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logCounterRef = useRef(0);

  const addLog = useCallback((message: string) => {
    logCounterRef.current += 1;
    const entry: LogEntry = {
      id: `${Date.now()}-${logCounterRef.current}`,
      message,
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
}
