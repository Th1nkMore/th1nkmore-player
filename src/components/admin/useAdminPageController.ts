"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminLogs } from "@/lib/hooks/useAdminLogs";
import { useAdminPlaylistFlow } from "./useAdminPlaylistFlow";
import { useAdminUploadFlow } from "./useAdminUploadFlow";

type Tab = "upload" | "edit";

export function useAdminPageController() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const { logs, addLog, clearLogs } = useAdminLogs();

  const upload = useAdminUploadFlow({ addLog, clearLogs });
  const playlist = useAdminPlaylistFlow({
    addLog,
    clearLogs,
    shouldLoad: activeTab === "edit",
  });

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logs.at(-1)?.level === "error") {
      setIsTerminalOpen(true);
    }
  }, [logs]);

  const handleLogout = useCallback(async () => {
    setIsSigningOut(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/admin/login";
    }
  }, []);

  return {
    activeTab,
    addLog,
    currentTime,
    handleLogout,
    isSigningOut,
    isTerminalOpen,
    logs,
    playlist,
    setActiveTab,
    setIsTerminalOpen,
    upload,
  };
}
