"use client";

import { useCallback, useEffect, useState } from "react";
import { hasSongChanges } from "@/lib/admin-workspace";
import { useAdminLogs } from "@/lib/hooks/useAdminLogs";
import { useAdminPlaylistFlow } from "./useAdminPlaylistFlow";
import { useAdminUploadFlow } from "./useAdminUploadFlow";

type Tab = "upload" | "edit" | "catalog";

export function useAdminPageController() {
  const [activeTab, setActiveTab] = useState<Tab>("edit");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const [isWorkspaceBusy, setIsWorkspaceBusy] = useState(false);
  const { logs, addLog, clearLogs } = useAdminLogs();

  const upload = useAdminUploadFlow({ addLog, clearLogs });
  const playlist = useAdminPlaylistFlow({
    addLog,
    clearLogs,
    shouldLoad: activeTab === "edit" || activeTab === "catalog",
  });

  const isBusy =
    upload.isExtractingMetadata ||
    upload.isFetchingLyrics ||
    playlist.isFetchingLyricsEdit ||
    upload.isDeploying ||
    upload.isImportingCoverPackage ||
    playlist.isSavingPlaylist ||
    playlist.isReplacingAudio ||
    playlist.isRestoringHistory ||
    playlist.isBackfillingDurations ||
    isWorkspaceBusy;
  const hasEditedDraft = hasSongChanges(
    playlist.playlist.find((song) => song.id === playlist.editedSong?.id) ??
      null,
    playlist.editedSong,
  );
  const handleTabChange = useCallback(
    (tab: Tab) => {
      if (tab === activeTab || isBusy) return;
      if (activeTab === "edit" && hasEditedDraft) {
        setPendingTab(tab);
        return;
      }
      setActiveTab(tab);
    },
    [activeTab, hasEditedDraft, isBusy],
  );
  const confirmTabChange = async (save: boolean) => {
    if (isBusy || !pendingTab) return;
    if (save && !(await playlist.handleSaveEdit())) return;
    if (!save) playlist.handleCancelEdit();
    setActiveTab(pendingTab);
    setPendingTab(null);
  };
  useEffect(() => {
    const protectDraft = (event: BeforeUnloadEvent) => {
      if (!(hasEditedDraft || upload.audioFile || isBusy)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectDraft);
    return () => window.removeEventListener("beforeunload", protectDraft);
  }, [hasEditedDraft, upload.audioFile, isBusy]);

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

  const requestLogout = () => {
    if (hasEditedDraft || upload.audioFile) setLogoutOpen(true);
    else void handleLogout();
  };
  const confirmLogout = async () => {
    playlist.handleCancelEdit();
    upload.resetDraft();
    setLogoutOpen(false);
    await handleLogout();
  };
  return {
    logoutOpen,
    setLogoutOpen,
    requestLogout,
    confirmLogout,
    activeTab,
    addLog,
    isBusy,
    pendingTab,
    setPendingTab,
    confirmTabChange,
    setIsWorkspaceBusy,
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
