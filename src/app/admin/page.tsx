"use client";

import { Edit2, Loader2, Play, Save, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const addLog = (message: string) => {
    logCounterRef.current += 1;
    const entry: LogEntry = {
      id: `${Date.now()}-${logCounterRef.current}`,
      message,
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, entry]);
  };

  // Load playlist when edit tab is active
  useEffect(() => {
    if (activeTab === "edit") {
      loadPlaylist();
    }
  }, [activeTab]);

  const loadPlaylist = async () => {
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
  };

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

  const updateEditedSong = (field: keyof Song, value: any) => {
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
    setLogs([]);

    try {
      // Step 1: Authenticate
      addLog("> Authenticating...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2: Request signed URL
      addLog("> Requesting upload URL...");
      const signUrlResponse = await fetch("/api/admin/sign-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: audioFile.name,
          contentType: audioFile.type || "audio/mpeg",
        }),
      });

      if (!signUrlResponse.ok) {
        const error = await signUrlResponse.json();
        throw new Error(error.error || "Failed to get upload URL");
      }

      const { uploadUrl, publicUrl, key } = await signUrlResponse.json();
      addLog(`> Upload URL generated: ${key}`);

      // Step 3: Upload file to R2
      addLog("> Uploading audio binary...");
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: audioFile,
        headers: {
          "Content-Type": audioFile.type || "audio/mpeg",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to R2");
      }

      addLog("> Upload complete");

      // Step 4: Fetch current playlist
      addLog("> Fetching current manifest...");
      const playlistResponse = await fetch("/api/admin/playlist");
      if (!playlistResponse.ok) {
        throw new Error("Failed to fetch playlist");
      }

      const currentPlaylist: Song[] = await playlistResponse.json();
      addLog(`> Found ${currentPlaylist.length} existing tracks`);

      // Step 5: Create new song object
      const newSong: Song = {
        id:
          `${formData.artist?.toLowerCase().replace(/\s+/g, "-")}-${formData.title?.toLowerCase().replace(/\s+/g, "-")}` ||
          `song-${Date.now()}`,
        title: formData.title!,
        artist: formData.artist!,
        album: formData.album!,
        duration: formData.duration || 0,
        lyrics: formData.lyrics || "",
        audioUrl: publicUrl,
        metadata: formData.metadata || {},
        language: (formData.language as Song["language"]) || "en",
      };

      // Step 6: Append to playlist
      const updatedPlaylist = [...currentPlaylist, newSong];
      addLog("> Updating manifest...");

      // Step 7: Save updated playlist
      const updateResponse = await fetch("/api/admin/playlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPlaylist),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update playlist");
      }

      addLog("> Manifest updated successfully");
      addLog("> Deployment successful!");
      addLog(`> New track: ${newSong.title} by ${newSong.artist}`);

      // Reset form
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

      // Reload playlist if on edit tab
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
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <div>
                  <Label
                    htmlFor="title"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                  >
                    title:
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300"
                    placeholder="Enter song title"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="artist"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                  >
                    artist:
                  </Label>
                  <Input
                    id="artist"
                    type="text"
                    value={formData.artist}
                    onChange={(e) =>
                      setFormData({ ...formData, artist: e.target.value })
                    }
                    className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300"
                    placeholder="Enter artist name"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="album"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                  >
                    album:
                  </Label>
                  <Input
                    id="album"
                    type="text"
                    value={formData.album}
                    onChange={(e) =>
                      setFormData({ ...formData, album: e.target.value })
                    }
                    className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300"
                    placeholder="Enter album name"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="duration"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                  >
                    duration (seconds):
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300"
                    placeholder="180"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="language"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                  >
                    language:
                  </Label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        language: e.target.value as Song["language"],
                      })
                    }
                    className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] px-3 py-1 text-[12px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600"
                  >
                    <option value="en">en</option>
                    <option value="zh">zh</option>
                    <option value="jp">jp</option>
                  </select>
                </div>

                <div>
                  <Label
                    htmlFor="lyrics"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                  >
                    lyrics (lrc format):
                  </Label>
                  <textarea
                    id="lyrics"
                    value={formData.lyrics}
                    onChange={(e) =>
                      setFormData({ ...formData, lyrics: e.target.value })
                    }
                    rows={6}
                    className="flex w-full rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] px-3 py-2 text-[12px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600 resize-none"
                    placeholder="[00:00.00]Line 1&#10;[00:05.00]Line 2"
                  />
                </div>

                <div>
                  <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    audio file:
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="audio-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300 hover:bg-gray-800/50 w-full justify-start"
                  >
                    <Upload className="h-3 w-3" />
                    {audioFile ? audioFile.name : "Select Source..."}
                  </Button>
                </div>

                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="font-mono bg-green-600 hover:bg-green-700 text-white w-full"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      Deploy Song
                    </>
                  )}
                </Button>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Playlist ({playlist.length} songs)
                  </h2>
                  <Button
                    onClick={handleSavePlaylist}
                    disabled={isSavingPlaylist}
                    className="font-mono bg-green-600 hover:bg-green-700 text-white text-[11px]"
                  >
                    {isSavingPlaylist ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>

                {isLoadingPlaylist ? (
                  <div className="text-gray-500 text-[11px]">
                    Loading playlist...
                  </div>
                ) : playlist.length === 0 ? (
                  <div className="text-gray-500 text-[11px]">
                    No songs in playlist
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlist.map((song) => (
                      <div
                        key={song.id}
                        className="border border-[var(--border)] bg-[var(--sidebar-bg)] rounded p-3"
                      >
                        {editingSongId === song.id ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[10px] text-gray-500">
                                Title
                              </Label>
                              <Input
                                value={editedSong?.title || ""}
                                onChange={(e) =>
                                  updateEditedSong("title", e.target.value)
                                }
                                className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-7"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-gray-500">
                                Artist
                              </Label>
                              <Input
                                value={editedSong?.artist || ""}
                                onChange={(e) =>
                                  updateEditedSong("artist", e.target.value)
                                }
                                className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-7"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-gray-500">
                                Album
                              </Label>
                              <Input
                                value={editedSong?.album || ""}
                                onChange={(e) =>
                                  updateEditedSong("album", e.target.value)
                                }
                                className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-7"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] text-gray-500">
                                  Duration (s)
                                </Label>
                                <Input
                                  type="number"
                                  value={editedSong?.duration || 0}
                                  onChange={(e) =>
                                    updateEditedSong(
                                      "duration",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-7"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-gray-500">
                                  Language
                                </Label>
                                <select
                                  value={editedSong?.language || "en"}
                                  onChange={(e) =>
                                    updateEditedSong(
                                      "language",
                                      e.target.value as Song["language"],
                                    )
                                  }
                                  className="flex h-7 w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-2 text-[11px] text-gray-300 font-mono"
                                >
                                  <option value="en">en</option>
                                  <option value="zh">zh</option>
                                  <option value="jp">jp</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] text-gray-500">
                                Lyrics (LRC)
                              </Label>
                              <textarea
                                value={editedSong?.lyrics || ""}
                                onChange={(e) =>
                                  updateEditedSong("lyrics", e.target.value)
                                }
                                rows={4}
                                className="flex w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-2 py-1 text-[11px] text-gray-300 font-mono resize-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveEdit}
                                className="font-mono bg-green-600 hover:bg-green-700 text-white text-[11px] h-7"
                              >
                                <Save className="h-3 w-3" />
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                variant="outline"
                                className="font-mono text-[11px] h-7"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="text-[12px] font-semibold text-gray-300">
                                  {song.title}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {song.artist} • {song.album}
                                </div>
                                {song.duration > 0 && (
                                  <div className="text-[10px] text-gray-600 mt-1">
                                    Duration: {Math.floor(song.duration / 60)}:
                                    {String(song.duration % 60).padStart(
                                      2,
                                      "0",
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => handleEditSong(song)}
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-gray-400 hover:text-gray-300"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteSong(song.id)}
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-gray-400 hover:text-red-400"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-600 font-mono break-all">
                              {song.audioUrl}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
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
