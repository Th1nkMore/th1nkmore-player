"use client";

import { useCallback, useEffect, useState } from "react";
import { hasSongChanges } from "@/lib/admin-workspace";
import { useAdminLogs } from "@/lib/hooks/useAdminLogs";
import { useAdminPlaylistFlow } from "./useAdminPlaylistFlow";
import { useAdminUploadFlow } from "./useAdminUploadFlow";

type Tab = "upload" | "edit" | "catalog";

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
    shouldLoad: activeTab === "edit" || activeTab === "catalog",
  });

  const handleTabChange = useCallback(
    async (tab: Tab) => {
      if (tab === activeTab || playlist.isSavingPlaylist) return;
      const savedSong =
        playlist.playlist.find((song) => song.id === playlist.editedSong?.id) ??
        null;
      if (
        activeTab === "edit" &&
        hasSongChanges(savedSong, playlist.editedSong)
      ) {
        if (!(await playlist.handleSaveEdit())) return;
      }
      setActiveTab(tab);
    },
    [activeTab, playlist],
  );

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
    handleTabChange,
    isSigningOut,
    isTerminalOpen,
    logs,
    playlist,
    setActiveTab,
    setIsTerminalOpen,
    upload,
  };
}
