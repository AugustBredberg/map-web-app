"use client";

import { useEffect, useState } from "react";
import { Button, Textarea } from "@heroui/react";
import { addProjectComment, fetchProjectComments, type ProjectComment } from "@/lib/projectComments";
import { useLocale } from "@/context/LocaleContext";

interface Props {
  projectId: string;
  currentUserId: string | undefined;
}

function formatCommentTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "sv" ? "sv-SE" : "en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProjectCommentsSection({ projectId, currentUserId }: Props) {
  const { t, locale } = useLocale();
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProjectComments(projectId).then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (error) {
        setLoadError(error);
        setComments([]);
        return;
      }
      setLoadError(null);
      const rows = data ?? [];
      const deduped = [...new Map(rows.map((c) => [c.id, c])).values()];
      setComments(deduped);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handlePost = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setPosting(true);
    setPostError(null);
    const { data, error } = await addProjectComment(projectId, trimmed);
    setPosting(false);
    if (error || !data) {
      setPostError(error === "empty" ? t("projectDetails.commentEmpty") : error ?? t("projectDetails.commentPostFailed"));
      return;
    }
    setComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]));
    setDraft("");
  };

  const shell = "rounded-xl border border-border bg-surface p-4";
  /** Aligned with Work section titles and AdminPanelSection. */
  const headingClass = "mb-3 text-sm font-semibold uppercase tracking-wide text-muted";

  return (
    <section className={shell} aria-labelledby="project-comments-heading">
      <h3 id="project-comments-heading" className={headingClass}>
        {t("projectDetails.commentsTitle")}
      </h3>

      {loadError ? (
        <p className="mb-3 text-sm text-red-600">{loadError}</p>
      ) : loading ? (
        <div className="mb-3 space-y-2 animate-pulse">
          <div className="h-12 rounded-lg bg-muted-bg" />
          <div className="h-12 rounded-lg bg-muted-bg" />
        </div>
      ) : comments.length === 0 ? (
        <p className="mb-3 text-sm text-muted">{t("projectDetails.commentsEmpty")}</p>
      ) : (
        <ul className="mb-4 flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {comments.map((c) => {
            const isYou = currentUserId && c.created_by === currentUserId;
            const who = isYou ? t("projectDetails.commentYou") : c.author_display_name?.trim() || t("projectDetails.commentTeammate");
            return (
              <li key={c.id} className="rounded-lg border border-border/60 bg-muted-bg px-3 py-2.5 dark:bg-muted-bg/40">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                  <span className="text-sm font-semibold text-foreground">{who}</span>
                  <time className="text-xs text-muted" dateTime={c.created_at}>
                    {formatCommentTime(c.created_at, locale)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{c.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          aria-label={t("projectDetails.commentPlaceholder")}
          placeholder={t("projectDetails.commentPlaceholder")}
          value={draft}
          onValueChange={setDraft}
          minRows={2}
          variant="bordered"
          isDisabled={posting}
        />
        {postError ? <p className="text-sm text-red-600">{postError}</p> : null}
        <Button color="primary" className="font-semibold" isLoading={posting} isDisabled={!draft.trim()} onPress={handlePost}>
          {t("projectDetails.commentPost")}
        </Button>
      </div>
    </section>
  );
}
