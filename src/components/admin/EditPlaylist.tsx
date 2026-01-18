"use client";

import { Edit2, Loader2, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Song } from "@/types/music";

type EditPlaylistProps = {
  playlist: Song[];
  isLoadingPlaylist: boolean;
  isSavingPlaylist: boolean;
  editingSongId: string | null;
  editedSong: Song | null;
  handleEditSong: (song: Song) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => void;
  handleDeleteSong: (songId: string) => void;
  handleSavePlaylist: () => void;
  updateEditedSong: (field: keyof Song, value: Song[keyof Song]) => void;
};

export function EditPlaylist({
  playlist,
  isLoadingPlaylist,
  isSavingPlaylist,
  editingSongId,
  editedSong,
  handleEditSong,
  handleCancelEdit,
  handleSaveEdit,
  handleDeleteSong,
  handleSavePlaylist,
  updateEditedSong,
}: EditPlaylistProps) {
  return (
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
          <div className="text-gray-500 text-[11px]">Loading playlist...</div>
        ) : playlist.length === 0 ? (
          <div className="text-gray-500 text-[11px]">No songs in playlist</div>
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
                      <Label className="text-[10px] text-gray-500">Title</Label>
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
                      <Label className="text-[10px] text-gray-500">Album</Label>
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
                              parseInt(e.target.value, 10) || 0,
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
                            {String(song.duration % 60).padStart(2, "0")}
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
  );
}
