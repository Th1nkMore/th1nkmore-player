"use client";

import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type CodeEditorProps = {
  className?: string;
};

export function CodeEditor({ className }: CodeEditorProps) {
  const t = useTranslations("codeEditor");

  const mockLines: string[] = [];

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      <div className="flex items-center border-b border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
        <span className="rounded bg-muted/60 px-2 py-0.5 font-mono text-[11px]">
          {t("filePath")}
        </span>
      </div>
      <ScrollArea className="h-full">
        <div className="flex font-mono text-[11px] leading-relaxed">
          <div className="select-none border-r border-border/40 bg-muted/40 px-3 py-2 text-right text-muted-foreground/80">
            {mockLines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre className="flex-1 px-4 py-2 text-xs">
            {mockLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </pre>
        </div>
      </ScrollArea>
    </div>
  );
}
