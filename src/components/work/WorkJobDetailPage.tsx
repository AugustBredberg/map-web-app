"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Spinner } from "@heroui/react";
import { fetchProjectById } from "@/lib/projects";
import type { Project } from "@/lib/supabase";
import WorkJobDetailView from "@/components/work/WorkJobDetailView";
import { useLocale } from "@/context/LocaleContext";

type Props = {
  projectId: string;
};

export default function WorkJobDetailPage({ projectId }: Props) {
  const { t } = useLocale();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await fetchProjectById(projectId);
      if (error || !data) {
        setProject(null);
        setNotFound(true);
      } else {
        setProject(data);
      }
      setLoading(false);
    };
    load();
  }, [projectId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-20 flex shrink-0 items-center gap-2 border-b border-border bg-background/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Link
          href="/work"
          className="inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-foreground hover:bg-muted-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label={t("work.backToWork")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1 py-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("work.detailTitle")}</p>
          <h1 className="truncate text-lg font-bold leading-tight text-foreground">
            {project?.title ?? (loading ? "…" : "")}
          </h1>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-5 pb-8">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Spinner color="primary" size="lg" />
            </div>
          )}

          {!loading && notFound && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              {t("work.notFound")}
            </p>
          )}

          {!loading && project && (
            <WorkJobDetailView project={project} onProjectUpdated={(updated) => setProject(updated)} />
          )}
        </div>
      </div>
    </div>
  );
}
