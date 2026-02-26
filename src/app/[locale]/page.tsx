import { CodeEditor } from "@/components/ide/CodeEditor";
import { EditorTabs } from "@/components/ide/EditorTabs";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { InspectorPanel } from "@/components/ide/InspectorPanel";
import { TerminalPanel } from "@/components/ide/TerminalPanel";
import { IDEFrame } from "@/components/layout/IDEFrame";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <IDEFrame
      leftSidebar={<FileExplorer />}
      centerEditor={
        <div className="flex h-full flex-col overflow-hidden">
          <EditorTabs />
          <div className="flex-1 min-h-0">
            <CodeEditor className="h-full" />
          </div>
        </div>
      }
      compactCenterEditor={
        <div className="flex h-full flex-col overflow-hidden">
          <CodeEditor className="h-full" />
        </div>
      }
      rightInspector={<InspectorPanel />}
      bottomTerminal={<TerminalPanel />}
    />
  );
}
