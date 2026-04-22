export type Language = "en" | "zh" | "ja";
export type LegacyLanguage = Language | "jp";
export type TrackType = "portfolio" | "personal";
export type SourceType = "upload" | "recording" | "external-upload";
export type Visibility = "public" | "private" | "unlisted";
export type AssetStatus = "draft" | "ready" | "archived";

export type SongMetadata = {
  [key: string]: string | number;
};

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  tags: string[];
  duration: number;
  lyrics: string;
  audioUrl: string;
  metadata: SongMetadata;
  language: LegacyLanguage;
  trackType: TrackType;
  sourceType: SourceType;
  visibility: Visibility;
  assetStatus: AssetStatus;
}
