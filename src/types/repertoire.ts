import type { Language } from "@/types/music";

export type RepertoireEntry = {
  id: string;
  title: string;
  originalArtists: string[];
  styles: string[];
  tags: string[];
  language: Language | null;
  knowledge: "known" | "learning";
  proficiency: "unassessed" | "comfortable" | "review";
  note: string;
  recordingIds: string[];
  learnedOn: string | null;
  addedAt: string;
  updatedAt: string;
  archived: boolean;
};

export type RepertoireRecording = {
  id: string;
  title: string;
  originalArtist: string;
  repertoireId?: string;
  language: Language;
  styles?: string[];
  recorded: boolean;
  published: boolean;
};

export type RepertoireSnapshot = {
  entries: RepertoireEntry[];
  revision: string;
  recordings: RepertoireRecording[];
};

export type RepertoireHistory = { key: string; savedAt: string; count: number };
