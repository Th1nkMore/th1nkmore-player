"use client";

import { Edit2, Loader2, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Song } from "@/types/music";

type SongItemProps = {
  song: Song;
  isEditing: boolean;
  editedSong: Song | null;
  neteaseUrlEdit: string;
  setNeteaseUrlEdit: (url: string) => void;
  isFetchingLyricsEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (field: keyof Song, value: Song[keyof Song]) => void;
  onFetchLyrics: () => void;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Admin song editing intentionally groups many controls in one item card
function SongItem({
  song,
  isEditing,
  editedSong,
  neteaseUrlEdit,
  setNeteaseUrlEdit,
  isFetchingLyricsEdit,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onUpdate,
  onFetchLyrics,
}: SongItemProps) {
  if (isEditing) {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-[10px] text-gray-500">Title</Label>
          <Input
            value={editedSong?.title || ""}
            onChange={(e) => onUpdate("title", e.target.value)}
            className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-7"
          />
        </div>
        <div>
          <Label className="text-[10px] text-gray-500">Artist</Label>
          <Input
            value={editedSong?.artist || ""}
            onChange={(e) => onUpdate("artist", e.target.value)}
            className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-7"
          />
        </div>
        <div>
          <Label className="text-[10px] text-gray-500">Album</Label>
          <Input
            value={editedSong?.album || ""}
            onChange={(e) => onUpdate("album", e.target.value)}
            className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-7"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-gray-500">Duration (s)</Label>
            <Input
              type="number"
              value={editedSong?.duration || 0}
              onChange={(e) =>
                onUpdate("duration", parseInt(e.target.value, 10) || 0)
              }
              className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-7"
            />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500">Language</Label>
            <select
              value={editedSong?.language || "en"}
              onChange={(e) =>
                onUpdate("language", e.target.value as Song["language"])
              }
              className="flex h-7 w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-2 text-[11px] text-gray-300 font-mono"
            >
              <option value="en">en</option>
              <option value="zh">zh</option>
              <option value="ja">ja</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="text-[10px] text-gray-500">Track Type</Label>
          <select
            value={editedSong?.trackType || "portfolio"}
            onChange={(e) =>
              onUpdate("trackType", e.target.value as Song["trackType"])
            }
            className="flex h-7 w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-2 text-[11px] text-gray-300 font-mono"
          >
            <option value="portfolio">portfolio</option>
            <option value="personal">personal</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div>
            <Label className="text-[10px] text-gray-500">Source Type</Label>
            <select
              value={editedSong?.sourceType || "upload"}
              onChange={(e) =>
                onUpdate("sourceType", e.target.value as Song["sourceType"])
              }
              className="flex h-7 w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-2 text-[11px] text-gray-300 font-mono"
            >
              <option value="upload">upload</option>
              <option value="external-upload">external-upload</option>
              <option value="recording">recording</option>
            </select>
          </div>
          <div>
            <Label className="text-[10px] text-gray-500">Visibility</Label>
            <select
              value={editedSong?.visibility || "public"}
              onChange={(e) =>
                onUpdate("visibility", e.target.value as Song["visibility"])
              }
              className="flex h-7 w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-2 text-[11px] text-gray-300 font-mono"
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="unlisted">unlisted</option>
            </select>
          </div>
          <div>
            <Label className="text-[10px] text-gray-500">Asset Status</Label>
            <select
              value={editedSong?.assetStatus || "ready"}
              onChange={(e) =>
                onUpdate("assetStatus", e.target.value as Song["assetStatus"])
              }
              className="flex h-7 w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-2 text-[11px] text-gray-300 font-mono"
            >
              <option value="ready">ready</option>
              <option value="draft">draft</option>
              <option value="archived">archived</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="text-[10px] text-gray-500">Lyrics (LRC)</Label>
          <div className="mb-2">
            <Label className="text-[9px] text-gray-600 mb-1 block">
              Fetch from NetEase Music:
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={neteaseUrlEdit}
                onChange={(e) => setNeteaseUrlEdit(e.target.value)}
                placeholder="https://music.163.com/#/song?id=..."
                className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[10px] h-6 flex-1"
              />
              <Button
                type="button"
                onClick={onFetchLyrics}
                disabled={isFetchingLyricsEdit}
                variant="outline"
                size="sm"
                className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 hover:bg-gray-800/50 text-[10px] h-6 px-2"
              >
                {isFetchingLyricsEdit ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  "Fetch"
                )}
              </Button>
            </div>
          </div>
          <textarea
            value={editedSong?.lyrics || ""}
            onChange={(e) => onUpdate("lyrics", e.target.value)}
            rows={4}
            className="flex w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-2 py-1 text-[11px] text-gray-300 font-mono resize-none"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSave}
            className="font-mono bg-green-600 hover:bg-green-700 text-white text-[11px] h-7"
          >
            <Save className="h-3 w-3" />
            Save
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="font-mono text-[11px] h-7"
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
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
          <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-gray-500 font-mono">
            <span>type:{song.trackType || "portfolio"}</span>
            <span>source:{song.sourceType || "upload"}</span>
            <span>visibility:{song.visibility || "public"}</span>
            <span>status:{song.assetStatus || "ready"}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            onClick={onEdit}
            variant="ghost"
            size="icon-sm"
            className="text-gray-400 hover:text-gray-300"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            onClick={onDelete}
            variant="ghost"
            size="icon-sm"
            className="text-gray-400 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="text-[10px] text-gray-600 font-mono break-all mb-2">
        {song.audioUrl}
      </div>
      <div className="mt-2 p-2 rounded-md bg-[var(--editor-bg)] border border-[var(--border)]">
        {/* biome-ignore lint/a11y/useMediaCaption: Music preview doesn't need captions */}
        <audio controls src={song.audioUrl} className="w-full h-8" />
      </div>
    </div>
  );
}

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
  neteaseUrlEdit: string;
  setNeteaseUrlEdit: (url: string) => void;
  isFetchingLyricsEdit: boolean;
  handleFetchLyricsEdit: () => void;
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
  neteaseUrlEdit,
  setNeteaseUrlEdit,
  isFetchingLyricsEdit,
  handleFetchLyricsEdit,
}: EditPlaylistProps) {
  return (
    <ScrollArea className="flex-1 h-full">
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
                <SongItem
                  song={song}
                  isEditing={editingSongId === song.id}
                  editedSong={editedSong}
                  neteaseUrlEdit={neteaseUrlEdit}
                  setNeteaseUrlEdit={setNeteaseUrlEdit}
                  isFetchingLyricsEdit={isFetchingLyricsEdit}
                  onEdit={() => handleEditSong(song)}
                  onDelete={() => handleDeleteSong(song.id)}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  onUpdate={updateEditedSong}
                  onFetchLyrics={handleFetchLyricsEdit}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
