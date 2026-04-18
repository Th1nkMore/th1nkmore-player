"use client";

import * as mm from "music-metadata-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPageChrome } from "@/components/admin/AdminPageChrome";
import { AdminRecordingWorkspace } from "@/components/admin/AdminRecordingWorkspace";
import { EditPlaylist } from "@/components/admin/EditPlaylist";
import { TerminalOutput } from "@/components/admin/TerminalOutput";
import { UploadForm } from "@/components/admin/UploadForm";
import {
  fetchLyricsFromAdmin,
  mergeFetchedSongInfo,
  persistSongAssetToLibrary,
  saveAdminPlaylist,
} from "@/lib/admin-utils";
import { useAdminLogs } from "@/lib/hooks/useAdminLogs";
import {
  convertPlainLyricsWorkflow,
  describeLyrics,
  normalizeLyricsWorkflow,
} from "@/lib/lyrics";
import {
  createEmptySongDraft,
  normalizePlaylistSongs,
  normalizeSong,
} from "@/lib/song";
import type { Song } from "@/types/music";

type Tab = "upload" | "record" | "edit";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editedSong, setEditedSong] = useState<Song | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [formData, setFormData] = useState<Partial<Song>>(createEmptySongDraft);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const { logs, addLog, clearLogs } = useAdminLogs();
  const [isDeploying, setIsDeploying] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [neteaseUrl, setNeteaseUrl] = useState("");
  const [neteaseUrlEdit, setNeteaseUrlEdit] = useState("");
  const [isFetchingLyricsEdit, setIsFetchingLyricsEdit] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update time on client side only to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-open terminal tray when new logs arrive or deployment starts
  useEffect(() => {
    if (logs.length > 0) {
      setIsTerminalOpen(true);
    }
  }, [logs.length]);

  useEffect(() => {
    if (isDeploying) {
      setIsTerminalOpen(true);
    }
  }, [isDeploying]);

  const loadPlaylist = useCallback(async () => {
    setIsLoadingPlaylist(true);
    try {
      const response = await fetch("/api/admin/playlist");
      if (response.ok) {
        const data = await response.json();
        setPlaylist(normalizePlaylistSongs(data as Song[]));
      } else {
        addLog("> Error: Failed to load playlist");
      }
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Failed to load playlist"}`,
      );
    } finally {
      setIsLoadingPlaylist(false);
    }
  }, [addLog]);

  // Load playlist when edit tab is active
  useEffect(() => {
    if (activeTab === "edit") {
      loadPlaylist();
    }
  }, [activeTab, loadPlaylist]);

  const handleEditSong = (song: Song) => {
    setEditingSongId(song.id);
    setEditedSong(normalizeSong(song));
    setNeteaseUrlEdit(""); // Reset NetEase URL when starting to edit
  };

  const handleCancelEdit = () => {
    setEditingSongId(null);
    setEditedSong(null);
    setNeteaseUrlEdit(""); // Clear NetEase URL when canceling
  };

  const handleSaveEdit = () => {
    if (!editedSong) return;

    const updatedPlaylist = playlist.map((song) =>
      song.id === editedSong.id ? normalizeSong(editedSong) : song,
    );
    setPlaylist(updatedPlaylist);
    setEditingSongId(null);
    setEditedSong(null);
  };

  const handleDeleteSong = (songId: string) => {
    if (confirm("Are you sure you want to delete this song?")) {
      const updatedPlaylist = playlist.filter((song) => song.id !== songId);
      setPlaylist(updatedPlaylist);
    }
  };

  const handleSavePlaylist = async () => {
    setIsSavingPlaylist(true);
    clearLogs();

    try {
      addLog("> Saving playlist...");
      await saveAdminPlaylist(playlist);
      addLog("> Playlist saved successfully!");
      addLog(`> Updated ${playlist.length} song(s)`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`> Error: ${errorMessage}`);
      addLog("> Failed to save playlist");
    } finally {
      setIsSavingPlaylist(false);
    }
  };

  const updateEditedSong = (field: keyof Song, value: Song[keyof Song]) => {
    if (!editedSong) return;
    setEditedSong({ ...editedSong, [field]: value });
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Metadata extraction logic is inherently complex
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    addLog(
      `> Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    );

    try {
      addLog("> Extracting metadata from file...");
      const metadata = await mm.parseBlob(file);
      const { common, format } = metadata;

      const updatedFormData = { ...formData };
      if (common.title) updatedFormData.title = common.title;
      if (common.artist) updatedFormData.artist = common.artist;
      if (common.album) updatedFormData.album = common.album;
      if (format.duration)
        updatedFormData.duration = Math.floor(format.duration);

      setFormData(updatedFormData);
      addLog(
        `> Metadata extracted: ${common.title || "Unknown"} - ${common.artist || "Unknown"}`,
      );
    } catch (error) {
      addLog(
        `> Warning: Could not extract metadata from file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleFetchLyrics = async () => {
    if (!neteaseUrl) {
      addLog("> Error: Please enter a NetEase Music URL");
      return;
    }

    setIsFetchingLyrics(true);
    addLog("> Fetching lyrics from NetEase Music...");

    try {
      const data = await fetchLyricsFromAdmin(neteaseUrl);
      const updatedLyrics = normalizeLyricsWorkflow(data.lyrics);
      const updatedFormData = mergeFetchedSongInfo(
        { ...formData, lyrics: updatedLyrics },
        data.songInfo,
      );

      setFormData(updatedFormData);
      addLog(
        `> Successfully fetched lyrics and metadata for song ID: ${data.songId}`,
      );
      addLog(
        `> Lyrics loaded (${describeLyrics(updatedLyrics).lineCount} lines)`,
      );
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsFetchingLyrics(false);
    }
  };

  const handleFetchLyricsEdit = async () => {
    if (!(neteaseUrlEdit && editedSong)) {
      addLog(
        `> Error: ${!neteaseUrlEdit ? "Please enter a NetEase Music URL" : "No song is being edited"}`,
      );
      return;
    }

    setIsFetchingLyricsEdit(true);
    addLog("> Fetching lyrics from NetEase Music...");

    try {
      const data = await fetchLyricsFromAdmin(neteaseUrlEdit);
      const updatedLyrics = normalizeLyricsWorkflow(data.lyrics);
      const nextEditedSong = mergeFetchedSongInfo(
        { ...editedSong, lyrics: updatedLyrics },
        data.songInfo,
      );
      setEditedSong(nextEditedSong);

      addLog(
        `> Successfully fetched lyrics and metadata for song ID: ${data.songId}`,
      );
      addLog(
        `> Lyrics loaded (${describeLyrics(updatedLyrics).lineCount} lines)`,
      );
      setNeteaseUrlEdit(""); // Clear URL after successful fetch
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsFetchingLyricsEdit(false);
    }
  };

  const handleNormalizeLyrics = () => {
    const normalizedLyrics = normalizeLyricsWorkflow(formData.lyrics || "");
    setFormData({ ...formData, lyrics: normalizedLyrics });
    addLog("> Lyrics normalized");
  };

  const handleConvertLyricsToLrc = () => {
    const duration = formData.duration || 0;
    if (duration <= 0) {
      addLog("> Error: Duration is required to convert plain lyrics to LRC");
      return;
    }

    const convertedLyrics = convertPlainLyricsWorkflow(
      formData.lyrics || "",
      duration,
    );
    setFormData({ ...formData, lyrics: convertedLyrics });
    addLog("> Plain lyrics converted to estimated LRC");
  };

  const handleNormalizeEditedLyrics = () => {
    if (!editedSong) return;

    updateEditedSong(
      "lyrics",
      normalizeLyricsWorkflow(editedSong.lyrics || ""),
    );
    addLog("> Edited lyrics normalized");
  };

  const handleConvertEditedLyricsToLrc = () => {
    if (!editedSong) return;
    if (editedSong.duration <= 0) {
      addLog("> Error: Duration is required to convert plain lyrics to LRC");
      return;
    }

    updateEditedSong(
      "lyrics",
      convertPlainLyricsWorkflow(editedSong.lyrics || "", editedSong.duration),
    );
    addLog("> Edited plain lyrics converted to estimated LRC");
  };

  const resetUploadForm = () => {
    setFormData(createEmptySongDraft());
    setAudioFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeploy = async () => {
    if (!audioFile) {
      addLog("> Error: No audio file selected");
      return;
    }

    if (!(formData.title && formData.artist && formData.album)) {
      addLog("> Error: Please fill in title, artist, and album");
      return;
    }

    setIsDeploying(true);
    clearLogs();

    try {
      addLog("> Authenticating...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newSong = await persistSongAssetToLibrary({
        addLog,
        assetKind: formData.sourceType === "recording" ? "recording" : "audio",
        file: audioFile,
        formData,
      });

      addLog("> Deployment successful!");
      addLog(`> New track: ${newSong.title} by ${newSong.artist}`);

      resetUploadForm();

      if (activeTab === "edit") {
        loadPlaylist();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`> Error: ${errorMessage}`);
      addLog("> Deployment failed");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleUseRecordingAsUploadSource = (
    recordedFile: File,
    durationSeconds: number,
  ) => {
    setAudioFile(recordedFile);
    setFormData({
      ...formData,
      duration: durationSeconds,
      sourceType: "recording",
    });
    setActiveTab("upload");
  };

  const handleSaveRecordingToLibrary = async (
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
      loadPlaylist();
    }
  };

  const uploadLyricsDescriptor = describeLyrics(formData.lyrics || "");
  const editedLyricsDescriptor = describeLyrics(editedSong?.lyrics || "");

  const handleLogout = async () => {
    setIsSigningOut(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[var(--editor-bg)] font-mono text-[12px] supports-[height:100dvh]:h-[100dvh]">
      <AdminPageChrome
        activeTab={activeTab}
        currentTime={currentTime}
        isSigningOut={isSigningOut}
        onLogout={handleLogout}
        onTabChange={setActiveTab}
      />

      {/* Main Content - Full width + collapsible terminal tray */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden bg-[var(--editor-bg)]">
          {activeTab === "upload" ? (
            <UploadForm
              formData={formData}
              setFormData={setFormData}
              audioFile={audioFile}
              neteaseUrl={neteaseUrl}
              setNeteaseUrl={setNeteaseUrl}
              isFetchingLyrics={isFetchingLyrics}
              isDeploying={isDeploying}
              lyricsFormat={uploadLyricsDescriptor.format}
              lyricLineCount={uploadLyricsDescriptor.lineCount}
              fileInputRef={fileInputRef}
              handleConvertLyricsToLrc={handleConvertLyricsToLrc}
              handleFileSelect={handleFileSelect}
              handleFetchLyrics={handleFetchLyrics}
              handleDeploy={handleDeploy}
              handleNormalizeLyrics={handleNormalizeLyrics}
            />
          ) : activeTab === "record" ? (
            <AdminRecordingWorkspace
              addLog={addLog}
              onSaveRecordedFile={handleSaveRecordingToLibrary}
              onUseRecordedFile={handleUseRecordingAsUploadSource}
            />
          ) : (
            <EditPlaylist
              playlist={playlist}
              isLoadingPlaylist={isLoadingPlaylist}
              isSavingPlaylist={isSavingPlaylist}
              editingSongId={editingSongId}
              editedSong={editedSong}
              handleEditSong={handleEditSong}
              handleCancelEdit={handleCancelEdit}
              handleSaveEdit={handleSaveEdit}
              handleDeleteSong={handleDeleteSong}
              handleSavePlaylist={handleSavePlaylist}
              handleConvertEditedLyricsToLrc={handleConvertEditedLyricsToLrc}
              handleNormalizeEditedLyrics={handleNormalizeEditedLyrics}
              updateEditedSong={updateEditedSong}
              neteaseUrlEdit={neteaseUrlEdit}
              setNeteaseUrlEdit={setNeteaseUrlEdit}
              isFetchingLyricsEdit={isFetchingLyricsEdit}
              handleFetchLyricsEdit={handleFetchLyricsEdit}
              editedLyricFormat={editedLyricsDescriptor.format}
              editedLyricLineCount={editedLyricsDescriptor.lineCount}
            />
          )}
        </div>

        {/* Terminal tray — collapsed by default, auto-opens on new logs */}
        <TerminalOutput
          logs={logs}
          isBusy={isDeploying}
          isExpanded={isTerminalOpen}
          onToggle={() => setIsTerminalOpen((open) => !open)}
        />
      </div>
    </div>
  );
}
