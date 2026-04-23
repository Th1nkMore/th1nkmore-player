"use client";

import { useCallback, useEffect, useState } from "react";
import { persistSongAssetToLibrary } from "@/lib/admin-utils";
import { useAdminLogs } from "@/lib/hooks/useAdminLogs";
import type { Song } from "@/types/music";
import { useAdminPlaylistFlow } from "./useAdminPlaylistFlow";
import { useAdminUploadFlow } from "./useAdminUploadFlow";

type Tab = "upload" | "record" | "edit";

export function useAdminPageController() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const { logs, addLog, clearLogs } = useAdminLogs();

  const upload = useAdminUploadFlow({
    addLog,
    clearLogs,
    onUseRecordingSource: () => setActiveTab("upload"),
  });
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
    if (logs.length > 0) {
      setIsTerminalOpen(true);
    }
  }, [logs.length]);

  useEffect(() => {
    if (upload.isDeploying) {
      setIsTerminalOpen(true);
    }
  }, [upload.isDeploying]);

  const handleSaveRecordingToLibrary = useCallback(
    async (
      recordedFile: File,
      durationSeconds: number,
      draft: Partial<Song>,
      accompanimentFile?: File | null,
    ) => {
      const recordingFormData: Partial<Song> = {
        ...draft,
        duration: durationSeconds,
        sourceType: "recording",
      };
      const newSong = await persistSongAssetToLibrary({
        addLog,
        accompanimentFile,
        assetKind: "recording",
        file: recordedFile,
        formData: recordingFormData,
      });

      addLog(`> New recording: ${newSong.title} by ${newSong.artist}`);
      if (activeTab === "edit") {
        await playlist.loadPlaylist();
      }
    },
    [activeTab, addLog, playlist],
  );

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
    handleSaveRecordingToLibrary,
    isSigningOut,
    isTerminalOpen,
    logs,
    playlist,
    setActiveTab,
    setIsTerminalOpen,
    upload,
  };
}
