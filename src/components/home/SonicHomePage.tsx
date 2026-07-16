import { CodeEditor } from "@/components/ide/CodeEditor";
import { ExplorerWorkspace } from "@/components/ide/ExplorerWorkspace";
import { InspectorPanel } from "@/components/ide/InspectorPanel";
import { PlaybackSequenceStrip } from "@/components/ide/PlaybackSequenceStrip";
import { TerminalPanel } from "@/components/ide/TerminalPanel";
import { IDEFrame } from "@/components/layout/IDEFrame";
import { getPublicPlaylist } from "@/lib/public-playlist.server";
import { IDEStoreProvider } from "@/store/useIDEStore";
import type { Song } from "@/types/music";

export async function SonicHomePage() {
  let initialSongs: Song[] | null = null;

  try {
    initialSongs = await getPublicPlaylist();
  } catch (error) {
    console.error("Failed to load the initial public playlist:", error);
  }

  return (
    <IDEStoreProvider initialSongs={initialSongs}>
      <IDEFrame
        leftSidebar={<ExplorerWorkspace />}
        mobileLeftSidebar={<ExplorerWorkspace />}
        centerEditor={
          <div className="flex h-full flex-col overflow-hidden">
            <PlaybackSequenceStrip />
            <div className="flex-1 min-h-0">
              <CodeEditor className="h-full" />
            </div>
          </div>
        }
        compactCenterEditor={
          <div className="flex h-full flex-col overflow-hidden">
            <PlaybackSequenceStrip />
            <CodeEditor className="h-full" />
          </div>
        }
        rightInspector={<InspectorPanel />}
        bottomTerminal={<TerminalPanel />}
      />
    </IDEStoreProvider>
  );
}
