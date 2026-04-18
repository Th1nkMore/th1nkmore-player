"use client";

import * as mm from "music-metadata-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditPlaylist } from "@/components/admin/EditPlaylist";
import { TerminalOutput } from "@/components/admin/TerminalOutput";
import { UploadForm } from "@/components/admin/UploadForm";
import { createSongFromFormData } from "@/lib/admin-utils";
import { useAdminLogs } from "@/lib/hooks/useAdminLogs";
import {
  createEmptySongDraft,
  normalizePlaylistSongs,
  normalizeSong,
} from "@/lib/song";
import { normalizeLanguage } from "@/lib/utils";
import type { Song } from "@/types/music";

type Tab = "upload" | "edit";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editedSong, setEditedSong] = useState<Song | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);

  const [formData, setFormData] = useState<Partial<Song>>(createEmptySongDraft);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const { logs, addLog, clearLogs } = useAdminLogs();
  const [isDeploying, setIsDeploying] = useState(false);
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
      const response = await fetch("/api/admin/playlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playlist),
      });

      if (!response.ok) {
        throw new Error("Failed to save playlist");
      }

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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: API fetching and form updating involves multiple steps
  const handleFetchLyrics = async () => {
    if (!neteaseUrl) {
      addLog("> Error: Please enter a NetEase Music URL");
      return;
    }

    setIsFetchingLyrics(true);
    addLog("> Fetching lyrics from NetEase Music...");

    try {
      const response = await fetch("/api/admin/fetch-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: neteaseUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch lyrics");
      }

      const data = await response.json();
      const updatedFormData = { ...formData, lyrics: data.lyrics };

      if (data.songInfo) {
        const { title, artist, album, duration } = data.songInfo;
        if (title) updatedFormData.title = title;
        if (artist) updatedFormData.artist = artist;
        if (album) updatedFormData.album = album;
        if (duration) updatedFormData.duration = duration;
      }

      setFormData(updatedFormData);
      addLog(
        `> Successfully fetched lyrics and metadata for song ID: ${data.songId}`,
      );
      addLog(`> Lyrics loaded (${data.lyrics.split("\n").length} lines)`);
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsFetchingLyrics(false);
    }
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: API fetching and form updating involves multiple steps
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
      const response = await fetch("/api/admin/fetch-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: neteaseUrlEdit }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch lyrics");
      }

      const data = await response.json();
      updateEditedSong("lyrics", data.lyrics);

      if (data.songInfo) {
        const { title, artist, album, duration } = data.songInfo;
        if (title) updateEditedSong("title", title);
        if (artist) updateEditedSong("artist", artist);
        if (album) updateEditedSong("album", album);
        if (duration) updateEditedSong("duration", duration);
      }

      addLog(
        `> Successfully fetched lyrics and metadata for song ID: ${data.songId}`,
      );
      addLog(`> Lyrics loaded (${data.lyrics.split("\n").length} lines)`);
      setNeteaseUrlEdit(""); // Clear URL after successful fetch
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsFetchingLyricsEdit(false);
    }
  };

  const uploadFileToR2 = async (file: File) => {
    addLog("> Requesting upload URL...");
    const signUrlResponse = await fetch("/api/admin/sign-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "audio/mpeg",
      }),
    });

    if (!signUrlResponse.ok) {
      const error = await signUrlResponse.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { uploadUrl, publicUrl, key } = await signUrlResponse.json();
    addLog(`> Upload URL generated: ${key}`);

    addLog("> Uploading audio binary...");
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "audio/mpeg",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to R2");
    }

    addLog("> Upload complete");
    return publicUrl;
  };

  const updatePlaylistWithNewSong = async (
    newSong: Song,
    currentPlaylist?: Song[],
  ) => {
    let playlistToUpdate = currentPlaylist;
    if (!playlistToUpdate) {
      addLog("> Fetching current manifest...");
      const playlistResponse = await fetch("/api/admin/playlist");
      if (!playlistResponse.ok) {
        throw new Error("Failed to fetch playlist");
      }
      playlistToUpdate = await playlistResponse.json();
    }

    const songs = playlistToUpdate ?? [];
    const normalizedPlaylist = normalizePlaylistSongs(
      songs.map((song) => ({
        ...song,
        language: normalizeLanguage(song.language),
      })),
    );
    addLog(`> Found ${normalizedPlaylist.length} existing tracks`);

    const updatedPlaylist = [...normalizedPlaylist, newSong];
    addLog("> Updating manifest...");

    const updateResponse = await fetch("/api/admin/playlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPlaylist),
    });

    if (!updateResponse.ok) {
      throw new Error("Failed to update playlist");
    }

    addLog("> Manifest updated successfully");
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

    const { title, artist, album } = formData;

    setIsDeploying(true);
    clearLogs();

    try {
      addLog("> Authenticating...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const publicUrl = await uploadFileToR2(audioFile);
      const currentPlaylistResponse = await fetch("/api/admin/playlist");
      if (!currentPlaylistResponse.ok) {
        throw new Error("Failed to fetch playlist");
      }
      const currentPlaylist: Song[] = await currentPlaylistResponse.json();
      const newSong = createSongFromFormData(
        title,
        artist,
        album,
        publicUrl,
        currentPlaylist,
        formData,
      );
      await updatePlaylistWithNewSong(newSong, currentPlaylist);

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

  return (
    <div className="flex h-screen w-full flex-col bg-[var(--editor-bg)] font-mono text-[12px] supports-[height:100dvh]:h-[100dvh]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--sidebar-bg)] px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            ADMIN :: DEPLOY CONFIGURATION
          </h1>
          <div className="text-[10px] text-gray-500">
            {currentTime || "--:--:--"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border)] bg-[var(--sidebar-bg)] px-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === "upload"
                ? "text-gray-300 border-b-2 border-gray-400"
                : "text-gray-500 hover:text-gray-400"
            }`}
          >
            Upload New
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === "edit"
                ? "text-gray-300 border-b-2 border-gray-400"
                : "text-gray-500 hover:text-gray-400"
            }`}
          >
            Edit Playlist
          </button>
        </div>
      </div>

      {/* Main Content - Two Column Grid */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* Left Column */}
        <div className="flex flex-col border-r border-[var(--border)] bg-[var(--editor-bg)] overflow-hidden">
          {activeTab === "upload" ? (
            <UploadForm
              formData={formData}
              setFormData={setFormData}
              audioFile={audioFile}
              neteaseUrl={neteaseUrl}
              setNeteaseUrl={setNeteaseUrl}
              isFetchingLyrics={isFetchingLyrics}
              isDeploying={isDeploying}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              handleFetchLyrics={handleFetchLyrics}
              handleDeploy={handleDeploy}
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
              updateEditedSong={updateEditedSong}
              neteaseUrlEdit={neteaseUrlEdit}
              setNeteaseUrlEdit={setNeteaseUrlEdit}
              isFetchingLyricsEdit={isFetchingLyricsEdit}
              handleFetchLyricsEdit={handleFetchLyricsEdit}
            />
          )}
        </div>

        {/* Right Column - Terminal Output */}
        <TerminalOutput logs={logs} isDeploying={isDeploying} />
      </div>
    </div>
  );
}
