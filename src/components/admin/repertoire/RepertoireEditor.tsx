"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SONG_LANGUAGES } from "@/types/music";
import type { RepertoireEntry, RepertoireRecording } from "@/types/repertoire";

const inputClass =
  "min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary";

function ListField({
  name,
  values,
  onChange,
}: {
  name: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [raw, setRaw] = useState(values.join(", "));
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs text-muted-foreground">
        {name}
      </label>
      <Input
        id={id}
        value={raw}
        className={inputClass}
        onChange={(event) => {
          setRaw(event.target.value);
          onChange(
            event.target.value
              .split(/[,，;；]/)
              .map((value) => value.trim())
              .filter(Boolean),
          );
        }}
      />
    </div>
  );
}

export function RepertoireEditor({
  draft,
  recordings,
  saving,
  onChange,
  onSave,
}: {
  draft: RepertoireEntry;
  recordings: RepertoireRecording[];
  saving: boolean;
  onChange: (entry: RepertoireEntry) => void;
  onSave: () => void;
}) {
  const t = useTranslations("repertoire");
  const id = useId();
  const patch = (data: Partial<RepertoireEntry>) =>
    onChange({ ...draft, ...data });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <fieldset
        disabled={saving}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5"
      >
        <div>
          <label
            htmlFor={`${id}-title`}
            className="mb-2 block text-xs text-muted-foreground"
          >
            {t("titleField")}
          </label>
          <Input
            id={`${id}-title`}
            value={draft.title}
            onChange={(event) => patch({ title: event.target.value })}
            required
            maxLength={240}
            className={inputClass}
          />
        </div>
        <ListField
          name={t("artists")}
          values={draft.originalArtists}
          onChange={(originalArtists) => patch({ originalArtists })}
        />
        <ListField
          name={t("styles")}
          values={draft.styles}
          onChange={(styles) => patch({ styles })}
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t("stylesHint")}
        </p>
        <ListField
          name={t("tags")}
          values={draft.tags}
          onChange={(tags) => patch({ tags })}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={`${id}-knowledge`}
              className="mb-2 block text-xs text-muted-foreground"
            >
              {t("knowledge")}
            </label>
            <select
              id={`${id}-knowledge`}
              value={draft.knowledge}
              className={inputClass}
              onChange={(event) =>
                patch({
                  knowledge: event.target.value as RepertoireEntry["knowledge"],
                })
              }
            >
              <option value="known">{t("known")}</option>
              <option value="learning">{t("learning")}</option>
            </select>
          </div>
          <div>
            <label
              htmlFor={`${id}-proficiency`}
              className="mb-2 block text-xs text-muted-foreground"
            >
              {t("proficiency")}
            </label>
            <select
              id={`${id}-proficiency`}
              value={draft.proficiency}
              className={inputClass}
              onChange={(event) =>
                patch({
                  proficiency: event.target
                    .value as RepertoireEntry["proficiency"],
                })
              }
            >
              <option value="unassessed">{t("unassessed")}</option>
              <option value="comfortable">{t("comfortable")}</option>
              <option value="review">{t("review")}</option>
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor={`${id}-language`}
            className="mb-2 block text-xs text-muted-foreground"
          >
            {t("language")}
          </label>
          <select
            id={`${id}-language`}
            value={draft.language ?? ""}
            className={inputClass}
            onChange={(event) =>
              patch({
                language: (event.target.value ||
                  null) as RepertoireEntry["language"],
              })
            }
          >
            {[
              "",
              ...SONG_LANGUAGES.filter((language) => language !== "unknown"),
            ].map((value) => (
              <option key={value} value={value}>
                {t(`languages.${value || "unknown"}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`${id}-learned`}
            className="mb-2 block text-xs text-muted-foreground"
          >
            {t("learnedOn")}
          </label>
          <Input
            id={`${id}-learned`}
            type="date"
            value={draft.learnedOn ?? ""}
            onChange={(event) =>
              patch({ learnedOn: event.target.value || null })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor={`${id}-note`}
            className="mb-2 block text-xs text-muted-foreground"
          >
            {t("note")}
          </label>
          <textarea
            id={`${id}-note`}
            value={draft.note}
            onChange={(event) => patch({ note: event.target.value })}
            maxLength={10000}
            rows={4}
            className={`${inputClass} py-3`}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("privateNote")}
          </p>
        </div>
        <fieldset className="border-t border-border pt-4">
          <legend className="pr-2 text-xs text-muted-foreground">
            {t("versions")}
          </legend>
          {recordings.length ? (
            <ul className="space-y-3">
              {recordings.map((recording) => (
                <li
                  key={recording.id}
                  className="flex justify-between gap-3 text-xs"
                >
                  <span className="min-w-0 break-words">{recording.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {t(recording.published ? "published" : "recorded")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">{t("noRecording")}</p>
          )}
        </fieldset>
        <label className="flex min-h-11 items-center gap-3 text-xs">
          <input
            type="checkbox"
            checked={draft.archived}
            onChange={(event) => patch({ archived: event.target.checked })}
            className="size-4 accent-current"
          />
          {t("archiveEntry")}
        </label>
      </fieldset>
      <div className="shrink-0 border-t border-border bg-sidebar px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button type="submit" className="min-h-11 w-full" disabled={saving}>
          {t(saving ? "saving" : "save")}
        </Button>
      </div>
    </form>
  );
}
