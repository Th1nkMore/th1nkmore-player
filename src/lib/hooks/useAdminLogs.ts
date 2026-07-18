"use client";

import { useCallback, useRef, useState } from "react";

export type AdminLogLevel = "info" | "error";

export type AdminLogEntry = {
  id: string;
  level: AdminLogLevel;
  message: string;
  timestamp: Date;
};

export function inferAdminLogLevel(message: string): AdminLogLevel {
  return /^>\s*(error|failed)/i.test(message) ? "error" : "info";
}

export function useAdminLogs() {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const logCounterRef = useRef(0);

  const addLog = useCallback((message: string, level?: AdminLogLevel) => {
    logCounterRef.current += 1;
    const inferredLevel = level || inferAdminLogLevel(message);
    const entry: AdminLogEntry = {
      id: `${Date.now()}-${logCounterRef.current}`,
      level: inferredLevel,
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
