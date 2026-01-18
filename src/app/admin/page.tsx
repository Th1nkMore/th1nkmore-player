"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditPlaylist } from "@/components/admin/EditPlaylist";
import { UploadForm } from "@/components/admin/UploadForm";
import type { Song } from "@/types/music";

type LogEntry = {
  id: string;
  message: string;
  timestamp: Date;
};

type Tab = "upload" | "edit";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editedSong, setEditedSong] = useState<Song | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);

  const [formData, setFormData] = useState<Partial<Song>>({
    title: "",
    artist: "",
    album: "",
    duration: 0,
    lyrics: "",
    language: "en",
    metadata: {},
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [neteaseUrl, setNeteaseUrl] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const logCounterRef = useRef(0);
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

  const addLog = useCallback((message: string) => {
    logCounterRef.current += 1;
    const entry: LogEntry = {
      id: `${Date.now()}-${logCounterRef.current}`,
      message,
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  const loadPlaylist = useCallback(async () => {
    setIsLoadingPlaylist(true);
    try {
      const response = await fetch("/api/admin/playlist");
      if (response.ok) {
        const data = await response.json();
        setPlaylist(data);
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
    setEditedSong({ ...song });
  };

  const handleCancelEdit = () => {
    setEditingSongId(null);
    setEditedSong(null);
  };

  const handleSaveEdit = () => {
    if (!editedSong) return;

    const updatedPlaylist = playlist.map((song) =>
      song.id === editedSong.id ? editedSong : song,
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
    setLogs([]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      addLog(
        `> Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
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
      setFormData({ ...formData, lyrics: data.lyrics });
      addLog(`> Successfully fetched lyrics for song ID: ${data.songId}`);
      addLog(`> Lyrics loaded (${data.lyrics.split("\n").length} lines)`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`> Error: ${errorMessage}`);
    } finally {
      setIsFetchingLyrics(false);
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

  const updatePlaylistWithNewSong = async (newSong: Song) => {
    addLog("> Fetching current manifest...");
    const playlistResponse = await fetch("/api/admin/playlist");
    if (!playlistResponse.ok) {
      throw new Error("Failed to fetch playlist");
    }

    const currentPlaylist: Song[] = await playlistResponse.json();
    addLog(`> Found ${currentPlaylist.length} existing tracks`);

    const updatedPlaylist = [...currentPlaylist, newSong];
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

  const createSongFromFormData = (
    title: string,
    artist: string,
    album: string,
    publicUrl: string,
  ): Song => {
    return {
      id:
        `${artist?.toLowerCase().replace(/\s+/g, "-")}-${title?.toLowerCase().replace(/\s+/g, "-")}` ||
        `song-${Date.now()}`,
      title: title || "",
      artist: artist || "",
      album: album || "",
      duration: formData.duration || 0,
      lyrics: formData.lyrics || "",
      audioUrl: publicUrl,
      metadata: formData.metadata || {},
      language: (formData.language as Song["language"]) || "en",
    };
  };

  const resetUploadForm = () => {
    setFormData({
      title: "",
      artist: "",
      album: "",
      duration: 0,
      lyrics: "",
      language: "en",
      metadata: {},
    });
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
    setLogs([]);

    try {
      addLog("> Authenticating...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const publicUrl = await uploadFileToR2(audioFile);
      const newSong = createSongFromFormData(title, artist, album, publicUrl);
      await updatePlaylistWithNewSong(newSong);

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
    <div className="flex h-screen w-full flex-col bg-[var(--editor-bg)] font-mono text-[12px]">
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
            />
          )}
        </div>

        {/* Right Column - Terminal Output */}
        <div className="flex flex-col bg-black overflow-hidden">
          <div className="border-b border-gray-800 px-4 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              TERMINAL OUTPUT
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px]">
            {logs.length === 0 ? (
              <div className="text-gray-600">
                {"> Waiting for deployment..."}
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="text-gray-400">
                  <span className="text-gray-600">
                    {log.timestamp.toLocaleTimeString()}
                  </span>{" "}
                  {log.message}
                </div>
              ))
            )}
            {isDeploying && (
              <div className="text-gray-500 animate-pulse">
                {"> Processing..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
