"use client";

import { ChevronUp } from "lucide-react";

type LogEntry = {
  id: string;
  message: string;
  timestamp: Date;
};

type TerminalOutputProps = {
  logs: LogEntry[];
  isBusy: boolean;
  isExpanded: boolean;
  onToggle: () => void;
};

export function TerminalOutput({
  logs,
  isBusy,
  isExpanded,
  onToggle,
}: TerminalOutputProps) {
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return (
    <div className="border-t border-gray-800 bg-black font-mono shrink-0">
      {/* Header bar — always visible at 32px */}
      <button
        type="button"
        className="flex h-8 w-full cursor-pointer select-none items-center justify-between px-4 hover:bg-gray-900"
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            TERMINAL
          </span>
          {!isExpanded && (
            <span className="truncate text-[10px] text-gray-600">
              {isBusy
                ? "> Processing..."
                : (lastLog?.message ?? "> Waiting for admin action...")}
            </span>
          )}
        </div>
        <ChevronUp
          className={`h-3 w-3 text-gray-500 transition-transform ${isExpanded ? "" : "rotate-180"}`}
        />
      </button>

      {/* Expanded log area */}
      {isExpanded && (
        <div className="max-h-48 space-y-1 overflow-y-auto px-4 pb-3 text-[11px] scrollbar-none">
          {logs.length === 0 ? (
            <div className="text-gray-600">
              {"> Waiting for admin action..."}
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
          {isBusy && (
            <div className="animate-pulse text-gray-500">
              {"> Processing..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
