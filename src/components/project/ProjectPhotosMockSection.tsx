"use client";

import { useId, useState } from "react";
import { Button, Input } from "@heroui/react";
import { useLocale } from "@/context/LocaleContext";
import FullscreenImageViewer from "@/components/ui/FullscreenImageViewer";

type MockImageComment = { id: string; text: string; author: string };

type MockImage = {
  id: string;
  title: string;
  comments: MockImageComment[];
};

function randomId() {
  return `mock-${Math.random().toString(36).slice(2, 10)}`;
}

interface Props {
  /** Omit outer section chrome when nested inside another panel (e.g. admin job details). */
  embedded?: boolean;
  /** `installer` = larger tap targets and field-style framing for /work. */
  variant?: "default" | "installer";
}

/**
 * Placeholder UI for future on-site photo uploads. State is local only.
 */
export default function ProjectPhotosMockSection({ embedded = false, variant = "default" }: Props) {
  const { t } = useLocale();
  const labelId = useId();
  const [images, setImages] = useState<MockImage[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);

  const addMockPhoto = () => {
    setImages((prev) => [
      ...prev,
      {
        id: randomId(),
        title: `${t("projectDetails.mockPhotoTitlePrefix")} ${prev.length + 1}`,
        comments: [],
      },
    ]);
  };

  const addComment = (imageId: string) => {
    const text = (commentDrafts[imageId] ?? "").trim();
    if (!text) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? {
              ...img,
              comments: [
                ...img.comments,
                { id: randomId(), text, author: t("projectDetails.mockPhotoYou") },
              ],
            }
          : img,
      ),
    );
    setCommentDrafts((d) => ({ ...d, [imageId]: "" }));
  };

  const fullscreenImage = fullscreenId ? images.find((i) => i.id === fullscreenId) : undefined;

  const shell =
    embedded
      ? "space-y-3"
      : variant === "installer"
        ? "rounded-xl border border-border bg-surface p-4"
        : "rounded-2xl border-2 border-dashed border-border bg-surface/80 p-4";

  /** Only used when `variant !== "installer"` (installer uses the page-level section title). */
  const headingClass = "text-xs font-bold uppercase tracking-widest text-muted";

  const Root = embedded ? "div" : "section";

  const installerOuterLabel = variant === "installer" && !embedded;

  return (
    <Root
      className={shell}
      aria-labelledby={embedded || installerOuterLabel ? undefined : labelId}
      aria-label={installerOuterLabel ? t("projectDetails.photosTitle") : undefined}
    >
      {!embedded && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {variant === "installer" ? (
            <>
              <p className="min-w-0 flex-1 text-sm text-foreground/80">{t("projectDetails.photosMockHint")}</p>
              <Button
                size="md"
                color="primary"
                variant="bordered"
                className="min-h-11 shrink-0 font-semibold"
                onPress={addMockPhoto}
              >
                {t("projectDetails.mockAddPhoto")}
              </Button>
            </>
          ) : (
            <>
              <div>
                <h3 id={labelId} className={headingClass}>
                  {t("projectDetails.photosTitle")}
                </h3>
                <p className="mt-1 text-xs text-muted">{t("projectDetails.photosMockHint")}</p>
              </div>
              <Button size="sm" variant="bordered" className="font-semibold" onPress={addMockPhoto}>
                {t("projectDetails.mockAddPhoto")}
              </Button>
            </>
          )}
        </div>
      )}
      {embedded && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button size="sm" variant="bordered" onPress={addMockPhoto}>
            {t("projectDetails.mockAddPhoto")}
          </Button>
        </div>
      )}

      {images.length === 0 ? (
        <p className="text-sm text-muted">{t("projectDetails.photosEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {images.map((img) => (
            <li key={img.id} className="overflow-hidden rounded-xl border border-border bg-background">
              <div className="flex gap-3 p-3">
                <Button
                  type="button"
                  variant="light"
                  className="h-20 w-20 min-h-20 min-w-20 shrink-0 overflow-hidden rounded-lg p-0"
                  aria-label={t("projectDetails.openPhotoFullscreen")}
                  onPress={() => setFullscreenId(img.id)}
                >
                  <span
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-medium text-slate-600 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300"
                    aria-hidden
                  >
                    IMG
                  </span>
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{img.title}</p>
                  <p className="text-xs text-muted">{t("projectDetails.mockPhotoCaption")}</p>
                </div>
              </div>
              {img.comments.length > 0 ? (
                <ul className="space-y-1 border-t border-border bg-muted-bg/40 px-3 py-2 dark:bg-muted-bg/20">
                  {img.comments.map((c) => (
                    <li key={c.id} className="text-sm">
                      <span className="font-medium text-foreground">{c.author}: </span>
                      <span className="text-foreground/90">{c.text}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="flex flex-col gap-2 border-t border-border p-3">
                <Input
                  size="sm"
                  variant="bordered"
                  placeholder={t("projectDetails.mockPhotoCommentPlaceholder")}
                  value={commentDrafts[img.id] ?? ""}
                  onValueChange={(v) => setCommentDrafts((d) => ({ ...d, [img.id]: v }))}
                  aria-label={t("projectDetails.mockPhotoCommentPlaceholder")}
                />
                <Button size="sm" variant="flat" className="self-start font-semibold" onPress={() => addComment(img.id)}>
                  {t("projectDetails.mockPhotoAddComment")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FullscreenImageViewer
        isOpen={fullscreenId !== null && !!fullscreenImage}
        title={fullscreenImage?.title ?? ""}
        onClose={() => setFullscreenId(null)}
      >
        {fullscreenImage ? (
          <div
            className="flex aspect-square w-[min(100%,min(85dvh,85vw))] max-w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 text-5xl font-semibold text-slate-600 shadow-lg dark:from-slate-700 dark:to-slate-800 dark:text-slate-300 sm:text-6xl"
            role="img"
            aria-label={fullscreenImage.title}
          >
            IMG
          </div>
        ) : null}
      </FullscreenImageViewer>
    </Root>
  );
}
