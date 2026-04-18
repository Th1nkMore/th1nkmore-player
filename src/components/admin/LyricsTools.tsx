"use client";

import { FileText, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type LyricsToolsProps = {
  format: "lrc" | "plain" | "empty";
  lineCount: number;
  canConvert: boolean;
  onConvert: () => void;
  onNormalize: () => void;
};

export function LyricsTools({
  format,
  lineCount,
  canConvert,
  onConvert,
  onNormalize,
}: LyricsToolsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-mono">
        <span>format:{format}</span>
        <span>lines:{lineCount}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={onNormalize}
          variant="outline"
          size="sm"
          className="font-mono text-[10px] h-6 px-2"
        >
          <Wand2 className="h-2.5 w-2.5" />
          Normalize
        </Button>
        <Button
          type="button"
          onClick={onConvert}
          disabled={!canConvert}
          variant="outline"
          size="sm"
          className="font-mono text-[10px] h-6 px-2"
        >
          <FileText className="h-2.5 w-2.5" />
          Plain To LRC
        </Button>
      </div>
    </div>
  );
}
