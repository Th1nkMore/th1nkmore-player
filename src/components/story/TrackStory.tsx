"use client";

import { ChevronDown, Mic2, Music2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { CreatorNoteAudioPlayer } from "@/components/story/CreatorNoteAudioPlayer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/audio";
import type { Song } from "@/types/music";

type TrackStoryProps = {
  className?: string;
  song: Song;
};

function StoryDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(5rem,0.35fr)_minmax(0,1fr)] gap-3 py-2 text-xs">
      <dt className="font-mono text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{value}</dd>
    </div>
  );
}

export function TrackStory({ className, song }: TrackStoryProps) {
  const t = useTranslations("inspector");
  const note = song.creatorNote;
  const hasCreatorNote = Boolean(
    note?.body || note?.audioUrl || note?.audioTranscript,
  );
  const metadataEntries = Object.entries(song.metadata).filter(
    ([, value]) => String(value).trim().length > 0,
  );
  const performanceType = song.performanceType ?? "cover";

  return (
    <article
      className={cn("mx-auto w-full max-w-2xl px-5 py-6 font-sans", className)}
    >
      <header>
        <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1">
            {t(`performanceType.${performanceType}`)}
          </span>
          <span>{song.language.toUpperCase()}</span>
        </div>

        <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          {song.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("performedBy", { artist: song.artist })}
          {song.originalArtist
            ? ` · ${t("originalBy", { artist: song.originalArtist })}`
            : ""}
        </p>
      </header>

      {hasCreatorNote && (
        <section className="mt-8" aria-labelledby={`creator-note-${song.id}`}>
          <div className="mb-4 flex items-center gap-2">
            <Mic2 className="size-4 text-primary" aria-hidden="true" />
            <h2
              id={`creator-note-${song.id}`}
              className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground"
            >
              {t("creatorNote")}
            </h2>
          </div>

          {note?.audioUrl && <CreatorNoteAudioPlayer song={song} />}

          {note?.body && (
            <div className="mt-5 whitespace-pre-wrap text-pretty text-[15px] leading-7 text-foreground/90">
              {note.body}
            </div>
          )}

          {note?.audioTranscript && (
            <details className="group mt-5 rounded-md border border-border/70 bg-muted/25">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
                <span>{t("transcript")}</span>
                <ChevronDown
                  className="size-4 transition-transform duration-150 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <Separator />
              <p className="whitespace-pre-wrap px-3 py-4 text-sm leading-6 text-muted-foreground">
                {note.audioTranscript}
              </p>
            </details>
          )}
        </section>
      )}

      <section className="mt-8" aria-labelledby={`track-details-${song.id}`}>
        <div className="mb-3 flex items-center gap-2">
          <Music2 className="size-4 text-primary" aria-hidden="true" />
          <h2
            id={`track-details-${song.id}`}
            className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground"
          >
            {t("details")}
          </h2>
        </div>

        {song.tags.length > 0 && (
          <ul className="mb-4 flex flex-wrap gap-2" aria-label={t("tags")}>
            {song.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-border bg-muted/50 px-2.5 py-1 font-mono text-[10px] text-muted-foreground"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}

        <dl className="divide-y divide-border/70 border-y border-border/70">
          <StoryDetail label={t("albumLabel")} value={song.album} />
          <StoryDetail
            label={t("durationLabel")}
            value={formatDuration(song.duration)}
          />
          {metadataEntries.map(([key, value]) => (
            <StoryDetail key={key} label={key} value={String(value)} />
          ))}
        </dl>
      </section>
    </article>
  );
}
