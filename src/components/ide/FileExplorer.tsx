"use client";

import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileAudio,
  Folder,
  Info,
  Play,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { RuntimeQueue } from "./RuntimeQueue";

type FileExplorerProps = {
  className?: string;
  onFileClick?: () => void;
};

type GroupedSongs = {
  [album: string]: Array<{ id: string; title: string; album: string }>;
};

export function FileExplorer({ className, onFileClick }: FileExplorerProps) {
  const { files, activeFileId, openFile, getFileById } = useIDEStore();
  const { setTrack, play, addToQueue } = usePlayerStore();
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [isRepoOpen, setIsRepoOpen] = useState(true);
  const clickTimerRef = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  const t = useTranslations("fileExplorer");

  const groupedSongs = useMemo(() => {
    const grouped: GroupedSongs = {};
    files.forEach((song) => {
      if (!grouped[song.album]) {
        grouped[song.album] = [];
      }
      grouped[song.album].push({
        id: song.id,
        title: song.title,
        album: song.album,
      });
    });
    return grouped;
  }, [files]);

  const handleFileClick = (fileId: string) => {
    // Clear any existing timer for this file
    if (clickTimerRef.current[fileId]) {
      clearTimeout(clickTimerRef.current[fileId]);
      clickTimerRef.current[fileId] = null;
    }

    // Set a timer for single click - delay allows double click to cancel it
    clickTimerRef.current[fileId] = setTimeout(() => {
      // Single click: Only open/preview the file
      // Inspector and CodeEditor will update automatically via activeFileId
      openFile(fileId);
      onFileClick?.();
      clickTimerRef.current[fileId] = null;
    }, 300); // 300ms delay to detect double click
  };

  const handleFileDoubleClick = (fileId: string) => {
    const song = getFileById(fileId);
    if (!song) return;

    // Cancel the single click timer
    if (clickTimerRef.current[fileId]) {
      clearTimeout(clickTimerRef.current[fileId]);
      clickTimerRef.current[fileId] = null;
    }

    // Double click: Only add to queue/playlist - do NOT open, set track, or play
    addToQueue(song);
  };

  const handlePlay = (fileId: string) => {
    const song = getFileById(fileId);
    if (!song) return;

    openFile(fileId);
    addToQueue(song);
    setTrack(fileId);
    setTimeout(() => play(song), 100);
    onFileClick?.();
  };

  const handleAddToQueue = (fileId: string) => {
    const song = getFileById(fileId);
    if (!song) return;
    addToQueue(song);
  };

  const handleCopyLink = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    navigator.clipboard.writeText(file.audioUrl).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = file.audioUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    });
  };

  const handleProperties = (fileId: string) => {
    openFile(fileId);
    onFileClick?.();
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[var(--sidebar-bg)] text-gray-300",
        className,
      )}
    >
      <div className="border-b border-[var(--border)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-[var(--sidebar-bg)]">
        {t("title").toUpperCase()}
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* Runtime Queue Section */}
          <Collapsible open={isQueueOpen} onOpenChange={setIsQueueOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-800/30 transition-colors">
              {isQueueOpen ? (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{t("runtimeQueue")}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <RuntimeQueue />
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          {/* TH1NKMORE_REPO Section */}
          <Collapsible open={isRepoOpen} onOpenChange={setIsRepoOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-800/30 transition-colors">
              {isRepoOpen ? (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{t("repoName")}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div>
                {Object.entries(groupedSongs).map(([album, songs]) => (
                  <div key={album}>
                    {/* Album/Folder */}
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-gray-400">
                      <Folder
                        className="h-3 w-3 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">{album}</span>
                    </div>
                    {/* Files in Album */}
                    <div>
                      {songs.map((song) => {
                        const isActive = song.id === activeFileId;
                        return (
                          <ContextMenu key={song.id}>
                            <ContextMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleFileClick(song.id)}
                                onDoubleClick={() =>
                                  handleFileDoubleClick(song.id)
                                }
                                className={cn(
                                  "flex w-full items-center gap-1.5 px-2 py-1 text-[11px] text-gray-400 hover:bg-gray-800/50 cursor-pointer transition-colors",
                                  isActive && "bg-gray-800/70 text-gray-200",
                                )}
                                style={{ paddingLeft: "24px" }}
                                aria-label={`Open ${song.title}. Double click to add to queue.`}
                              >
                                <FileAudio
                                  className="h-3 w-3 flex-shrink-0"
                                  aria-hidden="true"
                                />
                                <span className="truncate">{song.title}</span>
                              </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300">
                              <ContextMenuItem
                                onClick={() => handlePlay(song.id)}
                                className="cursor-pointer hover:bg-gray-800/50"
                              >
                                <Play className="h-3 w-3 mr-2" />
                                {t("play")}
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() => handleAddToQueue(song.id)}
                                className="cursor-pointer hover:bg-gray-800/50"
                              >
                                <Plus className="h-3 w-3 mr-2" />
                                {t("addToQueue")}
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() => handleCopyLink(song.id)}
                                className="cursor-pointer hover:bg-gray-800/50"
                              >
                                <Copy className="h-3 w-3 mr-2" />
                                {t("copyLink")}
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() => handleProperties(song.id)}
                                className="cursor-pointer hover:bg-gray-800/50"
                              >
                                <Info className="h-3 w-3 mr-2" />
                                {t("properties")}
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
