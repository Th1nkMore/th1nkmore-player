export type CoverRevisionView = {
  revisionId: string;
  parentRevisionId?: string;
  number: number;
  kind: "initial" | "mix" | "performance" | "lyrics" | "other";
  note?: string;
  state: "draft" | "active" | "superseded" | "archived";
  packageId: string;
  audioSha256: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
};

export type CoverRevisionLedgerView = {
  projectId: string;
  songId: string;
  activeRevisionId?: string;
  updatedAt: string;
  revisions: CoverRevisionView[];
};

async function parseResponse(response: Response) {
  const payload = (await response.json()) as {
    ledger?: CoverRevisionLedgerView | null;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "版本请求失败。");
  }
  return payload.ledger || null;
}

export async function fetchCoverRevisions(songId: string) {
  const response = await fetch(
    `/api/admin/cover-revisions?songId=${encodeURIComponent(songId)}`,
    { cache: "no-store" },
  );
  return parseResponse(response);
}

export async function updateCoverRevision(input: {
  songId: string;
  revisionId: string;
  action: "promote" | "archive";
}) {
  const response = await fetch("/api/admin/cover-revisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse(response);
}
