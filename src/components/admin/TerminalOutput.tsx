"use client";

import type { Song } from "@/types/music";

type LogEntry = {
  id: string;
  message: string;
  timestamp: Date;
};

type TerminalOutputProps = {
  logs: LogEntry[];
  isDeploying: boolean;
};

export function TerminalOutput({ logs, isDeploying }: TerminalOutputProps) {
  return (
    <div className="flex flex-col bg-black overflow-hidden">
      <div className="border-b border-gray-800 px-4 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          TERMINAL OUTPUT
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-1 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="text-gray-600">{"> Waiting for deployment..."}</div>
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
          <div className="text-gray-500 animate-pulse">{"> Processing..."}</div>
        )}
      </div>
    </div>
  );
}
